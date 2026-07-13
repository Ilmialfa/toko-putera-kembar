<?php

namespace App\Domain\Inventory\Controllers;

use App\Domain\Inventory\Services\InventoryOperationService;
use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\PurchaseOrder;
use App\Models\StockOpname;
use App\Models\StockOutAdjustment;
use App\Models\StockTransfer;
use App\Models\Supplier;
use App\Models\SupplierReturn;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class InventoryOperationController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('inventory/operations/Index', [
            'purchaseOrders' => PurchaseOrder::query()->with(['supplier:id,name', 'warehouse:id,name', 'items.product:id,name'])->latest()->limit(20)->get(),
            'transfers' => StockTransfer::query()->with(['fromWarehouse:id,name', 'toWarehouse:id,name', 'details.product:id,name'])->latest()->limit(20)->get(),
            'opnames' => StockOpname::query()->with(['warehouse:id,name', 'details.product:id,name'])->latest()->limit(20)->get(),
            'adjustments' => StockOutAdjustment::query()->with(['warehouse:id,name', 'product:id,name', 'unit:id,name,symbol'])->latest()->limit(20)->get(),
            'supplierReturns' => SupplierReturn::query()->with(['supplier:id,name', 'warehouse:id,name', 'items.product:id,name'])->latest()->limit(20)->get(),
            'products' => Product::query()->with(['baseUnit:id,name,symbol', 'productUnits.unit:id,name,symbol'])->where('is_active', true)->orderBy('name')->get(['id', 'name', 'sku', 'base_unit_id', 'stok_saat_ini']),
            'warehouses' => Warehouse::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'suppliers' => Supplier::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function storePurchaseOrder(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'supplier_id' => ['required', 'exists:suppliers,id'], 'warehouse_id' => ['required', 'exists:warehouses,id'],
            'expected_date' => ['nullable', 'date'], 'notes' => ['nullable', 'string', 'max:2000'],
            'items' => ['required', 'array', 'min:1'], 'items.*.product_id' => ['required', 'exists:products,id'],
            'items.*.unit_id' => ['required', 'exists:units,id'], 'items.*.qty_ordered' => ['required', 'numeric', 'gt:0'],
            'items.*.price_per_unit' => ['required', 'numeric', 'min:0'],
        ]);
        DB::transaction(function () use ($data, $request): void {
            $total = collect($data['items'])->sum(fn (array $item): float => (float) $item['qty_ordered'] * (float) $item['price_per_unit']);
            $po = PurchaseOrder::query()->create([
                ...collect($data)->except('items')->all(), 'store_id' => $request->user()->store_id,
                'po_number' => 'PO-'.now()->format('Ym').'-'.Str::upper(Str::random(6)), 'status' => 'draft',
                'total_amount' => round($total, 2), 'created_by' => $request->user()->id,
            ]);
            $po->items()->createMany($data['items']);
        });

        return back()->with('success', 'Purchase order berhasil dibuat.');
    }

    public function updatePurchaseOrderStatus(Request $request, PurchaseOrder $purchaseOrder): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['sent', 'cancelled'])]]);
        abort_unless($purchaseOrder->status === 'draft', 409);
        $purchaseOrder->update($data);

        return back()->with('success', 'Status purchase order diperbarui.');
    }

    public function storeTransfer(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'from_warehouse_id' => ['required', 'different:to_warehouse_id', 'exists:warehouses,id'], 'to_warehouse_id' => ['required', 'exists:warehouses,id'],
            'notes' => ['nullable', 'string'], 'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'exists:products,id'], 'items.*.unit_id' => ['required', 'exists:units,id'], 'items.*.qty' => ['required', 'numeric', 'gt:0'],
        ]);
        DB::transaction(function () use ($data, $request): void {
            $transfer = StockTransfer::query()->create([
                ...collect($data)->except('items')->all(), 'store_id' => $request->user()->store_id,
                'transfer_number' => 'TRF-'.now()->format('Ym').'-'.Str::upper(Str::random(6)), 'status' => 'draft', 'requested_by' => $request->user()->id,
            ]);
            $transfer->details()->createMany($data['items']);
        });

        return back()->with('success', 'Transfer gudang dibuat sebagai draft.');
    }

    public function transitionTransfer(Request $request, StockTransfer $stockTransfer, InventoryOperationService $service): RedirectResponse
    {
        $data = $request->validate(['status' => ['required', Rule::in(['in_transit', 'received', 'cancelled'])]]);
        $service->transitionTransfer($stockTransfer, $data['status'], $request->user()->id);

        return back()->with('success', 'Status transfer dan stock ledger berhasil diperbarui.');
    }

    public function storeOpname(Request $request): RedirectResponse
    {
        $data = $request->validate(['warehouse_id' => ['required', 'exists:warehouses,id'], 'scheduled_date' => ['required', 'date'], 'scope_type' => ['required', Rule::in(['full', 'partial'])], 'scope_ids' => ['nullable', 'array'], 'notes' => ['nullable', 'string']]);
        StockOpname::query()->create([...$data, 'store_id' => $request->user()->store_id, 'opname_number' => 'OPN-'.now()->format('Ym').'-'.Str::upper(Str::random(6)), 'status' => 'draft']);

        return back()->with('success', 'Jadwal stock opname berhasil dibuat.');
    }

    public function completeOpname(Request $request, StockOpname $stockOpname, InventoryOperationService $service): RedirectResponse
    {
        $data = $request->validate(['counts' => ['required', 'array', 'min:1'], 'counts.*.product_id' => ['required', 'exists:products,id'], 'counts.*.physical_qty' => ['required', 'numeric', 'min:0'], 'counts.*.notes' => ['nullable', 'string']]);
        $service->completeOpname($stockOpname, $data['counts'], $request->user()->id);

        return back()->with('success', 'Stock opname selesai dan selisih sudah masuk ledger.');
    }

    public function storeAdjustment(Request $request): RedirectResponse
    {
        $data = $request->validate(['warehouse_id' => ['required', 'exists:warehouses,id'], 'product_id' => ['required', 'exists:products,id'], 'unit_id' => ['required', 'exists:units,id'], 'qty' => ['required', 'numeric', 'gt:0'], 'reason_type' => ['required', Rule::in(['waste', 'damaged', 'lost', 'internal_use'])], 'notes' => ['required', 'string', 'max:2000']]);
        StockOutAdjustment::query()->create([...$data, 'store_id' => $request->user()->store_id, 'status' => 'pending', 'created_by' => $request->user()->id]);

        return back()->with('success', 'Adjustment menunggu persetujuan.');
    }

    public function approveAdjustment(Request $request, StockOutAdjustment $stockOutAdjustment, InventoryOperationService $service): RedirectResponse
    {
        abort_unless($request->user()->can('inventory.adjustment.approve'), 403);
        $service->approveAdjustment($stockOutAdjustment, $request->user()->id);

        return back()->with('success', 'Adjustment disetujui dan stok dikurangi.');
    }

    public function storeSupplierReturn(Request $request): RedirectResponse
    {
        $data = $request->validate(['supplier_id' => ['required', 'exists:suppliers,id'], 'warehouse_id' => ['required', 'exists:warehouses,id'], 'notes' => ['required', 'string'], 'items' => ['required', 'array', 'min:1'], 'items.*.product_id' => ['required', 'exists:products,id'], 'items.*.unit_id' => ['required', 'exists:units,id'], 'items.*.qty' => ['required', 'numeric', 'gt:0'], 'items.*.price_per_unit' => ['required', 'numeric', 'min:0']]);
        DB::transaction(function () use ($data, $request): void {
            $total = collect($data['items'])->sum(fn (array $item): float => (float) $item['qty'] * (float) $item['price_per_unit']);
            $return = SupplierReturn::query()->create([...collect($data)->except('items')->all(), 'store_id' => $request->user()->store_id, 'return_number' => 'RTS-'.now()->format('Ym').'-'.Str::upper(Str::random(6)), 'status' => 'draft', 'total_amount' => round($total, 2), 'created_by' => $request->user()->id]);
            $return->items()->createMany($data['items']);
        });

        return back()->with('success', 'Retur supplier dibuat sebagai draft.');
    }

    public function completeSupplierReturn(Request $request, SupplierReturn $supplierReturn, InventoryOperationService $service): RedirectResponse
    {
        $service->completeSupplierReturn($supplierReturn, $request->user()->id);

        return back()->with('success', 'Retur supplier selesai dan stok sudah dikurangi.');
    }
}
