<?php

use App\Models\Cart;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\StoreLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->withoutVite();
});

it('renders the company profile from the active store location', function () {
    $store = StoreLocation::factory()->create([
        'name' => 'Putera Kembar Pekanbaru',
        'address' => 'Jalan Contoh No. 10, Pekanbaru',
        'phone' => '081234567890',
        'is_main' => true,
    ]);

    $this->get('/tentang')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('storefront/CompanyProfile')
            ->where('store.name', $store->name)
            ->where('store.address', $store->address));
});

it('shares the delivery coverage settings from the main store', function () {
    $store = StoreLocation::factory()->create([
        'is_main' => true,
        'latitude' => 0.5600695,
        'longitude' => 101.4419508,
        'delivery_radius_km' => 7,
    ]);

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->where('storefront_delivery.latitude', 0.5600695)
            ->where('storefront_delivery.longitude', 101.4419508)
            ->where('storefront_delivery.delivery_radius_km', 7));
});

it('shares the quantity in cart for each product unit on the storefront', function () {
    $store = StoreLocation::factory()->create(['is_main' => true]);
    $product = Product::factory()->create(['store_id' => $store->id]);
    ProductPrice::factory()->create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'unit_id' => $product->base_unit_id,
        'price' => 15_000,
    ]);
    $cart = Cart::query()->create(['session_id' => 'storefront-test-session']);
    $cart->items()->create([
        'product_id' => $product->id,
        'unit_id' => $product->base_unit_id,
        'qty' => 3,
    ]);

    $this->withCookie('cart_session', 'storefront-test-session')
        ->get('/katalog')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('storefront/Index')
            ->where("cartQuantities.{$product->id}:{$product->base_unit_id}", 3));
});

it('renders the multi-page home with its active product fallback', function () {
    $store = StoreLocation::factory()->create(['is_main' => true]);
    $product = Product::factory()->create([
        'store_id' => $store->id,
        'sellable_online' => true,
        'is_active' => true,
    ]);

    ProductPrice::factory()->create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'unit_id' => $product->base_unit_id,
        'price' => 15_000,
    ]);

    $this->get('/')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('storefront/Home')
            ->has('popularProducts', 1)
            ->where('popularProducts.0.id', $product->id));
});

it('renders catalog and promo pages separately', function () {
    $this->get('/katalog')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('storefront/Index'));

    $this->get('/promo')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page->component('storefront/Promotions'));
});

it('searches catalog descriptions, barcodes, and tolerant product names', function () {
    $store = StoreLocation::factory()->create(['is_main' => true]);
    $product = Product::factory()->create([
        'store_id' => $store->id,
        'name' => 'Indomie Goreng Rendang',
        'description_long' => 'Mie instan dengan bumbu rendang untuk stok warung.',
        'barcode_primary' => '8991234567890',
        'sellable_online' => true,
        'is_active' => true,
    ]);
    ProductPrice::factory()->create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'unit_id' => $product->base_unit_id,
        'price' => 15_000,
    ]);

    $this->get('/katalog?search=bumbu%20rendang')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('storefront/Index')
            ->where('products.data.0.id', $product->id));

    $this->get('/katalog?search=indomii')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('storefront/Index')
            ->where('products.data.0.id', $product->id)
            ->where('searchSuggestions.0.name', $product->name));
});

it('adds products to the cart without requiring a page redirect', function () {
    $store = StoreLocation::factory()->create(['is_main' => true]);
    $product = Product::factory()->create(['store_id' => $store->id]);
    ProductPrice::factory()->create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'unit_id' => $product->base_unit_id,
        'price' => 15_000,
    ]);

    $this->postJson('/cart', [
        'product_id' => $product->id,
        'unit_id' => $product->base_unit_id,
        'qty' => 1,
    ])->assertOk()
        ->assertJsonPath('cart_count', 1)
        ->assertJsonPath('message', 'Ditambahkan ke keranjang.');

    $this->assertDatabaseHas('cart_items', [
        'product_id' => $product->id,
        'unit_id' => $product->base_unit_id,
        'qty' => 1,
    ]);
});

it('requires a location for a delivery checkout without a saved address', function () {
    $this->post('/checkout', [
        'delivery_method' => 'delivery',
        'recipient_name' => 'Pelanggan Toko',
        'phone' => '081234567890',
        'full_address' => 'Jalan Sudirman, Pekanbaru',
        'payment_method' => 'qris',
    ])->assertSessionHasErrors(['latitude', 'longitude']);
});
