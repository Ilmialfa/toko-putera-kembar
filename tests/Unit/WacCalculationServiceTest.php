<?php

use App\Domain\Inventory\Services\WacCalculationService;

beforeEach(function () {
    $this->service = new WacCalculationService;
});

it('calculates WAC correctly when there is existing stock', function () {
    // Current: 10 qty at 1000 HPP (Valuation = 10,000)
    // Incoming: 10 qty at 2000 HPP (Total Price = 20,000)
    // Total Qty: 20
    // Total Valuation: 30,000
    // New HPP: 30,000 / 20 = 1500
    $newHpp = $this->service->calculateNewHpp(10, 1000, 10, 20000);
    expect($newHpp)->toEqual(1500.0);
});

it('calculates WAC correctly when current stock is zero', function () {
    // Current: 0 qty at 1500 HPP (Valuation = 0)
    // Incoming: 5 qty at 2000 HPP (Total Price = 10,000)
    // New HPP: 10,000 / 5 = 2000
    $newHpp = $this->service->calculateNewHpp(0, 1500, 5, 10000);
    expect($newHpp)->toEqual(2000.0);
});

it('calculates WAC correctly when current stock is negative', function () {
    // This can happen if stock was allowed to go negative
    // Current: -5 qty at 1500 HPP
    // When stock is <= 0, the new HPP should just be the incoming unit price
    $newHpp = $this->service->calculateNewHpp(-5, 1500, 10, 25000); // Unit price = 2500
    expect($newHpp)->toEqual(2500.0);
});

it('rounds WAC to 4 decimal places correctly', function () {
    // Current: 3 qty at 1000 HPP (Valuation = 3,000)
    // Incoming: 4 qty at 1333.33 HPP (Total Price = 5333.33)
    // Total Qty: 7
    // Total Valuation: 8333.33
    // New HPP: 8333.33 / 7 = 1190.475714...
    // Should be rounded to 1190.4757
    $newHpp = $this->service->calculateNewHpp(3, 1000, 4, 5333.33);
    expect($newHpp)->toEqual(1190.4757);
});

it('handles division by zero safe guard', function () {
    // This is an edge case if incoming qty is 0 and current qty is 0
    $newHpp = $this->service->calculateNewHpp(0, 0, 0, 0);
    expect($newHpp)->toEqual(0);
});
