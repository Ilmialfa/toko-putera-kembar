<?php

use App\Domain\Promotion\Services\LoyaltyPointService;
use App\Models\Customer;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->customer = Customer::query()->create([
        'name' => 'Pelanggan Poin',
        'phone' => '081234567890',
    ]);
    $this->service = new LoyaltyPointService;
});

it('can earn points and keeps the displayed balance in sync', function () {
    $point = $this->service->earn($this->customer->id, 100, 'App\\Models\\Sale', 1);

    expect($point->points)->toBe(100);
    expect($point->type)->toBe('earn');
    expect($this->service->getBalance($this->customer->id))->toBe(100)
        ->and($this->customer->refresh()->loyalty_point_balance)->toBe(100);
});

it('can redeem points', function () {
    $this->service->earn($this->customer->id, 200, 'App\\Models\\Sale', 1);

    $point = $this->service->redeem($this->customer->id, 50, 'App\\Models\\Sale', 2);

    expect($point->points)->toBe(-50);
    expect($point->type)->toBe('redeem');
    expect($this->service->getBalance($this->customer->id))->toBe(150)
        ->and($this->customer->refresh()->loyalty_point_balance)->toBe(150);
});

it('fails to redeem more points than balance', function () {
    $this->service->earn($this->customer->id, 100, 'App\\Models\\Sale', 1);

    expect(fn () => $this->service->redeem($this->customer->id, 150, 'App\\Models\\Sale', 2))
        ->toThrow(ValidationException::class, 'Saldo poin pelanggan tidak mencukupi.');
});

it('respects max limit during redemption', function () {
    $this->service->earn($this->customer->id, 500, 'App\\Models\\Sale', 1);

    expect(fn () => $this->service->redeem($this->customer->id, 300, 'App\\Models\\Sale', 2, 250))
        ->toThrow(ValidationException::class, 'Maksimal penukaran adalah 250 poin per transaksi.');
});
