<?php

use App\Domain\Promotion\Services\LoyaltyPointService;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->user = User::factory()->create();
    $this->service = new LoyaltyPointService;
});

it('can earn points', function () {
    $point = $this->service->earn($this->user->id, 100, 'App\Models\Sale', 1);

    expect($point->points)->toBe(100);
    expect($point->type)->toBe('earn');
    expect($this->service->getBalance($this->user->id))->toBe(100);
});

it('can redeem points', function () {
    $this->service->earn($this->user->id, 200, 'App\Models\Sale', 1);

    $point = $this->service->redeem($this->user->id, 50, 'App\Models\Sale', 2);

    expect($point->points)->toBe(-50);
    expect($point->type)->toBe('redeem');
    expect($this->service->getBalance($this->user->id))->toBe(150);
});

it('fails to redeem more points than balance', function () {
    $this->service->earn($this->user->id, 100, 'App\Models\Sale', 1);

    expect(fn () => $this->service->redeem($this->user->id, 150, 'App\Models\Sale', 2))
        ->toThrow(ValidationException::class, 'Insufficient points balance.');
});

it('respects max limit during redemption', function () {
    $this->service->earn($this->user->id, 500, 'App\Models\Sale', 1);

    expect(fn () => $this->service->redeem($this->user->id, 300, 'App\Models\Sale', 2, 250))
        ->toThrow(ValidationException::class, 'Maximum points you can redeem is 250.');
});
