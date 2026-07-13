<?php

use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('keeps internal staff registration closed to the public', function () {
    $this->get('/register')->assertNotFound();
    $this->post('/register', [])->assertNotFound();
});

it('allows customers to register with the dedicated customer guard', function () {
    $response = $this->post('/akun/daftar', [
        'name' => 'Sari Pelanggan',
        'phone' => '081234567890',
        'email' => 'sari@example.test',
        'password' => 'Rahasia123',
        'password_confirmation' => 'Rahasia123',
    ]);

    $response->assertRedirect(route('customer.account'));
    expect(Customer::query()->where('phone', '081234567890')->exists())->toBeTrue()
        ->and(auth('customer')->check())->toBeTrue();
});

it('allows customers to sign in using their phone number', function () {
    Customer::create([
        'name' => 'Budi Pelanggan',
        'phone' => '089876543210',
        'password' => 'Rahasia123',
    ]);

    $this->post('/akun/masuk', [
        'login' => '089876543210',
        'password' => 'Rahasia123',
    ])->assertRedirect(route('customer.account'));

    expect(auth('customer')->check())->toBeTrue();
});
