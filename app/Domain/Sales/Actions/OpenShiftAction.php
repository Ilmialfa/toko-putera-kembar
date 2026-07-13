<?php

namespace App\Domain\Sales\Actions;

use App\Models\CashierShift;
use Illuminate\Validation\ValidationException;

class OpenShiftAction
{
    /**
     * @throws ValidationException
     */
    public function execute(int $userId, int $storeId, float $openingBalance, ?string $notes = null): CashierShift
    {
        $existingShift = CashierShift::where('user_id', $userId)
            ->where('store_id', $storeId)
            ->where('status', 'open')
            ->first();

        if ($existingShift) {
            throw ValidationException::withMessages([
                'shift' => 'Anda masih memiliki shift aktif. Tutup shift tersebut terlebih dahulu.',
            ]);
        }

        return CashierShift::create([
            'user_id' => $userId,
            'store_id' => $storeId,
            'opening_balance' => $openingBalance,
            'status' => 'open',
            'opening_at' => now(),
            'notes' => $notes,
        ]);
    }
}
