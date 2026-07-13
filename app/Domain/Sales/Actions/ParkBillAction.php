<?php

namespace App\Domain\Sales\Actions;

use App\Models\Sale;
use Illuminate\Support\Facades\DB;

class ParkBillAction
{
    public function execute(array $data, int $userId, int $storeId): Sale
    {
        return DB::transaction(function () use ($data, $userId, $storeId) {
            $prefix = 'INV/'.date('Ym').'/';
            $lastSale = Sale::where('store_id', $storeId)
                ->where('sale_number', 'like', $prefix.'%')
                ->orderBy('id', 'desc')
                ->lockForUpdate()
                ->first();

            $sequence = 1;
            if ($lastSale) {
                $lastSequence = (int) substr($lastSale->sale_number, strrpos($lastSale->sale_number, '/') + 1);
                $sequence = $lastSequence + 1;
            }
            $saleNumber = $prefix.str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);

            $sale = Sale::create([
                'store_id' => $storeId,
                'sale_number' => $saleNumber,
                'cashier_shift_id' => $data['cashier_shift_id'] ?? null,
                'customer_id' => $data['customer_id'] ?? null,
                'channel' => 'pos',
                'status' => 'parked',
                'subtotal' => $data['subtotal'],
                'discount_total' => $data['discount_total'] ?? 0,
                'tax_total' => $data['tax_total'] ?? 0,
                'total_amount' => $data['total_amount'],
                'created_by' => $userId,
            ]);

            foreach ($data['items'] as $itemData) {
                $sale->items()->create([
                    'product_id' => $itemData['product_id'],
                    'unit_id' => $itemData['unit_id'],
                    'qty' => $itemData['qty'],
                    'price_per_unit' => $itemData['price_per_unit'],
                    'discount_amount' => $itemData['discount_amount'] ?? 0,
                    'subtotal' => $itemData['subtotal'],
                    'hpp_at_time' => 0, // HPP is finalized upon checkout
                ]);
            }

            return $sale->load('items.product');
        });
    }
}
