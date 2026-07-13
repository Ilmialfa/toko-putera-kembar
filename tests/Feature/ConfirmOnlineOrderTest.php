<?php

use App\Domain\Storefront\Actions\ConfirmOnlineOrderAction;
use App\Enums\OrderStatus;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StockReservation;
use App\Models\StoreLocation;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\ChartOfAccountSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('confirms a paid online order and converts its reservation into stock movement and sale', function () {
    $this->seed([ChartOfAccountSeeder::class, RolePermissionSeeder::class]);

    $store = StoreLocation::factory()->create();
    $user = User::factory()->create(['store_id' => $store->id]);
    $user->assignRole('Owner');
    $warehouse = Warehouse::factory()->create(['store_location_id' => $store->id]);
    $unit = Unit::factory()->create();
    $category = Category::factory()->create();
    $product = Product::factory()->create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'base_unit_id' => $unit->id,
        'default_warehouse_id' => $warehouse->id,
        'product_type' => 'physical',
        'stok_saat_ini' => 10,
        'hpp_current' => 6000,
        'track_batch' => false,
        'track_expiry' => false,
    ]);
    $order = Order::factory()->create([
        'store_id' => $store->id,
        'status' => OrderStatus::PAYMENT_VERIFICATION,
        'subtotal' => 20000,
        'delivery_fee' => 5000,
        'total_amount' => 25000,
        'payment_proof_path' => 'payment-proofs/test.jpg',
    ]);
    $order->items()->create([
        'product_id' => $product->id,
        'unit_id' => $unit->id,
        'qty' => 2,
        'qty_base_unit' => 2,
        'price_per_unit' => 10000,
        'subtotal' => 20000,
    ]);
    StockReservation::factory()->create([
        'store_id' => $store->id,
        'order_id' => $order->id,
        'product_id' => $product->id,
        'qty' => 2,
    ]);

    app(ConfirmOnlineOrderAction::class)->execute($order, $user->id);

    expect($order->fresh()->getRawOriginal('status'))->toBe(OrderStatus::CONFIRMED->value)
        ->and((float) $product->fresh()->stok_saat_ini)->toBe(8.0)
        ->and($order->fresh()->sale_id)->not->toBeNull();

    $this->assertDatabaseHas('stock_reservations', ['order_id' => $order->id, 'status' => 'converted']);
    $this->assertDatabaseHas('stock_ledgers', ['product_id' => $product->id, 'qty' => 2]);
    $this->assertDatabaseHas('sales', ['order_id' => $order->id, 'channel' => 'online']);
    $this->assertDatabaseHas('journal_entries', ['reference_type' => Sale::class]);

    $this->actingAs($user)
        ->get(route('admin.orders.show', $order))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('admin/orders/Show')->where('order.id', $order->id));
});
