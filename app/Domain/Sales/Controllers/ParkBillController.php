<?php

namespace App\Domain\Sales\Controllers;

use App\Domain\Sales\Actions\ParkBillAction;
use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\Request;

class ParkBillController extends Controller
{
    public function index(Request $request)
    {
        $shiftId = $request->query('cashier_shift_id');
        $query = Sale::where('store_id', $request->user()->store_id)
            ->where('status', 'parked')
            ->with('items.product');

        if ($shiftId) {
            $query->where('cashier_shift_id', $shiftId);
        }

        return response()->json([
            'data' => $query->latest()->get(),
        ]);
    }

    public function store(Request $request, ParkBillAction $action)
    {
        $validated = $request->validate([
            'cashier_shift_id' => 'required|exists:cashier_shifts,id',
            'customer_id' => 'nullable|exists:users,id',
            'subtotal' => 'required|numeric|min:0',
            'discount_total' => 'required|numeric|min:0',
            'tax_total' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,id',
            'items.*.unit_id' => 'required|exists:units,id',
            'items.*.qty' => 'required|numeric|min:0.001',
            'items.*.price_per_unit' => 'required|numeric|min:0',
            'items.*.discount_amount' => 'required|numeric|min:0',
            'items.*.subtotal' => 'required|numeric|min:0',
        ]);

        $sale = $action->execute(
            $validated,
            $request->user()->id,
            $request->user()->store_id
        );

        return response()->json([
            'message' => 'Bill parked successfully',
            'sale' => $sale,
        ]);
    }

    public function destroy(Sale $sale)
    {
        // Cancel a parked bill
        if ($sale->status !== 'parked') {
            abort(403, 'Can only delete parked bills');
        }
        $sale->delete();

        return response()->json(['message' => 'Parked bill deleted']);
    }
}
