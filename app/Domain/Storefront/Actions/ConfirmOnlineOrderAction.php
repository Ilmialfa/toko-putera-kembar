<?php

namespace App\Domain\Storefront\Actions;

use App\Domain\Inventory\Services\FifoAllocationService;
use App\Domain\Sales\Events\SaleCompleted;
use App\Domain\Storefront\Events\OrderConfirmed;
use App\Enums\OrderStatus;
use App\Enums\ProductType;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockReservation;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ConfirmOnlineOrderAction
{
    public function __construct(private readonly FifoAllocationService $fifoAllocationService) {}

    public function execute(Order $order, int $userId): Order
    {
        return DB::transaction(function () use ($order, $userId): Order {
            $lockedOrder = Order::query()->lockForUpdate()->findOrFail($order->id);

            $allowedStatuses = [
                OrderStatus::PAYMENT_VERIFICATION->value,
                OrderStatus::PENDING_PAYMENT->value, // Cash orders start here
            ];

            if (! in_array($lockedOrder->getRawOriginal('status'), $allowedStatuses, true)) {
                throw ValidationException::withMessages([
                    'order' => 'Hanya pesanan yang menunggu pembayaran atau verifikasi yang dapat dikonfirmasi.',
                ]);
            }

            $sale = Sale::query()->create([
                'store_id' => $lockedOrder->store_id,
                'sale_number' => 'ONL/'.now()->format('Ym').'/'.str_pad((string) $lockedOrder->id, 6, '0', STR_PAD_LEFT),
                'customer_id' => $lockedOrder->customer_id,
                'channel' => 'online',
                'order_id' => $lockedOrder->id,
                'status' => 'completed',
                'subtotal' => $lockedOrder->subtotal,
                'discount_total' => $lockedOrder->discount_total,
                'total_amount' => $lockedOrder->total_amount,
                'paid_amount' => $lockedOrder->total_amount,
                'change_amount' => 0,
                'payment_status' => 'paid',
                'created_by' => $userId,
            ]);

            $orderItems = OrderItem::query()->where('order_id', $lockedOrder->id)->get();

            foreach ($orderItems as $orderItem) {
                $product = Product::query()->lockForUpdate()->findOrFail($orderItem->product_id);
                $quantity = (float) $orderItem->qty_base_unit;

                if ($product->getRawOriginal('product_type') === ProductType::PHYSICAL->value) {
                    if (! $product->is_preorder && (float) $product->stok_saat_ini < $quantity) {
                        throw ValidationException::withMessages([
                            'order' => "Stok {$product->name} tidak mencukupi untuk dikonfirmasi.",
                        ]);
                    }

                    $balance = round((float) $product->stok_saat_ini - $quantity, 3);
                    $allocations = $product->track_batch || $product->track_expiry
                        ? $this->fifoAllocationService->allocateAndDeduct($product, $quantity, (int) $lockedOrder->store_id)
                        : [['batch_id' => null, 'qty' => $quantity]];

                    $runningBalance = (float) $product->stok_saat_ini;

                    foreach ($allocations as $allocation) {
                        $runningBalance = round($runningBalance - (float) $allocation['qty'], 3);
                        $sale->stockLedgers()->create([
                            'store_id' => $lockedOrder->store_id,
                            'product_id' => $product->id,
                            'warehouse_id' => $product->default_warehouse_id,
                            'batch_id' => $allocation['batch_id'],
                            'movement_type' => 'out',
                            'qty' => $allocation['qty'],
                            'qty_running_balance' => $runningBalance,
                            'hpp_at_time' => $product->hpp_current,
                            'created_by' => $userId,
                        ]);
                    }

                    $product->update(['stok_saat_ini' => $balance]);
                }

                $sale->items()->create([
                    'product_id' => $product->id,
                    'unit_id' => $orderItem->unit_id,
                    'qty' => $orderItem->qty,
                    'price_per_unit' => $orderItem->price_per_unit,
                    'discount_amount' => $orderItem->discount_amount,
                    'subtotal' => $orderItem->subtotal,
                    'hpp_at_time' => $product->hpp_current,
                ]);
            }

            $sale->payments()->create([
                'method' => $lockedOrder->payment_method,
                'amount' => $lockedOrder->total_amount,
                'reference_number' => $lockedOrder->order_number,
            ]);

            StockReservation::query()
                ->where('order_id', $lockedOrder->id)
                ->where('status', 'active')
                ->update(['status' => 'converted']);

            $lockedOrder->update([
                'status' => OrderStatus::CONFIRMED,
                'verified_by' => $userId,
                'verified_at' => now(),
                'sale_id' => $sale->id,
            ]);
            $lockedOrder->statusHistories()->create([
                'status' => OrderStatus::CONFIRMED->value,
                'changed_by' => $userId,
                'notes' => 'Pembayaran diverifikasi dan stok dikurangi.',
            ]);

            OrderConfirmed::dispatch($lockedOrder);
            SaleCompleted::dispatch($sale);

            return $lockedOrder->load(['items.product', 'customer', 'statusHistories.changedBy']);
        }, attempts: 3);
    }
}
