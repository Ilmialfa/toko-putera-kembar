<?php

use App\Models\Category;
use App\Models\StoreLocation;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\RolePermissionSeeder;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $this->seed(RolePermissionSeeder::class);

    $this->store = StoreLocation::factory()->create();
    $this->owner = User::factory()->create(['store_id' => $this->store->id]);
    $this->owner->assignRole('Owner');
});

it('renders the master product list and creation form through the active master routes', function () {
    $this->actingAs($this->owner)
        ->get('/admin/master/products')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/catalog/products/Index')
            ->has('products')
            ->has('categories'));

    $this->actingAs($this->owner)
        ->get('/admin/master/products/create')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/catalog/products/Form')
            ->has('categories')
            ->has('units'));
});

it('renders stock reporting in the admin shell with report data', function () {
    $this->actingAs($this->owner)
        ->get('/admin/inventory/reports')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('inventory/reports/Index')
            ->has('products')
            ->has('categories')
            ->has('filters'));
});

it('creates a product under the authenticated owner store', function () {
    $category = Category::factory()->create();
    $unit = Unit::factory()->create();
    $warehouse = Warehouse::factory()->create([
        'store_location_id' => $this->store->id,
    ]);

    $this->actingAs($this->owner)
        ->post('/admin/master/products', [
            'name' => 'Produk Uji Toko',
            'sku' => 'SKU-UJI-001',
            'category_id' => $category->id,
            'default_warehouse_id' => $warehouse->id,
            'base_unit_id' => $unit->id,
            'online_display_unit_id' => $unit->id,
            'display_price_prefix' => 'exact',
            'product_type' => 'physical',
            'costing_method' => 'WAC',
            'is_active' => true,
            'is_sellable' => true,
            'sellable_pos' => true,
            'sellable_online' => true,
            'is_preorder' => false,
            'track_batch' => false,
            'track_expiry' => false,
            'track_serial_number' => false,
            'prices' => [[
                'unit_id' => $unit->id,
                'price_type' => 'retail',
                'min_qty' => 1,
                'price' => 25_000,
                'channel' => 'both',
                'is_active' => true,
            ]],
        ])
        ->assertRedirect(route('admin.master.products.index'));

    $this->assertDatabaseHas('products', [
        'name' => 'Produk Uji Toko',
        'store_id' => $this->store->id,
        'default_warehouse_id' => $warehouse->id,
    ]);
});
