<?php

use App\Models\StoreLocation;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('allows an owner to save loyalty conversion and redemption limits', function () {
    $this->seed(RolePermissionSeeder::class);
    $store = StoreLocation::factory()->create();
    $owner = User::factory()->create(['store_id' => $store->id]);
    $owner->assignRole('Owner');

    $this->actingAs($owner)
        ->put('/admin/promotions/loyalty-settings', [
            'enabled' => true,
            'earn_spend_amount' => 20000,
            'earn_points' => 2,
            'redeem_value' => 125,
            'redeem_min_points' => 40,
            'redeem_max_points' => 400,
            'redeem_max_percentage' => 40,
            'expiry_months' => 18,
        ])
        ->assertSessionHas('success');

    expect($store->fresh()->settings['loyalty'])->toMatchArray([
        'enabled' => true,
        'earn_spend_amount' => 20000,
        'earn_points' => 2,
        'redeem_value' => 125,
        'redeem_min_points' => 40,
        'redeem_max_points' => 400,
        'redeem_max_percentage' => 40,
        'expiry_months' => 18,
    ]);
});

it('rejects redemption limits where the maximum is below the minimum', function () {
    $this->seed(RolePermissionSeeder::class);
    $store = StoreLocation::factory()->create();
    $owner = User::factory()->create(['store_id' => $store->id]);
    $owner->assignRole('Owner');

    $this->actingAs($owner)
        ->put('/admin/promotions/loyalty-settings', [
            'enabled' => true,
            'earn_spend_amount' => 10000,
            'earn_points' => 1,
            'redeem_value' => 100,
            'redeem_min_points' => 500,
            'redeem_max_points' => 100,
            'redeem_max_percentage' => 50,
            'expiry_months' => 12,
        ])
        ->assertSessionHasErrors('redeem_max_points');
});
