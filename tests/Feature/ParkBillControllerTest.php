<?php

use App\Models\CashierShift;
use App\Models\Sale;
use App\Models\StoreLocation;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function (): void {
    $this->seed(RolePermissionSeeder::class);

    $this->store = StoreLocation::factory()->create();
    $this->cashier = User::factory()->create(['store_id' => $this->store->id]);
    $this->cashier->assignRole('Kasir');
    $this->shift = CashierShift::factory()->create([
        'store_id' => $this->store->id,
        'user_id' => $this->cashier->id,
        'status' => 'open',
    ]);
});

it('only returns parked bills from the cashier store and shift', function () {
    $ownBill = parkedSale($this->store->id, $this->cashier->id, $this->shift->id);
    $otherStore = StoreLocation::factory()->create();
    $otherCashier = User::factory()->create(['store_id' => $otherStore->id]);
    $otherShift = CashierShift::factory()->create([
        'store_id' => $otherStore->id,
        'user_id' => $otherCashier->id,
        'status' => 'open',
    ]);
    parkedSale($otherStore->id, $otherCashier->id, $otherShift->id);

    $this->actingAs($this->cashier)
        ->getJson('/admin/pos/parked-bills?cashier_shift_id='.$this->shift->id)
        ->assertOk()
        ->assertJsonCount(1, 'data')
        ->assertJsonPath('data.0.id', $ownBill->id);
});

it('cannot cancel a parked bill from another store', function () {
    $otherStore = StoreLocation::factory()->create();
    $otherCashier = User::factory()->create(['store_id' => $otherStore->id]);
    $foreignBill = parkedSale($otherStore->id, $otherCashier->id, null);

    $this->actingAs($this->cashier)
        ->deleteJson('/admin/pos/parked-bills/'.$foreignBill->id)
        ->assertForbidden();

    $this->assertDatabaseHas('sales', ['id' => $foreignBill->id, 'status' => 'parked']);
});

it('does not expose another cashier queue in the same store', function () {
    parkedSale($this->store->id, $this->cashier->id, $this->shift->id);
    $otherCashier = User::factory()->create(['store_id' => $this->store->id]);
    $otherShift = CashierShift::factory()->create([
        'store_id' => $this->store->id,
        'user_id' => $otherCashier->id,
        'status' => 'open',
    ]);
    parkedSale($this->store->id, $otherCashier->id, $otherShift->id);

    $this->actingAs($this->cashier)
        ->getJson('/admin/pos/parked-bills?cashier_shift_id='.$otherShift->id)
        ->assertOk()
        ->assertJsonCount(0, 'data');
});

function parkedSale(int $storeId, int $userId, ?int $shiftId): Sale
{
    return Sale::query()->create([
        'store_id' => $storeId,
        'sale_number' => 'PARK-'.str()->uuid(),
        'cashier_shift_id' => $shiftId,
        'channel' => 'pos',
        'status' => 'parked',
        'subtotal' => 10_000,
        'discount_total' => 0,
        'tax_total' => 0,
        'total_amount' => 10_000,
        'paid_amount' => 0,
        'change_amount' => 0,
        'payment_status' => 'unpaid',
        'created_by' => $userId,
    ]);
}
