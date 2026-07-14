<?php

use App\Domain\Sales\Actions\ProcessRefundAction;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\SaleReturn;
use App\Models\StoreLocation;
use App\Models\Unit;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolePermissionSeeder::class);

    $this->store = StoreLocation::factory()->create();
    $this->cashier = User::factory()->create(['store_id' => $this->store->id]);
    $this->cashier->assignRole('Kasir');
});

it('shows sale returns scoped to the signed-in store without querying a missing column', function () {
    $sale = completedSale($this->store->id, $this->cashier->id, 'POS-RETURN-001');
    SaleReturn::query()->create([
        'store_id' => $this->store->id,
        'sale_id' => $sale->id,
        'type' => 'return',
        'status' => 'pending_approval',
        'total_refund_amount' => 12_000,
        'created_by' => $this->cashier->id,
    ]);

    $this->actingAs($this->cashier)
        ->get('/admin/pos/sale-returns')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('sales/Returns')
            ->has('returns.data', 1)
            ->where('returns.data.0.sale_id', $sale->id));
});

it('shows one combined transaction history while keeping transactions scoped to the store', function () {
    completedSale($this->store->id, $this->cashier->id, 'POS-HISTORY-001', 'pos');
    completedSale($this->store->id, $this->cashier->id, 'ONL-HISTORY-001', 'online');
    $otherStore = StoreLocation::factory()->create();
    completedSale($otherStore->id, $this->cashier->id, 'POS-OTHER-001');

    $this->actingAs($this->cashier)
        ->get('/admin/sales/transactions')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('sales/Transactions')
            ->has('transactions.data', 2)
            ->where('transactions.total', 2));
});

it('calculates the refund from sale items instead of accepting a client-provided total', function () {
    $sale = completedSale($this->store->id, $this->cashier->id, 'POS-RETURN-TOTAL-001');
    $saleItem = saleItemForReturn($sale, $this->store->id, 2, 96_000);

    $saleReturn = app(ProcessRefundAction::class)->execute([
        'sale_id' => $sale->id,
        'type' => 'return',
        'total_refund_amount' => 1,
        'items' => [[
            'sale_item_id' => $saleItem->id,
            'qty' => 2,
            'condition' => 'good',
        ]],
    ], $this->cashier->id, $this->store->id);

    expect((float) $saleReturn->total_refund_amount)->toBe(192_000.0);
});

it('prevents cumulative return requests from exceeding the sold quantity', function () {
    $sale = completedSale($this->store->id, $this->cashier->id, 'POS-RETURN-LIMIT-001');
    $saleItem = saleItemForReturn($sale, $this->store->id, 2, 15_000);
    $existingReturn = SaleReturn::query()->create([
        'store_id' => $this->store->id,
        'sale_id' => $sale->id,
        'type' => 'return',
        'status' => 'pending_approval',
        'total_refund_amount' => 30_000,
        'created_by' => $this->cashier->id,
    ]);
    $existingReturn->items()->create([
        'sale_item_id' => $saleItem->id,
        'qty' => 2,
        'condition' => 'good',
    ]);

    expect(fn () => app(ProcessRefundAction::class)->execute([
        'sale_id' => $sale->id,
        'type' => 'return',
        'total_refund_amount' => 15_000,
        'items' => [[
            'sale_item_id' => $saleItem->id,
            'qty' => 1,
            'condition' => 'good',
        ]],
    ], $this->cashier->id, $this->store->id))->toThrow(ValidationException::class);
});

function completedSale(
    int $storeId,
    int $userId,
    string $number,
    string $channel = 'pos',
): Sale {
    return Sale::query()->create([
        'store_id' => $storeId,
        'sale_number' => $number,
        'channel' => $channel,
        'status' => 'completed',
        'subtotal' => 12_000,
        'discount_total' => 0,
        'tax_total' => 0,
        'total_amount' => 12_000,
        'paid_amount' => 12_000,
        'change_amount' => 0,
        'payment_status' => 'paid',
        'created_by' => $userId,
    ]);
}

function saleItemForReturn(Sale $sale, int $storeId, int $quantity, int $price): SaleItem
{
    $unit = Unit::factory()->create();
    $product = Product::factory()->create([
        'store_id' => $storeId,
        'base_unit_id' => $unit->id,
    ]);

    return SaleItem::query()->create([
        'sale_id' => $sale->id,
        'product_id' => $product->id,
        'unit_id' => $unit->id,
        'qty' => $quantity,
        'price_per_unit' => $price,
        'subtotal' => $quantity * $price,
    ]);
}
