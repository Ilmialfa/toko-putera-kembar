<?php

namespace App\Http\Resources;

use App\Domain\Catalog\Services\PriceResolutionService;
use App\Models\Product;
use App\Models\ProductPrice;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;
use Throwable;

/** @mixin Product */
class StorefrontProductResource extends JsonResource
{
    /** @return array<string, mixed> */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'sku' => $this->sku,
            'description_short' => $this->description_short,
            'description_long' => $this->description_long,
            'is_preorder' => (bool) $this->is_preorder,
            'preorder_eta_days' => $this->preorder_eta_days,
            'stock_status' => $this->stockStatus(),
            'category' => $this->whenLoaded('category', fn () => $this->category?->only(['id', 'name', 'slug'])),
            'brand' => $this->whenLoaded('brand', fn () => $this->brand?->only(['id', 'name', 'slug'])),
            'display_price_prefix' => $this->display_price_prefix,
            'display_quote' => $this->quote((int) ($this->online_display_unit_id ?: $this->base_unit_id)),
            'sales_units' => $this->salesUnits(),
            'price_tiers' => $this->relationLoaded('prices') ? $this->prices
                ->where('is_active', true)
                ->filter(fn (ProductPrice $price): bool => in_array($price->getRawOriginal('channel'), ['online', 'both'], true))
                ->sortBy('min_qty')
                ->values()
                ->map(fn (ProductPrice $price): array => [
                    'unit_id' => (int) $price->unit_id,
                    'unit_name' => $price->unit?->name,
                    'price_type' => (string) $price->getRawOriginal('price_type'),
                    'min_qty' => (float) $price->min_qty,
                    'max_qty' => $price->max_qty === null ? null : (float) $price->max_qty,
                    'price' => (float) $price->price,
                ])->all() : [],
            'images' => $this->whenLoaded('images', fn () => $this->images->sortBy('display_order')->values()->map(fn ($image): array => [
                'id' => $image->id,
                'url' => Storage::disk('public')->url($image->path),
                'is_primary' => (bool) $image->is_primary,
            ])),
        ];
    }

    /** @return array<string,mixed>|null */
    private function quote(int $unitId): ?array
    {
        try {
            return app(PriceResolutionService::class)->quote(
                $this->resource,
                (int) $this->store_id,
                $unitId,
                1,
                auth('customer')->user()?->customer_group_id,
                'online',
            );
        } catch (Throwable) {
            return null;
        }
    }

    /** @return array<int,array<string,mixed>> */
    private function salesUnits(): array
    {
        $units = collect([['id' => (int) $this->base_unit_id, 'name' => $this->baseUnit->name, 'symbol' => $this->baseUnit->symbol, 'conversion_qty' => 1.0]]);
        foreach ($this->productUnits->where('is_sales_unit', true) as $productUnit) {
            $units->push(['id' => (int) $productUnit->unit_id, 'name' => $productUnit->unit->name, 'symbol' => $productUnit->unit->symbol, 'conversion_qty' => (float) $productUnit->conversion_qty]);
        }

        return $units->unique('id')->values()->map(function (array $unit): array {
            $unit['quote'] = $this->quote($unit['id']);

            return $unit;
        })->all();
    }

    private function stockStatus(): string
    {
        if ($this->is_preorder) {
            return 'preorder';
        }
        $stock = (float) $this->stok_saat_ini;
        if ($stock <= 0) {
            return 'out_of_stock';
        }
        if ($stock <= max(1, (float) $this->min_stock)) {
            return 'low_stock';
        }

        return 'available';
    }
}
