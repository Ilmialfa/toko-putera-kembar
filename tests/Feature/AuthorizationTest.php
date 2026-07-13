<?php

use App\Models\StoreLocation;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
    // Prevent StoreScope from crashing without StoreLocation
    StoreLocation::factory()->create(['is_main' => true]);
    $this->seed(RolePermissionSeeder::class);
});

test('cashier cannot access finance routes', function () {
    $cashier = User::factory()->create();
    $cashier->assignRole('Kasir');

    $response = $this->actingAs($cashier)->get('/admin/finance/expenses');
    $response->assertStatus(403);
});

test('owner can access finance routes', function () {
    $owner = User::factory()->create();
    $owner->assignRole('Owner');

    $response = $this->actingAs($owner)->get('/admin/finance/expenses');
    $response->assertStatus(200);
});
