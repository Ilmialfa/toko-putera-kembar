<?php

namespace App\Domain\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Models\ChartOfAccount;
use App\Models\JournalEntryLine;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FinanceReportController extends Controller
{
    public function profitLoss(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->toDateString());

        // We calculate Profit & Loss by taking all Revenue (4xxx) and subtracting Expenses (5xxx, 6xxx)

        $revenueAccounts = ChartOfAccount::where('type', 'revenue')->get();
        $expenseAccounts = ChartOfAccount::whereIn('type', ['expense'])->get(); // HPP and Beban

        // Get balances
        $getAccountBalance = function ($accountId, $normalBalance) use ($startDate, $endDate) {
            $lines = JournalEntryLine::where('chart_of_account_id', $accountId)
                ->whereHas('journalEntry', function ($q) use ($startDate, $endDate) {
                    $q->whereBetween('entry_date', [$startDate, $endDate]);
                })
                ->selectRaw('SUM(debit) as total_debit, SUM(credit) as total_credit')
                ->first();

            $debit = $lines->total_debit ?? 0;
            $credit = $lines->total_credit ?? 0;

            return $normalBalance === 'credit' ? ($credit - $debit) : ($debit - $credit);
        };

        $revenues = [];
        $totalRevenue = 0;
        foreach ($revenueAccounts as $account) {
            $balance = $getAccountBalance($account->id, 'credit'); // Revenue is normal credit
            if ($balance > 0) {
                $revenues[] = ['name' => $account->name, 'amount' => $balance];
                $totalRevenue += $balance;
            }
        }

        $expenses = [];
        $totalExpense = 0;
        foreach ($expenseAccounts as $account) {
            $balance = $getAccountBalance($account->id, 'debit'); // Expense is normal debit
            if ($balance > 0) {
                $expenses[] = ['name' => $account->name, 'amount' => $balance];
                $totalExpense += $balance;
            }
        }

        $netProfit = $totalRevenue - $totalExpense;

        return Inertia::render('admin/finance/reports/ProfitLoss', [
            'startDate' => $startDate,
            'endDate' => $endDate,
            'revenues' => $revenues,
            'expenses' => $expenses,
            'totalRevenue' => $totalRevenue,
            'totalExpense' => $totalExpense,
            'netProfit' => $netProfit,
        ]);
    }
}
