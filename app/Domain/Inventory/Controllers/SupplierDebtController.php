<?php

namespace App\Domain\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Models\StockIn;
use App\Models\SupplierPayment;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SupplierDebtController extends Controller
{
    public function index()
    {
        // Get stock_ins where payment_status is 'credit' or 'partial'
        $debts = StockIn::with(['supplier'])
            ->whereIn('payment_status', ['credit', 'partial'])
            ->latest()
            ->paginate(15);

        return Inertia::render('inventory/supplier-debts/Index', [
            'debts' => $debts,
        ]);
    }

    public function pay(Request $request, StockIn $stockIn)
    {
        $validated = $request->validate([
            'amount' => 'required|numeric|min:1',
            'payment_date' => 'required|date',
            'payment_method' => 'required|string|max:50',
            'reference_number' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        DB::transaction(function () use ($validated, $stockIn) {
            $newPaidAmount = $stockIn->paid_amount + $validated['amount'];
            $newStatus = $newPaidAmount >= $stockIn->total_amount ? 'paid' : 'partial';

            $stockIn->update([
                'paid_amount' => $newPaidAmount,
                'payment_status' => $newStatus,
            ]);

            SupplierPayment::create([
                'store_id' => $stockIn->store_id,
                'supplier_id' => $stockIn->supplier_id,
                'stock_in_id' => $stockIn->id,
                'amount' => $validated['amount'],
                'payment_date' => $validated['payment_date'],
                'payment_method' => $validated['payment_method'],
                'reference_number' => $validated['reference_number'],
                'notes' => $validated['notes'],
                'created_by' => auth()->id(),
            ]);
        });

        return redirect()->back()->with('success', 'Pembayaran hutang berhasil dicatat.');
    }
}
