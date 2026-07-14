<?php

namespace App\Domain\Finance\Controllers;

use App\Domain\Finance\Services\JournalService;
use App\Http\Controllers\Controller;
use App\Models\CashAccount;
use App\Models\CashMovement;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(Request $request): Response
    {
        $storeId = (int) $request->user()->store_id;
        $expenses = Expense::query()
            ->where('store_location_id', $storeId)
            ->with(['expenseCategory', 'cashAccount', 'creator'])
            ->latest('date')
            ->paginate(15);

        $categories = ExpenseCategory::where('is_active', true)->get();
        $cashAccounts = CashAccount::query()
            ->where('store_id', $storeId)
            ->where('is_active', true)
            ->get();

        return Inertia::render('admin/finance/expenses/Index', [
            'expenses' => $expenses,
            'categories' => $categories,
            'cashAccounts' => $cashAccounts,
            'summary' => [
                'this_month_total' => (float) Expense::query()
                    ->where('store_location_id', $storeId)
                    ->whereBetween('date', [now()->startOfMonth(), now()->endOfMonth()])
                    ->sum('amount'),
                'this_month_count' => Expense::query()
                    ->where('store_location_id', $storeId)
                    ->whereBetween('date', [now()->startOfMonth(), now()->endOfMonth()])
                    ->count(),
            ],
        ]);
    }

    public function store(Request $request, JournalService $journalService): RedirectResponse
    {
        $data = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'cash_account_id' => 'required|exists:cash_accounts,id',
            'amount' => 'required|numeric|min:1',
            'date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        $cashAccount = CashAccount::query()
            ->where('store_id', $user->store_id)
            ->where('is_active', true)
            ->findOrFail($data['cash_account_id']);

        DB::transaction(function () use ($cashAccount, $data, $journalService, $user): void {
            $expense = Expense::query()->create([
                ...$data,
                'store_location_id' => $user->store_id,
                'created_by' => $user->id,
            ]);
            $category = ExpenseCategory::query()->findOrFail($expense->expense_category_id);

            CashMovement::query()->create([
                'cashier_shift_id' => null,
                'cash_account_id' => $cashAccount->id,
                'type' => 'out',
                'amount' => $expense->amount,
                'reason' => 'Pengeluaran: '.($expense->notes ?? $category->name),
                'created_by' => $user->id,
            ]);

            $journalService->recordEntry(
                (int) $expense->store_location_id,
                (string) $expense->getRawOriginal('date'),
                'Beban: '.($expense->notes ?? $category->name),
                Expense::class,
                (int) $expense->id,
                [
                    ['account_code' => $this->expenseAccountCode($category), 'debit' => $expense->amount, 'credit' => 0],
                    ['account_code' => $this->cashAccountCode($cashAccount), 'debit' => 0, 'credit' => $expense->amount],
                ],
            );
        });

        return redirect()->back()->with('success', 'Pengeluaran berhasil dicatat beserta jurnal otomatis.');
    }

    private function cashAccountCode(CashAccount $cashAccount): string
    {
        return $cashAccount->type === 'cash' ? '1100' : '1110';
    }

    private function expenseAccountCode(ExpenseCategory $category): string
    {
        $name = mb_strtolower($category->name);

        return match (true) {
            str_contains($name, 'gaji') => '6100',
            str_contains($name, 'sewa') => '6200',
            str_contains($name, 'listrik'), str_contains($name, 'air'), str_contains($name, 'telepon') => '6300',
            str_contains($name, 'transport') => '6400',
            default => '6900',
        };
    }
}
