<?php

use App\Models\StoreLocation;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('redirects the legacy dashboard and renders the operational dashboard', function () {
    $this->seed(RolePermissionSeeder::class);

    $store = StoreLocation::factory()->create();
    $user = User::factory()->create(['store_id' => $store->id]);
    $user->assignRole('Owner');

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertRedirect('/admin/dashboard');

    $this->actingAs($user)
        ->get('/admin/dashboard')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/dashboard/Index')
            ->has('metrics')
            ->has('charts.salesTrend', 7)
            ->has('alerts.lowStock'));
});
