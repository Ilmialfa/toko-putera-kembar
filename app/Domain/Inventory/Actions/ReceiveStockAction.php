<?php

namespace App\Domain\Inventory\Actions;

use App\Domain\Inventory\Events\StockInReceived;
use App\Domain\Inventory\Services\WacCalculationService;
use App\Models\Product;
use App\Models\ProductBatch;
use App\Models\ProductUnit;
use App\Models\StockIn;
use App\Models\StockInDetail;
use Illuminate\Support\Facades\DB;

class ReceiveStockAction
{
    public function __construct(
        private WacCalculationService $wacService
    ) {}

    /**
     * Process a StockIn document.
     * This action is idempotent for a single StockIn, but assumes status is 'draft' before calling.
     */
    public function execute(StockIn $stockIn): void
    {
        if ($stockIn->status !== 'draft') {
            throw new \RuntimeException('Stock In is already processed or cancelled.');
        }

        DB::transaction(function () use ($stockIn) {
            $details = StockInDetail::query()->where('stock_in_id', $stockIn->id)->get();

            foreach ($details as $detail) {
                // 1. Lock the product row to prevent race conditions during qty and HPP calculation
                $product = Product::query()->where('id', $detail->product_id)->lockForUpdate()->firstOrFail();

                // 2. Calculate base quantity using conversion factor
                $conversionQty = 1;
                if ($detail->unit_id !== $product->base_unit_id) {
                    $unitConversion = ProductUnit::where('product_id', $product->id)
                        ->where('unit_id', $detail->unit_id)
                        ->first();

                    if ($unitConversion) {
                        $conversionQty = $unitConversion->conversion_qty;
                    }
                }

                $baseQty = $detail->qty * $conversionQty;

                // Total price for this detail line
                $incomingTotalPrice = $detail->qty * $detail->purchase_price_per_unit;

                // 3. Calculate New HPP
                $currentQty = (float) ($product->stok_saat_ini ?? 0);
                $currentHpp = (float) ($product->hpp_current ?? 0);

                $newHpp = $this->wacService->calculateNewHpp(
                    $currentQty,
                    $currentHpp,
                    (float) $baseQty,
                    (float) $incomingTotalPrice
                );

                $newQty = $currentQty + $baseQty;

                // 4. Handle Batch/Expiry tracking
                $batchId = null;
                if (($product->track_batch || $product->track_expiry) && $detail->batch_number) {
                    $batch = ProductBatch::firstOrCreate([
                        'store_id' => $stockIn->store_id,
                        'product_id' => $product->id,
                        'batch_number' => $detail->batch_number,
                    ], [
                        'expiry_date' => $detail->expiry_date,
                        'qty_available' => 0,
                    ]);

                    $batch->increment('qty_available', $baseQty);
                    $batchId = $batch->id;
                }

                // 5. Append to Stock Ledger
                $stockIn->stockLedgers()->create([
                    'store_id' => $stockIn->store_id,
                    'product_id' => $product->id,
                    'warehouse_id' => $stockIn->warehouse_id,
                    'batch_id' => $batchId,
                    'movement_type' => 'in',
                    'qty' => $baseQty,
                    'qty_running_balance' => $newQty,
                    'hpp_at_time' => $newHpp,
                    'created_by' => $stockIn->created_by,
                ]);

                // 6. Update Product Denormalized Fields
                $product->update([
                    'stok_saat_ini' => $newQty,
                    'hpp_current' => $newHpp,
                ]);
            }

            // 7. Mark as completed
            $stockIn->update(['status' => 'completed']);
            StockInReceived::dispatch($stockIn);
        });
    }
}
