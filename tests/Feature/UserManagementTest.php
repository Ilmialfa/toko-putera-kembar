<?php

use App\Models\StoreLocation;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->withoutVite();
    $this->store = StoreLocation::factory()->create(['is_main' => true]);
    $this->seed(RolePermissionSeeder::class);
    $this->owner = User::factory()->create(['store_id' => $this->store->id]);
    $this->owner->assignRole('Owner');
});

it('mengizinkan owner membuat pengguna dengan role granular', function () {
    $this->actingAs($this->owner)->post('/admin/access/users', [
        'name' => 'Kasir Baru',
        'email' => 'kasir.baru@example.com',
        'phone' => '081234567899',
        'store_id' => $this->store->id,
        'role' => 'Kasir',
        'password' => 'kasir123',
    ])->assertRedirect();

    $user = User::query()->where('email', 'kasir.baru@example.com')->firstOrFail();
    expect($user->hasRole('Kasir'))->toBeTrue()
        ->and($user->must_change_password)->toBeTrue();
});

it('mencegah owner aktif terakhir dinonaktifkan', function () {
    $this->actingAs($this->owner)->put("/admin/access/users/{$this->owner->id}", [
        'name' => $this->owner->name,
        'email' => $this->owner->email,
        'phone' => null,
        'store_id' => $this->store->id,
        'role' => 'Admin',
        'is_active' => false,
    ])->assertSessionHasErrors('role');

    expect($this->owner->refresh()->is_active)->toBeTrue()
        ->and($this->owner->hasRole('Owner'))->toBeTrue();
});
