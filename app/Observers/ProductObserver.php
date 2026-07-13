<?php

namespace App\Observers;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Str;

class ProductObserver
{
    /**
     * Handle the Product "creating" event.
     */
    public function creating(Product $product): void
    {
        // 1. Generate Slug
        if (empty($product->slug)) {
            $product->slug = Str::slug($product->name).'-'.strtolower(Str::random(5));
        }

        // 2. Generate SKU if empty
        if (empty($product->sku)) {
            $product->sku = $this->generateSku($product);
        }

        // 3. Generate QR Code if empty
        if (empty($product->qr_code)) {
            // Usually, QR code string can just be a unique identifier, like UUID or URL-safe string
            $product->qr_code = 'QR-'.(string) Str::uuid();
        }
    }

    /**
     * Handle the Product "updating" event.
     */
    public function updating(Product $product): void
    {
        if ($product->isDirty('name')) {
            $product->slug = Str::slug($product->name).'-'.strtolower(Str::random(5));
        }

        if (empty($product->sku)) {
            $product->sku = $this->generateSku($product);
        }

        if (empty($product->qr_code)) {
            $product->qr_code = 'QR-'.(string) Str::uuid();
        }
    }

    private function generateSku(Product $product): string
    {
        $prefix = 'PRD';

        // Attempt to create initials from category
        if ($product->category_id) {
            $categoryName = Category::query()->whereKey($product->category_id)->value('name');

            if (is_string($categoryName)) {
                $prefix = strtoupper(substr($categoryName, 0, 3));
            }
        }

        if ($product->brand_id) {
            $brandName = Brand::query()->whereKey($product->brand_id)->value('name');

            if (is_string($brandName)) {
                $prefix .= '-'.strtoupper(substr($brandName, 0, 3));
            }
        }

        return $prefix.'-'.strtoupper(Str::random(6));
    }
}
