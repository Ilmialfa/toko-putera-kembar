<?php

use App\Domain\Inventory\Services\InventoryOperationService;
use App\Models\Product;
use App\Models\StockLedger;
use App\Models\StockTransfer;
use App\Models\StoreLocation;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;

it('mencatat transfer keluar dan masuk pada ledger immutable', function () {
    $store = StoreLocation::factory()->create(['is_main' => true]);
    $user = User::factory()->create(['store_id' => $store->id]);
    $from = Warehouse::factory()->create(['store_location_id' => $store->id]);
    $to = Warehouse::factory()->create(['store_location_id' => $store->id]);
    $unit = Unit::factory()->create();
    $product = Product::factory()->create([
        'store_id' => $store->id,
        'default_warehouse_id' => $from->id,
        'base_unit_id' => $unit->id,
        'stok_saat_ini' => 100,
    ]);
    $transfer = StockTransfer::query()->create([
        'store_id' => $store->id,
        'transfer_number' => 'TRF-TEST-1',
        'from_warehouse_id' => $from->id,
        'to_warehouse_id' => $to->id,
        'status' => 'draft',
        'requested_by' => $user->id,
    ]);
    $transfer->details()->create(['product_id' => $product->id, 'unit_id' => $unit->id, 'qty' => 10]);

    $service = app(InventoryOperationService::class);
    $service->transitionTransfer($transfer, 'in_transit', $user->id);
    $service->transitionTransfer($transfer->refresh(), 'received', $user->id);

    expect(StockLedger::query()->where('reference_type', StockTransfer::class)->count())->toBe(2)
        ->and($product->refresh()->stok_saat_ini)->toBe('100.000')
        ->and($transfer->refresh()->status)->toBe('received');
});
