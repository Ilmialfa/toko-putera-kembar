<?php

namespace App\Domain\Sales\Actions;

use App\Models\CashierShift;
use Carbon\Carbon;
use Illuminate\Validation\ValidationException;

class OpenShiftAction
{
    /**
     * @throws ValidationException
     */
    public function execute(int $userId, int $storeId, float $openingBalance, ?string $notes = null): CashierShift
    {
        // Check if there is already an open shift for this user
        $existingShift = CashierShift::where('user_id', $userId)
            ->where('store_id', $storeId)
            ->where('status', 'open')
            ->first();

        if ($existingShift) {
            throw ValidationException::withMessages([
                'shift' => 'You already have an open shift. Please close it first.',
            ]);
        }

        return CashierShift::create([
            'user_id' => $userId,
            'store_id' => $storeId,
            'opening_balance' => $openingBalance,
            'status' => 'open',
            'opening_at' => Carbon::now(),
            'notes' => $notes,
        ]);
    }
}
