<?php

use App\Domain\Inventory\Actions\ReceiveStockAction;
use App\Models\Category;
use App\Models\Product;
use App\Models\StockIn;
use App\Models\StockLedger;
use App\Models\StoreLocation;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('correctly processes stock in and updates WAC and stock ledger', function () {
    $store = StoreLocation::factory()->create();
    $supplier = Supplier::factory()->create(['store_id' => $store->id, 'code' => 'SUP01', 'name' => 'Supplier A']);
    $warehouse = Warehouse::factory()->create(['store_location_id' => $store->id, 'code' => 'WH01', 'name' => 'Warehouse A']);
    $user = User::factory()->create(['store_id' => $store->id, 'name' => 'User A', 'email' => 'user@a.com', 'password' => 'password']);

    $category = Category::factory()->create(['slug' => 'cat-a', 'name' => 'Cat A']);
    $unit = Unit::factory()->create(['name' => 'Pcs', 'symbol' => 'pcs']);

    $product = Product::factory()->create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'base_unit_id' => $unit->id,
        'default_warehouse_id' => $warehouse->id,
        'name' => 'Product A',
        'slug' => 'product-a',
        'sku' => 'SKU-A',
        'stok_saat_ini' => 10,
        'hpp_current' => 1000,
    ]);

    $stockIn = StockIn::create([
        'store_id' => $store->id,
        'supplier_id' => $supplier->id,
        'warehouse_id' => $warehouse->id,
        'status' => 'draft',
        'total_amount' => 15000,
        'created_by' => $user->id,
    ]);

    $stockIn->details()->create([
        'product_id' => $product->id,
        'unit_id' => $unit->id,
        'qty' => 10,
        'purchase_price_per_unit' => 1500, // Total = 15000
    ]);

    $action = app(ReceiveStockAction::class);
    $action->execute($stockIn);

    // Refresh models
    $product->refresh();
    $stockIn->refresh();

    // Verify Product Updates
    // Old: 10 * 1000 = 10000
    // New: 10 * 1500 = 15000
    // Total Value: 25000
    // Total Qty: 20
    // New WAC: 1250
    expect((float) $product->stok_saat_ini)->toEqual(20.0);
    expect((float) $product->hpp_current)->toEqual(1250.0);
    expect($stockIn->status)->toEqual('completed');

    // Verify Stock Ledger
    $ledger = StockLedger::where('product_id', $product->id)->first();
    expect($ledger)->not->toBeNull();
    expect((float) $ledger->qty)->toEqual(10.0);
    expect((float) $ledger->qty_running_balance)->toEqual(20.0);
    expect((float) $ledger->hpp_at_time)->toEqual(1250.0);
    expect($ledger->movement_type)->toEqual('in');
});

it('throws exception if stock in is not draft', function () {
    $store = StoreLocation::factory()->create();
    $stockIn = StockIn::create([
        'store_id' => $store->id,
        'supplier_id' => Supplier::factory()->create(['store_id' => $store->id, 'code' => 'SUP02', 'name' => 'Supplier A'])->id,
        'warehouse_id' => Warehouse::factory()->create(['store_location_id' => $store->id, 'code' => 'WH02', 'name' => 'Warehouse A'])->id,
        'status' => 'completed',
        'created_by' => User::factory()->create(['store_id' => $store->id, 'name' => 'User A', 'email' => 'a@b.com', 'password' => 'pwd'])->id,
    ]);

    $action = app(ReceiveStockAction::class);

    expect(fn () => $action->execute($stockIn))
        ->toThrow(RuntimeException::class, 'Stock In is already processed or cancelled.');
});
