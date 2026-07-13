<?php

namespace App\Domain\Inventory\Services;

use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\StockLedger;
use App\Models\StockOpname;
use App\Models\StockOutAdjustment;
use App\Models\StockTransfer;
use App\Models\SupplierReturn;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class InventoryOperationService
{
    public function transitionTransfer(StockTransfer $transfer, string $status, int $userId): StockTransfer
    {
        return DB::transaction(function () use ($transfer, $status, $userId): StockTransfer {
            $transfer = StockTransfer::query()->with('details.product')->lockForUpdate()->findOrFail($transfer->id);
            $allowed = ['draft' => ['in_transit', 'cancelled'], 'in_transit' => ['received']];
            if (! in_array($status, $allowed[$transfer->status] ?? [], true)) {
                throw ValidationException::withMessages(['status' => 'Transisi status transfer tidak valid.']);
            }

            if ($status === 'in_transit') {
                foreach ($transfer->details as $detail) {
                    $quantity = $this->baseQuantity($detail->product, (int) $detail->unit_id, (float) $detail->qty);
                    $this->ensureStock($detail->product, $quantity);
                    $this->ledger($transfer, $detail->product, (int) $transfer->from_warehouse_id, 'out', $quantity, $userId, 'Barang dalam perjalanan');
                }
                $transfer->approved_by = $userId;
            }

            if ($status === 'received') {
                foreach ($transfer->details as $detail) {
                    $quantity = $this->baseQuantity($detail->product, (int) $detail->unit_id, (float) $detail->qty);
                    $this->ledger($transfer, $detail->product, (int) $transfer->to_warehouse_id, 'in', $quantity, $userId, 'Transfer diterima');
                }
                $transfer->received_by = $userId;
            }

            $transfer->status = $status;
            $transfer->save();

            return $transfer->refresh();
        });
    }

    /** @param array<int,array{product_id:int,physical_qty:float,notes?:string}> $counts */
    public function completeOpname(StockOpname $opname, array $counts, int $userId): StockOpname
    {
        return DB::transaction(function () use ($opname, $counts, $userId): StockOpname {
            $opname = StockOpname::query()->lockForUpdate()->findOrFail($opname->id);
            if (! in_array($opname->status, ['draft', 'in_progress'], true)) {
                throw ValidationException::withMessages(['status' => 'Stock opname sudah selesai.']);
            }

            foreach ($counts as $count) {
                $product = Product::query()->lockForUpdate()->findOrFail($count['product_id']);
                $systemQuantity = (float) $product->stok_saat_ini;
                $physicalQuantity = (float) $count['physical_qty'];
                $variance = round($physicalQuantity - $systemQuantity, 3);
                $opname->details()->updateOrCreate(['product_id' => $product->id], [
                    'system_qty' => $systemQuantity,
                    'physical_qty' => $physicalQuantity,
                    'variance_qty' => $variance,
                    'variance_value' => round($variance * (float) $product->hpp_current, 2),
                    'notes' => $count['notes'] ?? null,
                ]);
                if ($variance !== 0.0) {
                    $this->ledger($opname, $product, (int) $opname->warehouse_id, $variance > 0 ? 'in' : 'out', abs($variance), $userId, 'Penyesuaian stock opname');
                    $product->update(['stok_saat_ini' => $physicalQuantity]);
                }
            }

            $opname->update(['status' => 'completed', 'conducted_by' => $userId]);

            return $opname->refresh();
        });
    }

    public function approveAdjustment(StockOutAdjustment $adjustment, int $userId): StockOutAdjustment
    {
        return DB::transaction(function () use ($adjustment, $userId): StockOutAdjustment {
            $adjustment = StockOutAdjustment::query()->with('product')->lockForUpdate()->findOrFail($adjustment->id);
            if ($adjustment->status !== 'pending') {
                throw ValidationException::withMessages(['status' => 'Adjustment sudah diproses.']);
            }
            $quantity = $this->baseQuantity($adjustment->product, (int) $adjustment->unit_id, (float) $adjustment->qty);
            $this->ensureStock($adjustment->product, $quantity);
            $newBalance = round((float) $adjustment->product->stok_saat_ini - $quantity, 3);
            $this->ledger($adjustment, $adjustment->product, (int) $adjustment->warehouse_id, 'out', $quantity, $userId, $adjustment->reason_type);
            $adjustment->product->update(['stok_saat_ini' => $newBalance]);
            $adjustment->update(['status' => 'approved', 'approved_by' => $userId]);

            return $adjustment->refresh();
        });
    }

    public function completeSupplierReturn(SupplierReturn $return, int $userId): SupplierReturn
    {
        return DB::transaction(function () use ($return, $userId): SupplierReturn {
            $return = SupplierReturn::query()->with('items.product')->lockForUpdate()->findOrFail($return->id);
            if ($return->status !== 'draft') {
                throw ValidationException::withMessages(['status' => 'Retur supplier sudah diproses.']);
            }
            foreach ($return->items as $item) {
                $quantity = $this->baseQuantity($item->product, (int) $item->unit_id, (float) $item->qty);
                $this->ensureStock($item->product, $quantity);
                $newBalance = round((float) $item->product->stok_saat_ini - $quantity, 3);
                $this->ledger($return, $item->product, (int) $return->warehouse_id, 'out', $quantity, $userId, 'Retur ke supplier');
                $item->product->update(['stok_saat_ini' => $newBalance]);
            }
            $return->update(['status' => 'completed']);

            return $return->refresh();
        });
    }

    private function baseQuantity(Product $product, int $unitId, float $quantity): float
    {
        if ($unitId === (int) $product->base_unit_id) {
            return $quantity;
        }
        $conversion = ProductUnit::query()->where('product_id', $product->id)->where('unit_id', $unitId)->value('conversion_qty');
        if ($conversion === null) {
            throw ValidationException::withMessages(['unit_id' => "Konversi satuan {$product->name} tidak ditemukan."]);
        }

        return round($quantity * (float) $conversion, 3);
    }

    private function ensureStock(Product $product, float $quantity): void
    {
        if ((float) $product->stok_saat_ini < $quantity) {
            throw ValidationException::withMessages(['qty' => "Stok {$product->name} tidak mencukupi."]);
        }
    }

    private function ledger(object $reference, Product $product, int $warehouseId, string $type, float $quantity, int $userId, string $notes): void
    {
        $latestBalance = StockLedger::query()->where('product_id', $product->id)->where('warehouse_id', $warehouseId)->latest('id')->value('qty_running_balance');
        $currentBalance = $latestBalance === null && $warehouseId === (int) $product->default_warehouse_id ? (float) $product->stok_saat_ini : (float) $latestBalance;
        StockLedger::query()->create([
            'store_id' => $product->store_id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouseId,
            'movement_type' => $type,
            'qty' => $quantity,
            'qty_running_balance' => round($currentBalance + ($type === 'in' ? $quantity : -$quantity), 3),
            'hpp_at_time' => $product->hpp_current,
            'reference_type' => $reference::class,
            'reference_id' => $reference->id,
            'notes' => $notes,
            'created_by' => $userId,
        ]);
    }
}
