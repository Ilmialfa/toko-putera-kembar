<?php

namespace App\Domain\Sales\Actions;

use App\Domain\Catalog\Services\PriceResolutionService;
use App\Domain\Inventory\Services\FifoAllocationService;
use App\Domain\Promotion\Services\LoyaltyPointService;
use App\Domain\Promotion\Services\PromotionEngine;
use App\Domain\Sales\Events\SaleCompleted;
use App\Enums\ProductType;
use App\Models\CashierShift;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\PromotionUsage;
use App\Models\Sale;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CheckoutPosAction
{
    public function __construct(
        private FifoAllocationService $fifoService,
        private LoyaltyPointService $loyaltyService,
        private PriceResolutionService $priceResolutionService,
        private PromotionEngine $promotionEngine,
    ) {}

    /** @param array<string, mixed> $data */
    public function execute(array $data, int $userId, int $storeId, int $warehouseId): Sale
    {
        return DB::transaction(function () use ($data, $userId, $storeId, $warehouseId): Sale {
            $user = User::query()->findOrFail($userId);
            $shift = CashierShift::query()
                ->whereKey($data['cashier_shift_id'])
                ->where('user_id', $userId)
                ->where('status', 'open')
                ->lockForUpdate()
                ->firstOrFail();
            $preparedItems = $this->prepareItems($data['items'], $storeId);
            $subtotal = round((float) collect($preparedItems)->sum('gross'), 2);
            $manualItemDiscount = round((float) collect($preparedItems)->sum('discount_amount'), 2);
            $promotionResult = $this->promotionEngine->calculate(
                $storeId,
                'pos',
                collect($preparedItems)->map(fn (array $item): array => [
                    'product_id' => $item['product']->id,
                    'category_id' => $item['product']->category_id,
                    'brand_id' => $item['product']->brand_id,
                    'qty' => $item['qty'],
                    'price_per_unit' => $item['price_per_unit'],
                    'subtotal' => $item['gross'],
                ])->all(),
                max(0, $subtotal - $manualItemDiscount),
                $data['voucher_code'] ?? null,
                $data['customer_id'] ?? null,
            );

            foreach ($preparedItems as $index => &$preparedItem) {
                $promotionDiscount = (float) ($promotionResult['items'][$index]['discount_amount'] ?? 0);
                $preparedItem['discount_amount'] = round((float) $preparedItem['discount_amount'] + $promotionDiscount, 2);
                $preparedItem['subtotal'] = round($preparedItem['gross'] - $preparedItem['discount_amount'], 2);
            }
            unset($preparedItem);

            foreach ($promotionResult['free_items'] as $freeItem) {
                $preparedItems[] = $this->prepareFreeItem($freeItem, $storeId);
            }

            $subtotal = round((float) collect($preparedItems)->sum('gross'), 2);
            $itemDiscount = round((float) collect($preparedItems)->sum('discount_amount'), 2);
            $globalDiscount = min((float) ($data['discount_total'] ?? 0), max(0, $subtotal - $itemDiscount));
            $manualDiscount = max(0, $manualItemDiscount + $globalDiscount);

            if (! $user->can('pos.discount.override_limit') && $manualDiscount > round($subtotal * 0.10, 2)) {
                throw ValidationException::withMessages(['discount_total' => 'Diskon manual di atas 10% memerlukan persetujuan admin.']);
            }

            $taxTotal = round((float) ($data['tax_total'] ?? 0), 2);
            $totalAmount = round(max(0, $subtotal - $itemDiscount - $globalDiscount + $taxTotal), 2);
            $paymentTotal = round((float) collect($data['payments'])->sum('amount'), 2);

            if ($paymentTotal < $totalAmount) {
                throw ValidationException::withMessages(['payments' => 'Jumlah pembayaran kurang dari total transaksi.']);
            }

            $sale = $this->resolveSale($data, $storeId, $userId, $shift, $subtotal, $itemDiscount + $globalDiscount, $taxTotal, $totalAmount, $paymentTotal);
            $runningBalances = [];

            foreach ($preparedItems as $preparedItem) {
                /** @var Product $product */
                $product = $preparedItem['product'];
                $sale->items()->create([
                    'product_id' => $product->id,
                    'unit_id' => $preparedItem['unit_id'],
                    'qty' => $preparedItem['qty'],
                    'price_per_unit' => $preparedItem['price_per_unit'],
                    'discount_amount' => $preparedItem['discount_amount'],
                    'subtotal' => $preparedItem['subtotal'],
                    'hpp_at_time' => $product->hpp_current,
                ]);

                if ($product->getRawOriginal('product_type') !== ProductType::PHYSICAL->value) {
                    continue;
                }

                $baseQuantity = (float) $preparedItem['base_qty'];
                $currentQuantity = $runningBalances[$product->id] ?? (float) $product->stok_saat_ini;

                if (! $product->is_preorder && $currentQuantity < $baseQuantity) {
                    throw ValidationException::withMessages(['items' => "Stok {$product->name} tidak mencukupi."]);
                }

                if ($product->track_batch || $product->track_expiry) {
                    foreach ($this->fifoService->allocateAndDeduct($product, $baseQuantity, $storeId) as $allocation) {
                        $currentQuantity = round($currentQuantity - (float) $allocation['qty'], 3);
                        $this->appendStockLedger($sale, $product, $warehouseId, (float) $allocation['qty'], $currentQuantity, $userId, $allocation['batch_id']);
                    }
                } else {
                    $currentQuantity = round($currentQuantity - $baseQuantity, 3);
                    $this->appendStockLedger($sale, $product, $warehouseId, $baseQuantity, $currentQuantity, $userId);
                }

                $runningBalances[$product->id] = $currentQuantity;
                $product->update(['stok_saat_ini' => $currentQuantity]);
            }

            foreach ($data['payments'] as $paymentData) {
                $sale->payments()->create([
                    'method' => $paymentData['method'],
                    'amount' => $paymentData['amount'],
                    'reference_number' => $paymentData['reference_number'] ?? null,
                ]);

                if ($paymentData['method'] === 'cash') {
                    $shift->movements()->create([
                        'type' => 'in',
                        'amount' => min((float) $paymentData['amount'], $totalAmount),
                        'reason' => "Penjualan {$sale->sale_number}",
                        'created_by' => $userId,
                    ]);
                }

                if ($paymentData['method'] === 'points' && ! empty($data['customer_id'])) {
                    $this->loyaltyService->redeem((int) $data['customer_id'], (int) $paymentData['amount'], Sale::class, $sale->id, notes: "Ditukar pada {$sale->sale_number}");
                }
            }

            foreach ($promotionResult['applied_promotions'] as $promotion) {
                PromotionUsage::create([
                    'promotion_id' => $promotion['promotion_id'],
                    'voucher_id' => $promotion['voucher_id'] ?? null,
                    'usable_type' => Sale::class,
                    'usable_id' => $sale->id,
                    'customer_id' => $data['customer_id'] ?? null,
                    'discount_amount_applied' => $promotion['amount'],
                    'used_at' => now(),
                ]);
            }

            if (! empty($data['customer_id']) && $totalAmount > 0) {
                $points = (int) floor(($totalAmount / 10000) * $promotionResult['point_multiplier']);

                if ($points > 0) {
                    $this->loyaltyService->earn((int) $data['customer_id'], $points, Sale::class, $sale->id, "Diperoleh dari {$sale->sale_number}");
                }

                $cashbackPoints = (int) floor($promotionResult['cashback_total'] / 1000);
                if ($cashbackPoints > 0) {
                    $this->loyaltyService->earn((int) $data['customer_id'], $cashbackPoints, Sale::class, $sale->id, "Cashback dari {$sale->sale_number}");
                }
            }

            SaleCompleted::dispatch($sale);

            return $sale->load(['items.product', 'payments']);
        }, attempts: 3);
    }

    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array<int, array<string, mixed>>
     */
    private function prepareItems(array $items, int $storeId): array
    {
        return collect($items)->map(function (array $item) use ($storeId): array {
            $product = Product::query()->lockForUpdate()->findOrFail($item['product_id']);
            $conversion = $this->conversionQuantity($product, (int) $item['unit_id']);
            $priceRow = $this->priceResolutionService->resolve($product, $storeId, (int) $item['unit_id'], (float) $item['qty']);

            if ($priceRow === null) {
                throw ValidationException::withMessages(['items' => "Harga {$product->name} belum dikonfigurasi."]);
            }

            $unitPrice = (float) $priceRow->price;

            if ((int) $priceRow->unit_id !== (int) $item['unit_id']) {
                $unitPrice *= $conversion;
            }

            $gross = round($unitPrice * (float) $item['qty'], 2);
            $discount = min((float) ($item['discount_amount'] ?? 0), $gross);

            return [
                'product' => $product,
                'unit_id' => (int) $item['unit_id'],
                'qty' => (float) $item['qty'],
                'base_qty' => round((float) $item['qty'] * $conversion, 3),
                'price_per_unit' => round($unitPrice, 2),
                'gross' => $gross,
                'discount_amount' => round($discount, 2),
                'subtotal' => round($gross - $discount, 2),
            ];
        })->all();
    }

    private function conversionQuantity(Product $product, int $unitId): float
    {
        if ($unitId === (int) $product->base_unit_id) {
            return 1.0;
        }

        $conversion = ProductUnit::query()->where('product_id', $product->id)->where('unit_id', $unitId)->where('is_sales_unit', true)->value('conversion_qty');

        if ($conversion === null) {
            throw ValidationException::withMessages(['items' => "Satuan penjualan {$product->name} tidak valid."]);
        }

        return (float) $conversion;
    }

    /** @param array<string, mixed> $freeItem @return array<string, mixed> */
    private function prepareFreeItem(array $freeItem, int $storeId): array
    {
        $product = Product::query()->lockForUpdate()->findOrFail($freeItem['product_id']);
        $price = $this->priceResolutionService->resolve($product, $storeId, (int) $product->base_unit_id, (float) $freeItem['qty']);
        if ($price === null) {
            throw ValidationException::withMessages(['promotion' => "Harga produk gratis {$product->name} belum dikonfigurasi."]);
        }
        $gross = round((float) $price->price * (float) $freeItem['qty'], 2);

        return [
            'product' => $product,
            'unit_id' => (int) $product->base_unit_id,
            'qty' => (float) $freeItem['qty'],
            'base_qty' => (float) $freeItem['qty'],
            'price_per_unit' => (float) $price->price,
            'gross' => $gross,
            'discount_amount' => $gross,
            'subtotal' => 0.0,
        ];
    }

    /** @param array<string, mixed> $data */
    private function resolveSale(array $data, int $storeId, int $userId, CashierShift $shift, float $subtotal, float $discount, float $tax, float $total, float $paid): Sale
    {
        $sale = ! empty($data['parked_sale_id'])
            ? Sale::query()->whereKey($data['parked_sale_id'])->where('status', 'parked')->lockForUpdate()->firstOrFail()
            : new Sale(['sale_number' => $this->nextSaleNumber($storeId), 'store_id' => $storeId, 'created_by' => $userId, 'channel' => 'pos']);

        if ($sale->exists) {
            $sale->items()->delete();
            $sale->payments()->delete();
        }

        $sale->fill([
            'cashier_shift_id' => $shift->id,
            'customer_id' => $data['customer_id'] ?? null,
            'status' => 'completed',
            'subtotal' => $subtotal,
            'discount_total' => $discount,
            'tax_total' => $tax,
            'total_amount' => $total,
            'paid_amount' => $paid,
            'change_amount' => max(0, round($paid - $total, 2)),
            'payment_status' => $data['payment_status'] ?? 'paid',
        ])->save();

        return $sale;
    }

    private function nextSaleNumber(int $storeId): string
    {
        $prefix = 'INV/'.now()->format('Ym').'/';
        $lastNumber = Sale::query()->where('store_id', $storeId)->where('sale_number', 'like', $prefix.'%')->lockForUpdate()->latest('id')->value('sale_number');
        $sequence = $lastNumber === null ? 1 : (int) str($lastNumber)->afterLast('/')->toString() + 1;

        return $prefix.str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);
    }

    private function appendStockLedger(Sale $sale, Product $product, int $warehouseId, float $quantity, float $balance, int $userId, ?int $batchId = null): void
    {
        $sale->stockLedgers()->create([
            'store_id' => $sale->store_id,
            'product_id' => $product->id,
            'warehouse_id' => $warehouseId,
            'batch_id' => $batchId,
            'movement_type' => 'out',
            'qty' => $quantity,
            'qty_running_balance' => $balance,
            'hpp_at_time' => $product->hpp_current,
            'created_by' => $userId,
        ]);
    }
}
