<?php

namespace App\Domain\Promotion\Services;

use App\Models\Customer;
use App\Models\CustomerPoint;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LoyaltyPointService
{
    public function earn(int $customerId, int $points, string $referenceType, int $referenceId, ?string $notes = null, int $expiryMonths = 12): CustomerPoint
    {
        return DB::transaction(function () use ($customerId, $points, $referenceType, $referenceId, $notes, $expiryMonths): CustomerPoint {
            $customer = Customer::query()->lockForUpdate()->findOrFail($customerId);
            $point = CustomerPoint::create([
                'customer_id' => $customerId,
                'type' => 'earn',
                'points' => abs($points),
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'expiry_date' => Carbon::now()->addMonths($expiryMonths),
                'notes' => $notes ?? 'Poin dari transaksi',
            ]);

            $this->syncBalance($customer);

            return $point;
        });
    }

    /**
     * @param  int|null  $maxLimit  Limit of points to redeem from store settings
     *
     * @throws ValidationException
     */
    public function redeem(int $customerId, int $pointsToRedeem, string $referenceType, int $referenceId, ?int $maxLimit = null, ?string $notes = null, ?int $minimumPoints = null): CustomerPoint
    {
        if ($pointsToRedeem <= 0) {
            throw ValidationException::withMessages(['points' => 'Poin yang digunakan harus lebih dari nol.']);
        }

        if ($minimumPoints !== null && $pointsToRedeem < $minimumPoints) {
            throw ValidationException::withMessages(['points' => "Minimal penukaran adalah {$minimumPoints} poin."]);
        }

        if ($maxLimit !== null && $pointsToRedeem > $maxLimit) {
            throw ValidationException::withMessages(['points' => "Maksimal penukaran adalah {$maxLimit} poin per transaksi."]);
        }

        return DB::transaction(function () use ($customerId, $pointsToRedeem, $referenceType, $referenceId, $notes) {
            $customer = Customer::query()->lockForUpdate()->findOrFail($customerId);
            $currentBalance = $this->getBalance($customerId);

            if ($currentBalance < $pointsToRedeem) {
                throw ValidationException::withMessages(['points' => 'Saldo poin pelanggan tidak mencukupi.']);
            }

            $point = CustomerPoint::create([
                'customer_id' => $customerId,
                'type' => 'redeem',
                'points' => -abs($pointsToRedeem),
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
                'notes' => $notes ?? 'Penukaran poin',
            ]);

            $this->syncBalance($customer);

            return $point;
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

    private function syncBalance(Customer $customer): void
    {
        $customer->update([
            'loyalty_point_balance' => max(0, $this->getBalance($customer->id)),
        ]);
    }
}
