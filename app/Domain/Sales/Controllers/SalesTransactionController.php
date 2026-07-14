<?php

namespace App\Domain\Sales\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SalesTransactionController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()->canAny(['pos.use', 'orders.view']), 403);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'channel' => ['nullable', 'in:all,pos,online'],
            'status' => ['nullable', 'in:all,completed,voided,refunded,partially_refunded'],
        ]);

        $transactions = Sale::query()
            ->where('store_id', $request->user()->store_id)
            ->whereIn('status', ['completed', 'voided', 'refunded', 'partially_refunded'])
            ->with(['customer:id,name,phone', 'creator:id,name'])
            ->when($filters['search'] ?? null, function ($query, string $search): void {
                $query->where(function ($searchQuery) use ($search): void {
                    $searchQuery
                        ->where('sale_number', 'like', "%{$search}%")
                        ->orWhereHas('customer', function ($customerQuery) use ($search): void {
                            $customerQuery
                                ->where('name', 'like', "%{$search}%")
                                ->orWhere('phone', 'like', "%{$search}%");
                        });
                });
            })
            ->when(($filters['channel'] ?? 'all') !== 'all', function ($query) use ($filters): void {
                $query->where('channel', $filters['channel']);
            })
            ->when(($filters['status'] ?? 'all') !== 'all', function ($query) use ($filters): void {
                $query->where('status', $filters['status']);
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('sales/Transactions', [
            'transactions' => $transactions,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'channel' => $filters['channel'] ?? 'all',
                'status' => $filters['status'] ?? 'all',
            ],
        ]);
    }

    public function show(Request $request, Sale $sale)
    {
        abort_unless($request->user()->canAny(['pos.use', 'orders.view']), 403);
        abort_if($sale->store_id !== $request->user()->store_id, 403);

        $sale->load([
            'items.product',
            'customer:id,name,phone',
            'creator:id,name',
        ]);

        return response()->json($sale);
    }
}
