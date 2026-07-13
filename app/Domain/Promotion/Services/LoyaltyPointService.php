<?php

namespace App\Domain\Promotion\Services;

use App\Models\CustomerPoint;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoyaltyPointService
{
    public function earn(int $customerId, int $points, string $referenceType, int $referenceId, ?string $notes = null): CustomerPoint
    {
        return CustomerPoint::create([
            'customer_id' => $customerId,
            'type' => 'earn',
            'points' => abs($points),
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'expiry_date' => Carbon::now()->addYear(), // default 1 year expiry
            'notes' => $notes ?? 'Earned points from transaction',
        ]);
    }

    /**
     * @param  int|null  $maxLimit  Limit of points to redeem from store settings
     *
     * @throws ValidationException
     */
    public function redeem(int $customerId, int $pointsToRedeem, string $referenceType, int $referenceId, ?int $maxLimit = null, ?string $notes = null): CustomerPoint
    {
        if ($pointsToRedeem <= 0) {
            throw ValidationException::withMessages(['points' => 'Points to redeem must be greater than zero.']);
        }

        if ($maxLimit !== null && $pointsToRedeem > $maxLimit) {
            throw ValidationException::withMessages(['points' => "Maximum points you can redeem is {$maxLimit}."]);
        }

        return DB::transaction(function () use ($customerId, $pointsToRedeem, $referenceType, $referenceId, $notes) {
            $currentBalance = CustomerPoint::where('customer_id', $customerId)->sum('points');

            if ($currentBalance < $pointsToRedeem) {
                throw ValidationException::withMessages(['points' => 'Insufficient points balance.']);
            }

            return CustomerPoint::create([
                'customer_id' => $customerId,
                'type' => 'redeem',
                'points' => -abs($pointsToRedeem),
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => $notes ?? 'Redeemed points',
            ]);
        });
    }

    /**
     * Calculate current balance
     */
    public function getBalance(int $customerId): int
    {
        return CustomerPoint::where('customer_id', $customerId)
            ->where(function ($query) {
                $query->whereNull('expiry_date')
                    ->orWhere('expiry_date', '>=', Carbon::today());
            })
            ->sum('points');
    }
}
