<?php

namespace App\Domain\Finance\Controllers;

use App\Domain\Finance\Services\JournalService;
use App\Http\Controllers\Controller;
use App\Models\CashAccount;
use App\Models\CashMovement;
use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\Payable;
use App\Models\PaymentRecord;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class FinanceOperationController extends Controller
{
    public function index(Request $request): Response
    {
        $storeId = (int) $request->user()->store_id;
        $accounts = CashAccount::query()
            ->where('store_id', $storeId)
            ->where('is_active', true)
            ->get();
        $accountIds = $accounts->pluck('id');

        return Inertia::render('admin/finance/operations/Index', [
            'accounts' => $accounts->map(function (CashAccount $account): array {
                $movementBalance = (float) CashMovement::query()->where('cash_account_id', $account->id)
                    ->selectRaw("COALESCE(SUM(CASE WHEN type = 'in' THEN amount ELSE -amount END), 0) AS balance")
                    ->value('balance');

                return [...$account->toArray(), 'calculated_balance' => round($movementBalance, 2)];
            }),
            'movements' => CashMovement::query()
                ->whereIn('cash_account_id', $accountIds)
                ->with(['cashAccount:id,name', 'creator:id,name'])
                ->latest()
                ->limit(30)
                ->get(),
            'payables' => Payable::query()
                ->whereHas('supplier', fn ($query) => $query->where('store_id', $storeId))
                ->with(['supplier:id,name', 'payments.cashAccount:id,name'])
                ->whereIn('status', ['unpaid', 'partial'])
                ->orderBy('due_date')
                ->limit(30)
                ->get(),
            'journals' => JournalEntry::query()
                ->where('store_location_id', $storeId)
                ->with('lines.chartOfAccount:id,code,name')
                ->latest('id')
                ->limit(10)
                ->get(),
            'counterAccounts' => ChartOfAccount::query()
                ->whereNotIn('code', ['1100', '1110'])
                ->orderBy('code')
                ->get(['id', 'code', 'name'])
                ->map(fn (ChartOfAccount $account): array => [
                    'id' => $account->id,
                    'name' => "{$account->code} - {$account->name}",
                ]),
        ]);
    }

    public function storeMovement(Request $request, JournalService $journalService): RedirectResponse
    {
        $data = $request->validate([
            'cash_account_id' => ['required', 'exists:cash_accounts,id'],
            'counter_account_id' => ['required', 'exists:chart_of_accounts,id'],
            'type' => ['required', Rule::in(['in', 'out'])],
            'amount' => ['required', 'numeric', 'gt:0'],
            'reason' => ['required', 'string', 'max:255'],
        ]);
        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        $cashAccount = CashAccount::query()
            ->where('store_id', $user->store_id)
            ->where('is_active', true)
            ->findOrFail($data['cash_account_id']);
        $counterAccount = ChartOfAccount::query()->findOrFail($data['counter_account_id']);

        DB::transaction(function () use ($cashAccount, $counterAccount, $data, $journalService, $user): void {
            $movement = CashMovement::query()->create([
                'cashier_shift_id' => null,
                'cash_account_id' => $cashAccount->id,
                'type' => $data['type'],
                'amount' => $data['amount'],
                'reason' => $data['reason'],
                'created_by' => $user->id,
            ]);
            $cashAccountCode = $this->cashAccountCode($cashAccount);
            $isMoneyIn = $data['type'] === 'in';

            $journalService->recordEntry(
                (int) $user->store_id,
                now()->toDateString(),
                'Mutasi: '.$data['reason'],
                CashMovement::class,
                (int) $movement->id,
                [
                    ['account_code' => $isMoneyIn ? $cashAccountCode : $counterAccount->code, 'debit' => $data['amount'], 'credit' => 0],
                    ['account_code' => $isMoneyIn ? $counterAccount->code : $cashAccountCode, 'debit' => 0, 'credit' => $data['amount']],
                ],
            );
        });

        return back()->with('success', 'Mutasi kas/bank dan jurnal berhasil dicatat.');
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

        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        DB::transaction(function () use ($data, $payable, $journalService, $user): void {
            $lockedPayable = Payable::query()->with('supplier')->lockForUpdate()->findOrFail($payable->id);
            abort_unless((int) $lockedPayable->supplier->store_id === (int) $user->store_id, 404);
            $remaining = round((float) $lockedPayable->amount - (float) $lockedPayable->paid_amount, 2);
            if ((float) $data['amount'] > $remaining) {
                throw ValidationException::withMessages(['amount' => 'Pembayaran melebihi sisa hutang.']);
            }
            $cashAccount = CashAccount::query()
                ->where('store_id', $user->store_id)
                ->where('is_active', true)
                ->findOrFail($data['cash_account_id']);
            $payment = PaymentRecord::query()->create([
                'payable_type' => Payable::class, 'payable_id' => $lockedPayable->id,
                'amount' => $data['amount'], 'cash_account_id' => $data['cash_account_id'],
                'paid_at' => $data['paid_at'], 'created_by' => $user->id,
            ]);
            CashMovement::query()->create([
                'cashier_shift_id' => null, 'cash_account_id' => $data['cash_account_id'], 'type' => 'out',
                'amount' => $data['amount'], 'reason' => "Pembayaran hutang #{$lockedPayable->id}", 'created_by' => $user->id,
            ]);
            $paid = round((float) $lockedPayable->paid_amount + (float) $data['amount'], 2);
            $lockedPayable->update(['paid_amount' => $paid, 'status' => $paid >= (float) $lockedPayable->amount ? 'paid' : 'partial']);
            $journalService->recordEntry(
                (int) $user->store_id, date('Y-m-d', strtotime($data['paid_at'])), "Pembayaran hutang #{$lockedPayable->id}", PaymentRecord::class, $payment->id,
                [['account_code' => '2100', 'debit' => $data['amount'], 'credit' => 0], ['account_code' => $this->cashAccountCode($cashAccount), 'debit' => 0, 'credit' => $data['amount']]],
            );
        });

        return back()->with('success', 'Pembayaran hutang dan jurnal berhasil dicatat.');
    }

    private function cashAccountCode(CashAccount $cashAccount): string
    {
        return $cashAccount->type === 'cash' ? '1100' : '1110';
    }
}
