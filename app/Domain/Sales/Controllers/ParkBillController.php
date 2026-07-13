<?php

namespace App\Domain\Sales\Controllers;

use App\Domain\Sales\Actions\ParkBillAction;
use App\Http\Controllers\Controller;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ParkBillController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $shiftId = $request->query('cashier_shift_id');
        $query = Sale::where('store_id', $request->user()->store_id)
            ->where('status', 'parked')
            ->where('created_by', $request->user()->id)
            ->with(['customer:id,name,phone', 'items.product.baseUnit', 'items.unit']);

        if ($shiftId) {
            $query->where('cashier_shift_id', $shiftId);
        }

        return response()->json([
            'data' => $query->latest()->get(),
        ]);
    }

    public function store(Request $request, ParkBillAction $action): JsonResponse
    {
        $validated = $request->validate([
            'cashier_shift_id' => [
                'required',
                Rule::exists('cashier_shifts', 'id')
                    ->where('user_id', $request->user()->id)
                    ->where('store_id', $request->user()->store_id)
                    ->where('status', 'open'),
            ],
            'customer_id' => 'nullable|exists:customers,id',
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
            'message' => 'Transaksi berhasil ditahan.',
            'sale' => $sale,
        ]);
    }

    public function destroy(Request $request, Sale $parkedBill): JsonResponse
    {
        abort_unless(
            (int) $parkedBill->store_id === (int) $request->user()->store_id
                && (int) $parkedBill->created_by === (int) $request->user()->id
                && $parkedBill->status === 'parked',
            403,
            'Hanya transaksi ditahan milik Anda dari toko ini yang dapat dibatalkan.',
        );

        $parkedBill->delete();

        return response()->json([
            'message' => 'Transaksi ditahan berhasil dibatalkan.',
        ]);
    }
}
