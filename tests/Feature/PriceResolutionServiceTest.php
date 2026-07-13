<?php

use App\Domain\Catalog\Services\PriceResolutionService;
use App\Models\Category;
use App\Models\CustomerGroup;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\StoreLocation;
use App\Models\Unit;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->service = new PriceResolutionService;

    // Create base requirements using Eloquent directly
    $this->store = StoreLocation::create([
        'name' => 'Main Store',
        'is_active' => true,
    ]);

    $this->unitBase = Unit::create([
        'name' => 'Pcs',
        'symbol' => 'pcs',
        'is_active' => true,
    ]);

    $this->category = Category::create([
        'name' => 'General',
        'slug' => 'general-'.rand(100, 999),
        'is_active' => true,
    ]);

    $this->warehouse = Warehouse::create([
        'store_location_id' => $this->store->id,
        'name' => 'Main Warehouse',
        'code' => 'W01',
        'is_active' => true,
    ]);

    $this->product = Product::create([
        'store_id' => $this->store->id,
        'category_id' => $this->category->id,
        'default_warehouse_id' => $this->warehouse->id,
        'base_unit_id' => $this->unitBase->id,
        'name' => 'Test Product',
        'sku' => 'PRD-TEST-01',
        'slug' => 'test-product-01',
        'product_type' => 'physical',
        'costing_method' => 'WAC',
    ]);

    $this->customerGroup = CustomerGroup::create([
        'store_id' => $this->store->id,
        'name' => 'VIP',
        'discount_percent' => 0,
        'is_active' => true,
    ]);
});

it('resolves regular base unit price when no specific group or unit is provided', function () {
    ProductPrice::create([
        'product_id' => $this->product->id,
        'store_id' => $this->store->id,
        'unit_id' => $this->unitBase->id,
        'min_qty' => 1,
        'price_type' => 'retail',
        'channel' => 'both',
        'price' => 10000,
        'is_active' => true,
    ]);

    $resolved = $this->service->resolve($this->product, $this->store->id, $this->unitBase->id);

    expect($resolved)->not->toBeNull()
        ->and($resolved->price)->toEqual(10000)
        ->and($resolved->customer_group_id)->toBeNull();
});

it('resolves customer group promo price over regular price', function () {
    // Regular price
    ProductPrice::create([
        'product_id' => $this->product->id,
        'store_id' => $this->store->id,
        'unit_id' => $this->unitBase->id,
        'min_qty' => 1,
        'price_type' => 'retail',
        'channel' => 'both',
        'price' => 10000,
        'is_active' => true,
    ]);

    // Customer group price
    ProductPrice::create([
        'product_id' => $this->product->id,
        'store_id' => $this->store->id,
        'customer_group_id' => $this->customerGroup->id,
        'unit_id' => $this->unitBase->id,
        'min_qty' => 1,
        'price_type' => 'member',
        'channel' => 'both',
        'price' => 9000,
        'is_active' => true,
    ]);

    $resolved = $this->service->resolve($this->product, $this->store->id, $this->unitBase->id, 1, $this->customerGroup->id);

    expect($resolved)->not->toBeNull()
        ->and($resolved->price)->toEqual(9000)
        ->and($resolved->customer_group_id)->toEqual($this->customerGroup->id);
});

it('resolves tier qty promo correctly', function () {
    // Base Customer group price
    ProductPrice::create([
        'product_id' => $this->product->id,
        'store_id' => $this->store->id,
        'customer_group_id' => $this->customerGroup->id,
        'unit_id' => $this->unitBase->id,
        'min_qty' => 1,
        'price_type' => 'member',
        'channel' => 'both',
        'price' => 9000,
        'is_active' => true,
    ]);

    // Tier Customer group price (Buy >= 10)
    ProductPrice::factory()->create([
        'product_id' => $this->product->id,
        'store_id' => $this->store->id,
        'customer_group_id' => $this->customerGroup->id,
        'unit_id' => $this->unitBase->id,
        'min_qty' => 10,
        'price_type' => 'member',
        'channel' => 'both',
        'price' => 8500,
        'is_active' => true,
    ]);

    // Query for 5 items
    $resolved5 = $this->service->resolve($this->product, $this->store->id, $this->unitBase->id, 5, $this->customerGroup->id);
    expect($resolved5->price)->toEqual(9000);

    // Query for 12 items
    $resolved12 = $this->service->resolve($this->product, $this->store->id, $this->unitBase->id, 12, $this->customerGroup->id);
    expect($resolved12->price)->toEqual(8500);
});

it('does not resolve inactive prices or expired dates', function () {
    ProductPrice::factory()->create([
        'product_id' => $this->product->id,
        'store_id' => $this->store->id,
        'unit_id' => $this->unitBase->id,
        'min_qty' => 1,
        'price_type' => 'retail',
        'channel' => 'both',
        'price' => 10000,
        'is_active' => false, // inactive
    ]);

    ProductPrice::factory()->create([
        'product_id' => $this->product->id,
        'store_id' => $this->store->id,
        'unit_id' => $this->unitBase->id,
        'min_qty' => 1,
        'price_type' => 'retail',
        'channel' => 'both',
        'price' => 9000,
        'is_active' => true,
        'active_until' => now()->subDay(), // expired
    ]);

    $resolved = $this->service->resolve($this->product, $this->store->id, $this->unitBase->id);

    expect($resolved)->toBeNull();
});
