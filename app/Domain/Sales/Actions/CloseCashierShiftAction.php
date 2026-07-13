<?php

namespace App\Domain\Sales\Actions;

use App\Models\CashierShift;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class CloseCashierShiftAction
{
    /**
     * @throws ValidationException
     */
    public function execute(CashierShift $shift, float $actualBalance, ?string $notes = null): CashierShift
    {
        if ($shift->status !== 'open') {
            throw ValidationException::withMessages([
                'shift' => 'Shift ini sudah ditutup.',
            ]);
        }

        // Calculate expected balance
        $openingBalance = (float) $shift->opening_balance;

        // Cash movements (in/out)
        $cashIn = DB::table('cash_movements')
            ->where('cashier_shift_id', $shift->id)
            ->where('type', 'in')
            ->sum('amount');

        $cashOut = DB::table('cash_movements')
            ->where('cashier_shift_id', $shift->id)
            ->where('type', 'out')
            ->sum('amount');

        // Cash sales
        // Note: we will query from sale_payments where method = 'cash' linked to sales in this shift
        $cashSales = DB::table('sale_payments')
            ->join('sales', 'sales.id', '=', 'sale_payments.sale_id')
            ->where('sales.cashier_shift_id', $shift->id)
            ->where('sales.status', 'completed')
            ->where('sale_payments.method', 'cash')
            ->sum('sale_payments.amount');

        // Cash refunds (from sale_returns) - simplify for now
        $cashRefunds = 0; // TODO: implement when sale_returns are fully modeled if refunds hit cash drawer

        $expectedBalance = $openingBalance + $cashIn - $cashOut + $cashSales - $cashRefunds;

        $selisih = $actualBalance - $expectedBalance;

        $shift->update([
            'closing_balance_system' => $expectedBalance,
            'closing_balance_actual' => $actualBalance,
            'selisih_kas' => $selisih,
            'status' => 'closed',
            'closing_at' => now(),
            'notes' => $notes,
        ]);

        if (abs($selisih) > 0) {
            // Log discrepancy for auditing best practice
            Log::warning("Cashier Shift {$shift->id} closed with discrepancy.", [
                'user_id' => $shift->user_id,
                'expected' => $expectedBalance,
                'actual' => $actualBalance,
                'selisih' => $selisih,
                'notes' => $notes,
            ]);
        }

        return $shift;
    }
}
