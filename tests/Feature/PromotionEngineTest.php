<?php

use App\Domain\Promotion\Services\PromotionEngine;
use App\Models\Promotion;
use App\Models\PromotionUsage;
use App\Models\StoreLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->store = StoreLocation::create([
        'name' => 'Main Store',
        'address' => 'Test',
        'phone' => '123',
        'is_main' => true,
    ]);

    $this->engine = new PromotionEngine;
});

it('applies basic flat discount promotion', function () {
    $promo = Promotion::create([
        'store_id' => $this->store->id,
        'name' => 'Summer Sale',
        'type' => 'discount_item',
        'start_date' => now()->subDay(),
        'end_date' => now()->addDays(5),
        'applicable_scope' => 'all',
        'is_active' => true,
    ]);
    $promo->rewards()->create([
        'reward_type' => 'percent_discount',
        'value' => 10, // 10%
    ]);

    $items = [
        ['product_id' => 1, 'qty' => 1, 'price_per_unit' => 100000, 'subtotal' => 100000, 'category_id' => 1],
    ];

    $result = $this->engine->calculate($this->store->id, 'pos', $items, 100000);

    expect($result['discount_total'])->toEqual(10000);
    expect($result['applied_promotions'])->toHaveCount(1);
    expect($result['items'][0]['discount_amount'])->toEqual(10000);
});

it('applies voucher correctly', function () {
    $promo = Promotion::create([
        'store_id' => $this->store->id,
        'name' => 'Voucher Promo',
        'type' => 'voucher',
        'start_date' => now()->subDay(),
        'end_date' => now()->addDays(5),
        'applicable_scope' => 'all',
        'is_active' => true,
    ]);
    $promo->rewards()->create([
        'reward_type' => 'fixed_discount',
        'value' => 15000,
    ]);
    $voucher = $promo->vouchers()->create([
        'code' => 'TEST15K',
        'is_active' => true,
    ]);

    $items = [
        ['product_id' => 1, 'qty' => 1, 'price_per_unit' => 50000, 'subtotal' => 50000, 'category_id' => 1],
    ];

    $result = $this->engine->calculate($this->store->id, 'pos', $items, 50000, 'TEST15K');

    expect($result['discount_total'])->toEqual(15000);
    expect($result['applied_promotions'])->toHaveCount(1);
    expect($result['items'][0]['discount_amount'])->toEqual(15000);
});

it('respects usage limits', function () {
    $promo = Promotion::create([
        'store_id' => $this->store->id,
        'name' => 'Limited Promo',
        'type' => 'discount_item',
        'start_date' => now()->subDay(),
        'end_date' => now()->addDays(5),
        'applicable_scope' => 'all',
        'usage_limit_total' => 1,
        'is_active' => true,
    ]);
    $promo->rewards()->create([
        'reward_type' => 'fixed_discount',
        'value' => 5000,
    ]);

    PromotionUsage::create([
        'promotion_id' => $promo->id,
        'usable_type' => 'App\Models\Sale',
        'usable_id' => 1,
        'discount_amount_applied' => 5000,
        'used_at' => now(),
    ]);

    $items = [
        ['product_id' => 1, 'qty' => 1, 'price_per_unit' => 50000, 'subtotal' => 50000, 'category_id' => 1],
    ];

    $result = $this->engine->calculate($this->store->id, 'pos', $items, 50000);

    expect($result['discount_total'])->toEqual(0);
    expect($result['applied_promotions'])->toBeEmpty();
});
