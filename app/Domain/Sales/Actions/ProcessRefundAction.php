<?php

namespace App\Domain\Sales\Actions;

use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\SaleReturnItem;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProcessRefundAction
{
    public function execute(array $data, int $userId, int $storeId): SaleReturn
    {
        return DB::transaction(function () use ($data, $userId, $storeId) {
            $sale = Sale::query()
                ->where('store_id', $storeId)
                ->lockForUpdate()
                ->findOrFail($data['sale_id']);

            if ($sale->status !== 'completed') {
                throw ValidationException::withMessages([
                    'sale' => 'Only completed sales can be returned.',
                ]);
            }

            $items = [];
            $totalRefundAmount = 0.0;

            foreach ($data['items'] as $itemData) {
                $saleItem = SaleItem::query()
                    ->where('sale_id', $sale->id)
                    ->lockForUpdate()
                    ->findOrFail($itemData['sale_item_id']);

                $alreadyRequestedQuantity = (float) SaleReturnItem::query()
                    ->where('sale_item_id', $saleItem->id)
                    ->whereHas('saleReturn', fn ($query) => $query->whereIn('status', ['pending_approval', 'approved']))
                    ->sum('qty');
                $requestedQuantity = (float) $itemData['qty'];

                if ($requestedQuantity > (float) $saleItem->qty - $alreadyRequestedQuantity) {
                    throw ValidationException::withMessages([
                        'items' => 'Jumlah retur tidak boleh melebihi sisa jumlah yang dapat diretur.',
                    ]);
                }

                $totalRefundAmount += $requestedQuantity * (float) $saleItem->price_per_unit;
                $items[] = [
                    'sale_item_id' => $saleItem->id,
                    'qty' => $requestedQuantity,
                    'condition' => $itemData['condition'] ?? 'good',
                ];
            }

            $saleReturn = SaleReturn::create([
                'store_id' => $storeId,
                'sale_id' => $sale->id,
                'type' => $data['type'] ?? 'return',
                'status' => 'pending_approval',
                'total_refund_amount' => round($totalRefundAmount, 2),
                'exchange_sale_id' => $data['exchange_sale_id'] ?? null,
                'created_by' => $userId,
            ]);

            foreach ($items as $item) {
                $saleReturn->items()->create([
                    'sale_item_id' => $item['sale_item_id'],
                    'qty' => $item['qty'],
                    'condition' => $item['condition'],
                ]);
            }

            // Note: Since approval is needed for retur/refund, we don't return stock yet.
            // Stock return and refund payment happens after approval.

            return $saleReturn->load('items.saleItem.product');
        });
    }
}
