<?php

use App\Jobs\ReleaseExpiredReservationsJob;
use App\Models\Product;
use App\Models\StockReservation;
use App\Models\StoreLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('releases only expired active stock reservations', function () {
    $store = StoreLocation::factory()->create();
    $product = Product::factory()->create(['store_id' => $store->id]);
    $expired = StockReservation::factory()->create([
        'store_id' => $store->id,
        'product_id' => $product->id,
        'status' => 'active',
        'expires_at' => now()->subMinute(),
    ]);
    $active = StockReservation::factory()->create([
        'store_id' => $store->id,
        'product_id' => $product->id,
        'status' => 'active',
        'expires_at' => now()->addMinutes(10),
    ]);

    (new ReleaseExpiredReservationsJob)->handle();

    expect($expired->refresh()->status)->toBe('released')
        ->and($active->refresh()->status)->toBe('active');
});
