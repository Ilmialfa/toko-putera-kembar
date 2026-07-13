<?php

namespace App\Domain\Catalog\Services;

use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ProductUnit;
use Illuminate\Database\Eloquent\Builder;

class PriceResolutionService
{
    /**
     * @return array{product_id:int,unit_id:int,unit_name:string,unit_symbol:string,quantity:float,unit_price:float,subtotal:float,price_type:string,source:string,channel:string,warning:?string}
     */
    public function quote(Product $product, int $storeId, int $unitId, float $quantity = 1, ?int $customerGroupId = null, string $channel = 'pos'): array
    {
        $isBaseUnit = $unitId === (int) $product->base_unit_id;
        $productUnit = $isBaseUnit
            ? null
            : ProductUnit::query()
                ->with('unit')
                ->where('product_id', $product->id)
                ->where('unit_id', $unitId)
                ->where('is_sales_unit', true)
                ->first();

        if (! $isBaseUnit && $productUnit === null) {
            throw new \InvalidArgumentException("Satuan penjualan {$product->name} tidak valid.");
        }

        $price = $this->resolve($product, $storeId, $unitId, $quantity, $customerGroupId, $channel);

        if ($price === null) {
            throw new \InvalidArgumentException("Harga {$product->name} belum dikonfigurasi.");
        }

        $unit = $isBaseUnit ? $product->baseUnit()->firstOrFail() : $productUnit->unit;
        $priceType = (string) $price->getRawOriginal('price_type');
        $unitPrice = round((float) $price->price, 2);

        return [
            'product_id' => (int) $product->id,
            'unit_id' => $unitId,
            'unit_name' => $unit->name,
            'unit_symbol' => $unit->symbol,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'subtotal' => round($unitPrice * $quantity, 2),
            'price_type' => $priceType,
            'source' => $price->exists ? 'configured' : 'proportional',
            'channel' => $channel,
            'warning' => $price->exists ? null : 'Harga dihitung proporsional dari satuan dasar.',
        ];
    }

    public function resolve(Product $product, int $storeId, int $unitId, float $quantity = 1, ?int $customerGroupId = null, string $channel = 'pos'): ?ProductPrice
    {
        $baseQuery = ProductPrice::query()
            ->where('product_id', $product->id)
            ->where('store_id', $storeId)
            ->where('is_active', true)
            ->whereIn('channel', [$channel, 'both'])
            ->where(fn (Builder $query): Builder => $query->whereNull('active_from')->orWhere('active_from', '<=', now()))
            ->where(fn (Builder $query): Builder => $query->whereNull('active_until')->orWhere('active_until', '>=', now()));

        $promo = $this->matchingQuantity((clone $baseQuery)->where('price_type', 'promo')->where('unit_id', $unitId), $quantity);

        if ($promo !== null) {
            return $promo;
        }

        if ($customerGroupId !== null) {
            $groupPrice = $this->matchingQuantity(
                (clone $baseQuery)
                    ->whereIn('price_type', ['member', 'reseller'])
                    ->where('customer_group_id', $customerGroupId)
                    ->where('unit_id', $unitId),
                $quantity,
            );

            if ($groupPrice !== null) {
                return $groupPrice;
            }
        }

        $wholesale = $this->matchingQuantity(
            (clone $baseQuery)
                ->whereNull('customer_group_id')
                ->where('unit_id', $unitId)
                ->where(function (Builder $query): void {
                    $query->where('price_type', 'wholesale_tier')->orWhere('min_qty', '>', 1);
                }),
            $quantity,
        );

        if ($wholesale !== null) {
            return $wholesale;
        }

        $retail = (clone $baseQuery)
            ->whereNull('customer_group_id')
            ->where('price_type', 'retail')
            ->where('unit_id', $unitId)
            ->where('min_qty', '<=', 1)
            ->latest('id')
            ->first();

        if ($retail !== null) {
            return $retail;
        }

        $baseRetail = (clone $baseQuery)
            ->whereNull('customer_group_id')
            ->where('price_type', 'retail')
            ->where('unit_id', $product->base_unit_id)
            ->where('min_qty', '<=', 1)
            ->latest('id')
            ->first();

        if ($baseRetail === null) {
            return null;
        }

        $conversion = $unitId === (int) $product->base_unit_id
            ? 1
            : (float) ProductUnit::query()->where('product_id', $product->id)->where('unit_id', $unitId)->value('conversion_qty');

        if ($conversion <= 0) {
            return null;
        }

        return new ProductPrice([
            'product_id' => $product->id,
            'store_id' => $storeId,
            'unit_id' => $unitId,
            'price_type' => 'retail',
            'min_qty' => 1,
            'price' => round((float) $baseRetail->price * $conversion, 2),
            'channel' => $channel,
            'is_active' => true,
        ]);
    }

    /** @param Builder<ProductPrice> $query */
    private function matchingQuantity(Builder $query, float $quantity): ?ProductPrice
    {
        return $query
            ->where('min_qty', '<=', $quantity)
            ->where(fn (Builder $range): Builder => $range->whereNull('max_qty')->orWhere('max_qty', '>=', $quantity))
            ->orderByDesc('min_qty')
            ->orderByDesc('id')
            ->first();
    }
}
