<?php

use App\Domain\Promotion\Services\LoyaltyPointService;
use App\Domain\Sales\Actions\CheckoutPosAction;
use App\Models\CashierShift;
use App\Models\Category;
use App\Models\Customer;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\StoreLocation;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Database\Seeders\ChartOfAccountSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('can process pos checkout and deduct stock', function () {
    $this->seed(ChartOfAccountSeeder::class);

    // 1. Setup Data
    $store = StoreLocation::factory()->create([
        'name' => 'Test Store',
    ]);
    $warehouse = Warehouse::factory()->create([
        'store_location_id' => $store->id,
        'name' => 'Main Warehouse',
        'code' => 'WH01',
    ]);
    $user = User::factory()->create(['store_id' => $store->id]);
    $unit = Unit::factory()->create([
        'name' => 'Piece',
        'symbol' => 'PCS',
    ]);

    $category = Category::factory()->create([
        'name' => 'Food',
        'slug' => 'food',
    ]);

    $product = Product::factory()->create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'default_warehouse_id' => $warehouse->id,
        'name' => 'Indomie Goreng',
        'barcode_primary' => '8991234567890',
        'base_unit_id' => $unit->id,
        'product_type' => 'physical',
        'track_batch' => false,
        'stok_saat_ini' => 10,
        'hpp_current' => 5000,
    ]);
    ProductPrice::factory()->create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'unit_id' => $unit->id,
        'price_type' => 'retail',
        'min_qty' => 1,
        'price' => 10000,
        'channel' => 'both',
        'is_active' => true,
    ]);

    $shift = CashierShift::factory()->create([
        'store_id' => $store->id,
        'user_id' => $user->id,
        'status' => 'open',
    ]);

    // 2. Action Data
    $checkoutData = [
        'cashier_shift_id' => $shift->id,
        'subtotal' => 20000,
        'discount_total' => 0,
        'tax_total' => 0,
        'total_amount' => 20000,
        'paid_amount' => 50000,
        'change_amount' => 30000,
        'payment_status' => 'paid',
        'items' => [
            [
                'product_id' => $product->id,
                'unit_id' => $unit->id,
                'qty' => 2,
                'price_per_unit' => 10000,
                'discount_amount' => 0,
                'subtotal' => 20000,
            ],
        ],
        'payments' => [
            [
                'method' => 'cash',
                'amount' => 20000,
            ],
        ],
    ];

    $action = app(CheckoutPosAction::class);

    // 3. Execute
    $sale = $action->execute($checkoutData, $user->id, $store->id, $warehouse->id);

    // 4. Assert
    expect($sale->sale_number)->not->toBeNull()
        ->and($sale->total_amount)->toEqual(20000)
        ->and($sale->items)->toHaveCount(1)
        ->and($sale->payments)->toHaveCount(1);

    // Assert stock reduced globally
    $product->refresh();
    expect((float) $product->stok_saat_ini)->toEqual(8); // 10 - 2

    // Assert Stock Ledger created
    $this->assertDatabaseHas('stock_ledgers', [
        'product_id' => $product->id,
        'movement_type' => 'out',
        'qty' => 2,
    ]);
});

it('records a receivable and only counts settled payment in the cashier drawer', function () {
    $this->seed(ChartOfAccountSeeder::class);

    $store = StoreLocation::factory()->create();
    $warehouse = Warehouse::factory()->create(['store_location_id' => $store->id]);
    $user = User::factory()->create(['store_id' => $store->id]);
    $unit = Unit::factory()->create(['symbol' => 'PCS']);
    $category = Category::factory()->create();
    $product = Product::factory()->create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'default_warehouse_id' => $warehouse->id,
        'base_unit_id' => $unit->id,
        'stok_saat_ini' => 10,
        'hpp_current' => 5_000,
    ]);
    ProductPrice::factory()->create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'unit_id' => $unit->id,
        'price_type' => 'retail',
        'min_qty' => 1,
        'price' => 10_000,
        'channel' => 'both',
        'is_active' => true,
    ]);
    $shift = CashierShift::factory()->create([
        'store_id' => $store->id,
        'user_id' => $user->id,
        'status' => 'open',
    ]);
    $customer = Customer::query()->create([
        'name' => 'Pelanggan Tempo',
        'phone' => '081234567890',
    ]);

    $sale = app(CheckoutPosAction::class)->execute([
        'cashier_shift_id' => $shift->id,
        'customer_id' => $customer->id,
        'discount_total' => 0,
        'tax_total' => 0,
        'items' => [[
            'product_id' => $product->id,
            'unit_id' => $unit->id,
            'qty' => 2,
            'discount_amount' => 0,
        ]],
        'payments' => [
            ['method' => 'cash', 'amount' => 5_000],
            ['method' => 'piutang', 'amount' => 15_000],
        ],
        'receivable_due_date' => now()->addDays(30)->toDateString(),
    ], $user->id, $store->id, $warehouse->id);

    expect((float) $sale->paid_amount)->toBe(5_000.0)
        ->and($sale->payment_status)->toBe('partial')
        ->and((float) $sale->change_amount)->toBe(0.0);

    $this->assertDatabaseHas('receivables', [
        'sale_id' => $sale->id,
        'customer_id' => $customer->id,
        'amount' => 15_000,
        'status' => 'unpaid',
    ]);
    $this->assertDatabaseHas('cash_movements', [
        'cashier_shift_id' => $shift->id,
        'type' => 'in',
        'amount' => 5_000,
    ]);
});

it('converts customer points to rupiah using the store loyalty settings', function () {
    $this->seed(ChartOfAccountSeeder::class);

    $store = StoreLocation::factory()->create([
        'settings' => [
            'loyalty' => [
                'enabled' => true,
                'earn_spend_amount' => 10000,
                'earn_points' => 1,
                'redeem_value' => 100,
                'redeem_min_points' => 50,
                'redeem_max_points' => 500,
                'redeem_max_percentage' => 50,
                'expiry_months' => 12,
            ],
        ],
    ]);
    $warehouse = Warehouse::factory()->create(['store_location_id' => $store->id]);
    $user = User::factory()->create(['store_id' => $store->id]);
    $unit = Unit::factory()->create(['symbol' => 'PCS']);
    $category = Category::factory()->create();
    $product = Product::factory()->create([
        'store_id' => $store->id,
        'category_id' => $category->id,
        'default_warehouse_id' => $warehouse->id,
        'base_unit_id' => $unit->id,
        'stok_saat_ini' => 10,
        'hpp_current' => 5_000,
    ]);
    ProductPrice::factory()->create([
        'product_id' => $product->id,
        'store_id' => $store->id,
        'unit_id' => $unit->id,
        'price_type' => 'retail',
        'min_qty' => 1,
        'price' => 10_000,
        'channel' => 'both',
        'is_active' => true,
    ]);
    $shift = CashierShift::factory()->create([
        'store_id' => $store->id,
        'user_id' => $user->id,
        'status' => 'open',
    ]);
    $customer = Customer::query()->create([
        'name' => 'Pelanggan Poin',
        'phone' => '081234567890',
    ]);
    app(LoyaltyPointService::class)->earn($customer->id, 200, Sale::class, 99);

    $sale = app(CheckoutPosAction::class)->execute([
        'cashier_shift_id' => $shift->id,
        'customer_id' => $customer->id,
        'discount_total' => 0,
        'tax_total' => 0,
        'items' => [[
            'product_id' => $product->id,
            'unit_id' => $unit->id,
            'qty' => 2,
            'discount_amount' => 0,
        ]],
        'payments' => [
            ['method' => 'points', 'amount' => 1, 'points_to_redeem' => 100],
            ['method' => 'cash', 'amount' => 10_000],
        ],
    ], $user->id, $store->id, $warehouse->id);

    expect((float) $sale->total_amount)->toBe(20_000.0)
        ->and((float) $sale->paid_amount)->toBe(20_000.0)
        ->and($customer->refresh()->loyalty_point_balance)->toBe(102);

    $this->assertDatabaseHas('sale_payments', [
        'sale_id' => $sale->id,
        'method' => 'points',
        'amount' => 10_000,
    ]);
});
