<?php

use App\Models\CashierShift;
use App\Models\StoreLocation;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('opens a cashier shift without optional notes', function () {
    $this->seed(RolePermissionSeeder::class);
    $store = StoreLocation::factory()->create();
    $cashier = User::factory()->create(['store_id' => $store->id]);
    $cashier->assignRole('Kasir');

    $response = $this->actingAs($cashier)->post(route('admin.pos.shift.open'), [
        'opening_balance' => 0,
    ]);

    $response->assertRedirect()->assertSessionHas('success');

    $shift = CashierShift::query()->where('user_id', $cashier->id)->sole();

    expect((float) $shift->opening_balance)->toBe(0.0)
        ->and($shift->notes)->toBeNull()
        ->and($shift->status)->toBe('open');
});

it('closes a cashier shift without optional notes', function () {
    $this->seed(RolePermissionSeeder::class);
    $store = StoreLocation::factory()->create();
    $cashier = User::factory()->create(['store_id' => $store->id]);
    $cashier->assignRole('Kasir');
    $shift = CashierShift::query()->create([
        'store_id' => $store->id,
        'user_id' => $cashier->id,
        'opening_balance' => 100000,
        'status' => 'open',
        'opening_at' => now(),
    ]);

    $response = $this->actingAs($cashier)->post(route('admin.pos.shift.close'), [
        'closing_balance_actual' => 100000,
    ]);

    $response->assertRedirect(route('admin.pos.index'))->assertSessionHas('success');

    expect($shift->refresh()->status)->toBe('closed')
        ->and((float) $shift->selisih_kas)->toBe(0.0)
        ->and($shift->notes)->toBeNull();
});
