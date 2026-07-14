<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Inertia\Testing\AssertableInertia as Assert;

uses(RefreshDatabase::class);

it('groups legacy permissions separately for the role management interface', function () {
    $this->seed(RolePermissionSeeder::class);
    $owner = User::factory()->create();
    $owner->assignRole('Owner');

    $this->actingAs($owner)
        ->get('/admin/access/roles')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('admin/access/Roles')
            ->has('permissionGroups.legacy')
            ->has('permissionGroups.attendance'));
});
