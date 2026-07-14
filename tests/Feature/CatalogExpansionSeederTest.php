<?php

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\StoreLocation;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\Warehouse;
use Database\Seeders\CatalogExpansionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('seeds a broad demo catalog with tiered pricing and distributors', function () {
    $store = StoreLocation::factory()->create(['is_main' => true]);
    Warehouse::factory()->create(['store_location_id' => $store->id]);

    foreach ([
        ['name' => 'Pcs', 'symbol' => 'pcs'],
        ['name' => 'Dus', 'symbol' => 'dus'],
        ['name' => 'Kilogram', 'symbol' => 'kg'],
        ['name' => 'Ons', 'symbol' => 'ons'],
        ['name' => 'Renteng', 'symbol' => 'rtg'],
        ['name' => 'Lusin', 'symbol' => 'lsn'],
    ] as $unit) {
        Unit::query()->create([...$unit, 'is_active' => true]);
    }

    $this->seed(CatalogExpansionSeeder::class);

    expect(Category::query()->count())->toBeGreaterThanOrEqual(9)
        ->and(Brand::query()->count())->toBeGreaterThanOrEqual(25)
        ->and(Supplier::query()->count())->toBeGreaterThanOrEqual(6)
        ->and(Product::query()->count())->toBeGreaterThanOrEqual(55);

    $product = Product::query()->where('sku', 'PRD-000001')->firstOrFail();

    expect($product->description_long)->not->toBeEmpty()
        ->and($product->primary_supplier_id)->not->toBeNull()
        ->and($product->prices()->count())->toBeGreaterThanOrEqual(3)
        ->and($product->suppliers()->count())->toBe(1);
});
