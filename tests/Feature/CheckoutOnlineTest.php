<?php

use App\Domain\Storefront\Actions\CheckoutOnlineAction;
use App\Models\Cart;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\StoreLocation;
use App\Models\Unit;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('creates an online order with a soft stock reservation', function () {
    $store = StoreLocation::factory()->create([
        'latitude' => 0.5071,
        'longitude' => 101.4478,
        'delivery_radius_km' => 10,
        'is_main' => true,
    ]);
    $unit = Unit::factory()->create();
    $warehouse = Warehouse::factory()->create(['store_location_id' => $store->id]);
    $product = Product::factory()->create([
        'store_id' => $store->id,
        'category_id' => Category::factory(),
        'default_warehouse_id' => $warehouse->id,
        'base_unit_id' => $unit->id,
        'stok_saat_ini' => 20,
        'sellable_online' => true,
    ]);
    ProductPrice::factory()->create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'unit_id' => $unit->id,
        'price' => 12500,
    ]);
    $cart = Cart::create(['session_id' => 'guest-session']);
    $cart->items()->create(['product_id' => $product->id, 'unit_id' => $unit->id, 'qty' => 2]);

    $order = app(CheckoutOnlineAction::class)->execute($cart, $store, [
        'recipient_name' => 'Andi Pelanggan',
        'phone' => '081234567890',
        'full_address' => 'Jalan Sudirman, Pekanbaru',
        'latitude' => 0.508,
        'longitude' => 101.448,
        'payment_method' => 'bank_transfer',
    ], null, 'guest-session');

    expect((float) $order->subtotal)->toBe(25000.0)
        ->and($order->items)->toHaveCount(1)
        ->and($order->reservations)->toHaveCount(1)
        ->and((float) $product->refresh()->stok_saat_ini)->toBe(20.0);

    $this->assertDatabaseHas('stock_reservations', [
        'order_id' => $order->id,
        'product_id' => $product->id,
        'status' => 'active',
    ]);
});
