<?php

use App\Domain\Finance\Services\JournalService;
use App\Models\Product;
use App\Models\Sale;
use App\Models\StoreLocation;
use App\Models\Unit;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('records a balanced sale journal using actual payment and hpp snapshots', function () {
    $this->seed(ChartOfAccountSeeder::class);

    $store = StoreLocation::factory()->create();
    $user = User::factory()->create(['store_id' => $store->id]);
    $unit = Unit::factory()->create();
    $product = Product::factory()->create([
        'store_id' => $store->id,
        'base_unit_id' => $unit->id,
    ]);

    $sale = Sale::query()->create([
        'store_id' => $store->id,
        'sale_number' => 'POS-TEST-001',
        'channel' => 'pos',
        'status' => 'completed',
        'subtotal' => 20_000,
        'total_amount' => 20_000,
        'paid_amount' => 15_000,
        'payment_status' => 'partial',
        'created_by' => $user->id,
    ]);

    $sale->items()->create([
        'product_id' => $product->id,
        'unit_id' => $unit->id,
        'qty' => 2,
        'price_per_unit' => 10_000,
        'subtotal' => 20_000,
        'hpp_at_time' => 6_000,
    ]);
    $sale->payments()->create(['method' => 'cash', 'amount' => 15_000]);

    $entry = app(JournalService::class)->recordSale($sale);

    $lines = $entry->lines->keyBy(fn ($line) => $line->chartOfAccount->code);

    expect((float) $lines['1100']->debit)->toBe(15_000.0)
        ->and((float) $lines['1200']->debit)->toBe(5_000.0)
        ->and((float) $lines['4100']->credit)->toBe(20_000.0)
        ->and((float) $lines['5100']->debit)->toBe(12_000.0)
        ->and((float) $lines['1300']->credit)->toBe(12_000.0)
        ->and((float) $entry->lines->sum('debit'))->toBe((float) $entry->lines->sum('credit'));

    expect(app(JournalService::class)->recordSale($sale)->id)->toBe($entry->id);
});
