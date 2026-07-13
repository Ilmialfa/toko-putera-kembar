<?php

namespace App\Domain\Sales\Actions;

use App\Models\Sale;
use App\Models\SaleReturn;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProcessRefundAction
{
    public function execute(array $data, int $userId): SaleReturn
    {
        return DB::transaction(function () use ($data, $userId) {
            $sale = Sale::lockForUpdate()->findOrFail($data['sale_id']);

            if ($sale->status !== 'completed') {
                throw ValidationException::withMessages([
                    'sale' => 'Only completed sales can be returned.',
                ]);
            }

            $saleReturn = SaleReturn::create([
                'sale_id' => $sale->id,
                'type' => $data['type'] ?? 'return',
                'status' => 'pending_approval',
                'total_refund_amount' => $data['total_refund_amount'],
                'exchange_sale_id' => $data['exchange_sale_id'] ?? null,
                'created_by' => $userId,
            ]);

            foreach ($data['items'] as $itemData) {
                $saleReturn->items()->create([
                    'sale_item_id' => $itemData['sale_item_id'],
                    'qty' => $itemData['qty'],
                    'condition' => $itemData['condition'] ?? 'good',
                ]);
            }

            // Note: Since approval is needed for retur/refund, we don't return stock yet.
            // Stock return and refund payment happens after approval.

            return $saleReturn->load('items.saleItem.product');
        });
    }
}
