<?php

namespace App\Domain\Finance\Controllers;

use App\Domain\Finance\Services\JournalService;
use App\Http\Controllers\Controller;
use App\Models\CashAccount;
use App\Models\CashMovement;
use App\Models\JournalEntry;
use App\Models\Payable;
use App\Models\PaymentRecord;
use App\Models\Receivable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FinanceOperationController extends Controller
{
    public function index(): Response
    {
        $accounts = CashAccount::query()->where('is_active', true)->get();

        return Inertia::render('admin/finance/operations/Index', [
            'accounts' => $accounts->map(function (CashAccount $account): array {
                $movementBalance = (float) CashMovement::query()->where('cash_account_id', $account->id)
                    ->selectRaw("COALESCE(SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END), 0) AS balance")
                    ->value('balance');

                return [...$account->toArray(), 'calculated_balance' => round((float) $account->current_balance + $movementBalance, 2)];
            }),
            'movements' => CashMovement::query()->with(['cashAccount:id,name', 'creator:id,name'])->latest()->limit(30)->get(),
            'payables' => Payable::query()->with(['supplier:id,name', 'payments.cashAccount:id,name'])->latest()->limit(30)->get(),
            'receivables' => Receivable::query()->with('customer:id,name')->latest()->limit(30)->get(),
            'journals' => JournalEntry::query()->with('lines.chartOfAccount:id,code,name')->latest('id')->limit(20)->get(),
        ]);
    }

    public function storeMovement(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'cash_account_id' => ['required', 'exists:cash_accounts,id'],
            'type' => ['required', Rule::in(['in', 'out'])],
            'amount' => ['required', 'numeric', 'gt:0'],
            'reason' => ['required', 'string', 'max:255'],
        ]);
        CashMovement::query()->create([...$data, 'cashier_shift_id' => null, 'created_by' => $request->user()->id]);

        return back()->with('success', 'Mutasi kas/bank berhasil dicatat.');
    }

    public function payPayable(Request $request, Payable $payable, JournalService $journalService): RedirectResponse
    {
        $data = $request->validate([
            'cash_account_id' => ['required', 'exists:cash_accounts,id'],
            'amount' => ['required', 'numeric', 'gt:0'],
            'paid_at' => ['required', 'date'],
        ]);
        $remaining = round((float) $payable->amount - (float) $payable->paid_amount, 2);
        if ((float) $data['amount'] > $remaining) {
            throw ValidationException::withMessages(['amount' => 'Pembayaran melebihi sisa hutang.']);
        }

        DB::transaction(function () use ($data, $payable, $request, $journalService): void {
            $payment = PaymentRecord::query()->create([
                'payable_type' => Payable::class, 'payable_id' => $payable->id,
                'amount' => $data['amount'], 'cash_account_id' => $data['cash_account_id'],
                'paid_at' => $data['paid_at'], 'created_by' => $request->user()->id,
            ]);
            CashMovement::query()->create([
                'cashier_shift_id' => null, 'cash_account_id' => $data['cash_account_id'], 'type' => 'out',
                'amount' => $data['amount'], 'reason' => "Pembayaran hutang #{$payable->id}", 'created_by' => $request->user()->id,
            ]);
            $paid = round((float) $payable->paid_amount + (float) $data['amount'], 2);
            $payable->update(['paid_amount' => $paid, 'status' => $paid >= (float) $payable->amount ? 'paid' : 'partial']);
            $account = CashAccount::query()->findOrFail($data['cash_account_id']);
            $journalService->recordEntry(
                (int) $request->user()->store_id, date('Y-m-d', strtotime($data['paid_at'])), "Pembayaran hutang #{$payable->id}", PaymentRecord::class, $payment->id,
                [['account_code' => '2100', 'debit' => $data['amount'], 'credit' => 0], ['account_code' => $account->type === 'cash' ? '1100' : '1110', 'debit' => 0, 'credit' => $data['amount']]],
            );
        });

        return back()->with('success', 'Pembayaran hutang dan jurnal berhasil dicatat.');
    }
}
