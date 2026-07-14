<?php

namespace App\Domain\Sales\Controllers;

use App\Domain\Sales\Actions\ProcessRefundAction;
use App\Http\Controllers\Controller;
use App\Models\SaleReturn;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SaleReturnController extends Controller
{
    public function index(Request $request): Response
    {
        $query = SaleReturn::with(['sale', 'items.saleItem.product', 'creator'])
            ->where('store_id', $request->user()->store_id);

        return Inertia::render('sales/Returns', [
            'returns' => $query->latest()->paginate(15)->withQueryString(),
        ]);
    }

    public function store(Request $request, ProcessRefundAction $action): RedirectResponse
    {
        $validated = $request->validate([
            'sale_id' => [
                'required',
                Rule::exists('sales', 'id')->where('store_id', $request->user()->store_id),
            ],
            'type' => 'required|string|in:return,exchange',
            'total_refund_amount' => 'required|numeric|min:0',
            'exchange_sale_id' => [
                'nullable',
                Rule::exists('sales', 'id')->where('store_id', $request->user()->store_id),
            ],
            'items' => 'required|array|min:1',
            'items.*.sale_item_id' => 'required|exists:sale_items,id',
            'items.*.qty' => 'required|numeric|min:0.001',
            'items.*.condition' => 'required|string|in:good,damaged',
        ]);

        $action->execute(
            $validated,
            $request->user()->id,
            $request->user()->store_id,
        );

        return back()->with('success', 'Pengajuan retur berhasil dikirim untuk persetujuan.');
    }

    // In a real app we'd have approve/reject endpoints, but for the basic flow this is sufficient
}
