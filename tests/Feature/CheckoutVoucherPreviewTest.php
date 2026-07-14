<?php

use App\Models\Cart;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\Promotion;
use App\Models\PromotionReward;
use App\Models\StoreLocation;
use App\Models\Unit;
use App\Models\Voucher;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('previews a valid online voucher against the current cart', function () {
    $store = StoreLocation::factory()->create([
        'is_main' => true,
        'is_active' => true,
    ]);
    $unit = Unit::factory()->create();
    $warehouse = Warehouse::factory()->create(['store_location_id' => $store->id]);
    $product = Product::factory()->create([
        'store_id' => $store->id,
        'category_id' => Category::factory(),
        'default_warehouse_id' => $warehouse->id,
        'base_unit_id' => $unit->id,
        'sellable_online' => true,
    ]);
    ProductPrice::factory()->create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'unit_id' => $unit->id,
        'price' => 10000,
    ]);
    $promotion = Promotion::query()->create([
        'store_id' => $store->id,
        'name' => 'Voucher Hemat 10%',
        'type' => 'voucher',
        'status' => 'active',
        'start_date' => now()->subDay(),
        'end_date' => now()->addDay(),
        'channel' => 'online',
        'is_active' => true,
        'is_stackable' => false,
        'applicable_scope' => 'all',
    ]);
    PromotionReward::query()->create([
        'promotion_id' => $promotion->id,
        'reward_type' => 'percent_discount',
        'value' => 10,
    ]);
    Voucher::query()->create([
        'promotion_id' => $promotion->id,
        'code' => 'HEMAT10',
        'is_active' => true,
    ]);
    $customer = Customer::query()->create([
        'name' => 'Pelanggan Voucher',
        'phone' => '081234567890',
    ]);
    $cart = Cart::query()->create(['customer_id' => $customer->id]);
    $cart->items()->create([
        'product_id' => $product->id,
        'unit_id' => $unit->id,
        'qty' => 2,
    ]);

    $response = $this->actingAs($customer, 'customer')
        ->postJson('/checkout/voucher-preview', ['voucher_code' => 'hemat10']);

    $response
        ->assertOk()
        ->assertJsonPath('voucher_code', 'HEMAT10')
        ->assertJsonPath('subtotal', 20000)
        ->assertJsonPath('discount_total', 2000)
        ->assertJsonPath('total', 18000)
        ->assertJsonPath('applied_promotions.0.name', 'Voucher Hemat 10%');
});
