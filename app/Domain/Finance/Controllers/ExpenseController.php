<?php

namespace App\Domain\Finance\Controllers;

use App\Domain\Finance\Services\JournalService;
use App\Http\Controllers\Controller;
use App\Models\CashAccount;
use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public function index()
    {
        $expenses = Expense::with(['expenseCategory', 'cashAccount', 'creator'])
            ->latest('date')
            ->paginate(15);

        $categories = ExpenseCategory::where('is_active', true)->get();
        $cashAccounts = CashAccount::where('is_active', true)->get();

        return Inertia::render('admin/finance/expenses/Index', [
            'expenses' => $expenses,
            'categories' => $categories,
            'cashAccounts' => $cashAccounts,
        ]);
    }

    public function store(Request $request, JournalService $journalService)
    {
        $data = $request->validate([
            'expense_category_id' => 'required|exists:expense_categories,id',
            'cash_account_id' => 'required|exists:cash_accounts,id',
            'amount' => 'required|numeric|min:1',
            'date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        $data['store_location_id'] = $request->user()->store_id; // Default to user's store
        $data['created_by'] = $request->user()->id;

        $expense = Expense::create($data);

        // Auto-generate Journal Entry
        // Debit: Expense Account (we assume category maps to an expense account, but for simplicity let's use 6900 - Beban Lain-lain)
        // Credit: Cash Account (1100)

        $lines = [
            ['account_code' => '6900', 'debit' => $expense->amount, 'credit' => 0], // Beban Lain-lain
            ['account_code' => '1100', 'debit' => 0, 'credit' => $expense->amount], // Kas
        ];

        $journalService->recordEntry(
            $expense->store_location_id,
            $expense->date,
            'Beban: '.($expense->notes ?? 'Pengeluaran Operasional'),
            Expense::class,
            $expense->id,
            $lines
        );

        return redirect()->back()->with('success', 'Pengeluaran berhasil dicatat beserta jurnal otomatis.');
    }
}
