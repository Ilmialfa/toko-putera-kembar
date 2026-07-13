<?php

namespace App\Domain\Inventory\Services;

use App\Models\Product;
use App\Models\ProductBatch;

class FifoAllocationService
{
    /**
     * Allocate quantity from available batches based on FIFO or FEFO.
     * Decrements the `qty_available` in the selected batches.
     * Returns an array of allocations: [['batch_id' => int, 'qty' => float]]
     *
     * @throws \Exception If not enough batch quantity available
     */
    public function allocateAndDeduct(Product $product, float $qtyToDeduct, int $storeId): array
    {
        if (! $product->track_batch && ! $product->track_expiry) {
            // Not tracked by batch, no allocation needed
            return [];
        }

        if ($qtyToDeduct <= 0) {
            return [];
        }

        $query = ProductBatch::where('product_id', $product->id)
            ->where('store_id', $storeId)
            ->where('qty_available', '>', 0)
            ->lockForUpdate();

        if ($product->track_expiry) {
            // FEFO: First Expired First Out
            $query->orderByRaw('expiry_date IS NULL ASC') // nulls last
                ->orderBy('expiry_date', 'asc')
                ->orderBy('created_at', 'asc');
        } else {
            // FIFO: First In First Out
            $query->orderBy('created_at', 'asc');
        }

        $availableBatches = $query->get();

        $allocations = [];
        $remainingQty = $qtyToDeduct;

        foreach ($availableBatches as $batch) {
            if ($remainingQty <= 0) {
                break;
            }

            $deductFromThisBatch = min($batch->qty_available, $remainingQty);

            $batch->qty_available -= $deductFromThisBatch;
            $batch->save();

            $allocations[] = [
                'batch_id' => $batch->id,
                'qty' => $deductFromThisBatch,
            ];

            $remainingQty -= $deductFromThisBatch;
        }

        if ($remainingQty > 0) {
            // Depending on business rules, we might throw an exception if strict batch tracking is required
            // but for robustness in case of stock discrepancies, we might just allow it and log a warning.
            // Let's throw an exception for strictness as per enterprise grade rules.
            throw new \RuntimeException('Not enough batch quantity available to fulfill the deduction. Missing: '.$remainingQty);
        }

        return $allocations;
    }
}
