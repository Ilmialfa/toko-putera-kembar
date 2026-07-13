<?php

namespace App\Domain\Sales\Controllers;

use App\Domain\Sales\Actions\ProcessRefundAction;
use App\Http\Controllers\Controller;
use App\Models\SaleReturn;
use Illuminate\Http\Request;

class SaleReturnController extends Controller
{
    public function index(Request $request)
    {
        $query = SaleReturn::with(['sale', 'items.saleItem.product', 'creator'])
            ->whereHas('sale', function ($q) use ($request) {
                $q->where('store_id', $request->user()->store_id);
            });

        return response()->json([
            'data' => $query->latest()->paginate(15),
        ]);
    }

    public function store(Request $request, ProcessRefundAction $action)
    {
        $validated = $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'type' => 'required|string|in:return,exchange',
            'total_refund_amount' => 'required|numeric|min:0',
            'exchange_sale_id' => 'nullable|exists:sales,id',
            'items' => 'required|array|min:1',
            'items.*.sale_item_id' => 'required|exists:sale_items,id',
            'items.*.qty' => 'required|numeric|min:0.001',
            'items.*.condition' => 'required|string|in:good,damaged',
        ]);

        $saleReturn = $action->execute($validated, $request->user()->id);

        return response()->json([
            'message' => 'Return/Refund request submitted for approval',
            'sale_return' => $saleReturn,
        ]);
    }

    // In a real app we'd have approve/reject endpoints, but for the basic flow this is sufficient
}
