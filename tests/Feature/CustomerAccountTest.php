<?php

use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\StoreLocation;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function (): void {
    $this->withoutVite();
});

function makeCustomer(string $email = 'customer@example.test'): Customer
{
    return Customer::query()->create([
        'name' => 'Pelanggan Toko',
        'email' => $email,
        'phone' => '0812'.str_pad((string) Customer::query()->count(), 8, '0', STR_PAD_LEFT),
        'password' => Hash::make('password123'),
    ]);
}

it('requires a customer session to access the account', function () {
    $this->get('/akun')->assertRedirect('/akun/masuk');
});

it('lets a customer update their profile and manage their addresses', function () {
    $customer = makeCustomer();

    $this->actingAs($customer, 'customer')
        ->put('/akun/profil', [
            'name' => 'Pelanggan Baru',
            'phone' => '081200000099',
            'email' => 'pelanggan.baru@example.test',
        ])
        ->assertSessionHasNoErrors();

    $this->actingAs($customer, 'customer')
        ->post('/akun/alamat', [
            'label' => 'Rumah',
            'recipient_name' => 'Pelanggan Baru',
            'phone' => '081200000099',
            'full_address' => 'Jalan Melati No. 10, Pekanbaru',
            'is_default' => true,
        ])
        ->assertSessionHasNoErrors();

    $address = CustomerAddress::query()->where('customer_id', $customer->id)->firstOrFail();

    $this->actingAs($customer, 'customer')
        ->put("/akun/alamat/{$address->id}", [
            'label' => 'Rumah utama',
            'recipient_name' => 'Pelanggan Baru',
            'phone' => '081200000099',
            'full_address' => 'Jalan Melati No. 11, Pekanbaru',
            'is_default' => true,
        ])
        ->assertSessionHasNoErrors();

    $this->assertDatabaseHas('customer_addresses', [
        'id' => $address->id,
        'label' => 'Rumah utama',
        'is_default' => true,
    ]);
});

it('only exposes orders and addresses belonging to the signed-in customer', function () {
    $customer = makeCustomer();
    $otherCustomer = makeCustomer('other@example.test');
    $store = StoreLocation::factory()->create(['is_main' => true]);
    $otherAddress = CustomerAddress::query()->create([
        'customer_id' => $otherCustomer->id,
        'label' => 'Lain',
        'recipient_name' => $otherCustomer->name,
        'phone' => $otherCustomer->phone,
        'full_address' => 'Jalan Lain No. 1',
        'is_default' => true,
    ]);
    $order = Order::factory()->create([
        'store_id' => $store->id,
        'customer_id' => $otherCustomer->id,
        'customer_address_id' => $otherAddress->id,
    ]);

    $this->actingAs($customer, 'customer')
        ->get('/akun')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('storefront/Account')
            ->has('orders.data', 0)
            ->has('addresses', 0));

    $this->actingAs($customer, 'customer')
        ->get("/akun/pesanan/{$order->id}")
        ->assertNotFound();

    $this->actingAs($customer, 'customer')
        ->delete("/akun/alamat/{$otherAddress->id}")
        ->assertNotFound();
});
