<?php

namespace App\Domain\Inventory\Controllers;

use App\Domain\Inventory\Actions\ReceiveStockAction;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\StockIn;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Models\Unit;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class StockInController extends Controller
{
    public function index()
    {
        $stockIns = StockIn::with(['supplier', 'warehouse', 'creator'])->latest()->paginate(10);

        return Inertia::render('inventory/stock-ins/Index', [
            'stockIns' => $stockIns,
        ]);
    }

    public function create()
    {
        $suppliers = Supplier::where('is_active', true)->get();
        $warehouses = Warehouse::where('is_active', true)->get();
        $products = Product::where('is_active', true)->with('units')->get();
        $units = Unit::all();

        return Inertia::render('inventory/stock-ins/Create', [
            'suppliers' => $suppliers,
            'warehouses' => $warehouses,
            'products' => $products,
            'units' => $units,
        ]);
    }

    public function store(Request $request, ReceiveStockAction $action)
    {
        $validated = $request->validate([
            'supplier_id' => 'required|exists:suppliers,id',
            'warehouse_id' => 'required|exists:warehouses,id',
            'invoice_number' => 'nullable|string|max:100',
            'payment_status' => 'required|in:paid,credit,partial',
            'paid_amount' => 'required_if:payment_status,partial|numeric|min:0',
            'due_date' => 'required_if:payment_status,credit,partial|nullable|date',
            'details' => 'required|array|min:1',
            'details.*.product_id' => 'required|exists:products,id',
            'details.*.unit_id' => 'required|exists:units,id',
            'details.*.qty' => 'required|numeric|min:0.001',
            'details.*.purchase_price_per_unit' => 'required|numeric|min:0',
            'details.*.batch_number' => 'nullable|string|max:100',
            'details.*.expiry_date' => 'nullable|date',
        ]);

        DB::transaction(function () use ($validated, $action) {
            $totalAmount = 0;
            foreach ($validated['details'] as $detail) {
                $totalAmount += $detail['qty'] * $detail['purchase_price_per_unit'];
            }

            $paidAmount = 0;
            if ($validated['payment_status'] === 'paid') {
                $paidAmount = $totalAmount;
            } elseif ($validated['payment_status'] === 'partial') {
                $paidAmount = $validated['paid_amount'] ?? 0;
            }

            $stockIn = StockIn::create([
                'store_id' => auth()->user()->store_id,
                'supplier_id' => $validated['supplier_id'],
                'warehouse_id' => $validated['warehouse_id'],
                'invoice_number' => $validated['invoice_number'],
                'status' => 'draft',
                'total_amount' => $totalAmount,
                'payment_status' => $validated['payment_status'],
                'paid_amount' => $paidAmount,
                'due_date' => in_array($validated['payment_status'], ['credit', 'partial']) ? $validated['due_date'] : null,
                'created_by' => auth()->id(),
            ]);

            if ($paidAmount > 0) {
                SupplierPayment::create([
                    'store_id' => auth()->user()->store_id,
                    'supplier_id' => $validated['supplier_id'],
                    'stock_in_id' => $stockIn->id,
                    'amount' => $paidAmount,
                    'payment_date' => now()->toDateString(),
                    'payment_method' => 'cash', // default or you can add to form
                    'notes' => 'Pembayaran awal saat penerimaan',
                    'created_by' => auth()->id(),
                ]);
            }

            foreach ($validated['details'] as $detail) {
                $stockIn->details()->create($detail);
            }

            // Immediately process it
            $action->execute($stockIn);
        });

        return redirect()->route('admin.inventory.stock-ins.index')->with('success', 'Barang masuk berhasil dicatat dan HPP telah diperbarui.');
    }

    public function show(StockIn $stockIn)
    {
        $stockIn->load(['supplier', 'warehouse', 'creator', 'details.product', 'details.unit']);

        return Inertia::render('inventory/stock-ins/Show', [
            'stockIn' => $stockIn,
        ]);
    }
}
