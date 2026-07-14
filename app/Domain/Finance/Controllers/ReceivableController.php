<?php

namespace App\Domain\Finance\Controllers;

use App\Domain\Finance\Services\JournalService;
use App\Http\Controllers\Controller;
use App\Models\CashAccount;
use App\Models\CashMovement;
use App\Models\Customer;
use App\Models\PaymentRecord;
use App\Models\Receivable;
use App\Models\Sale;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ReceivableController extends Controller
{
    public function index(Request $request): Response
    {
        $storeId = (int) $request->user()->store_id;
        $receivables = Receivable::query()
            ->with(['customer', 'sale'])
            ->orderByRaw("CASE status WHEN 'unpaid' THEN 0 WHEN 'partial' THEN 1 ELSE 2 END")
            ->latest('due_date');

        return Inertia::render('admin/finance/receivables/Index', [
            'receivables' => $receivables->paginate(15),
            'cashAccounts' => CashAccount::query()
                ->where('store_id', $storeId)
                ->where('is_active', true)
                ->get(),
            'summary' => [
                'outstanding_total' => (float) (clone $receivables)
                    ->whereIn('status', ['unpaid', 'partial'])
                    ->selectRaw('COALESCE(SUM(amount - paid_amount), 0) AS total')
                    ->value('total'),
                'open_count' => (clone $receivables)
                    ->whereIn('status', ['unpaid', 'partial'])
                    ->count(),
                'overdue_count' => (clone $receivables)
                    ->whereIn('status', ['unpaid', 'partial'])
                    ->whereDate('due_date', '<', today())
                    ->count(),
            ],
        ]);
    }

    public function storePayment(Request $request, Receivable $receivable, JournalService $journalService): RedirectResponse
    {
        $data = $request->validate([
            'amount' => ['required', 'numeric', 'min:1'],
            'cash_account_id' => ['required', 'integer', 'exists:cash_accounts,id'],
        ]);

        $user = $request->user();

        if ($user === null) {
            abort(401);
        }

        DB::transaction(function () use ($data, $journalService, $receivable, $user): void {
            $lockedReceivable = Receivable::query()->lockForUpdate()->findOrFail($receivable->id);
            $amount = (float) $data['amount'];
            $remaining = (float) $lockedReceivable->amount - (float) $lockedReceivable->paid_amount;

            if ($amount > $remaining) {
                abort(422, 'Jumlah cicilan melebihi sisa piutang.');
            }

            $cashAccount = CashAccount::query()
                ->where('store_id', $user->store_id)
                ->where('is_active', true)
                ->findOrFail($data['cash_account_id']);
            $payment = PaymentRecord::query()->create([
                'payable_type' => Receivable::class,
                'payable_id' => $lockedReceivable->id,
                'amount' => $amount,
                'cash_account_id' => $cashAccount->id,
                'paid_at' => now(),
                'created_by' => $user->id,
            ]);

            $newPaidAmount = (float) $lockedReceivable->paid_amount + $amount;
            $lockedReceivable->update([
                'paid_amount' => $newPaidAmount,
                'status' => $newPaidAmount >= (float) $lockedReceivable->amount ? 'paid' : 'partial',
            ]);
            CashMovement::query()->create([
                'cashier_shift_id' => null,
                'cash_account_id' => $cashAccount->id,
                'type' => 'in',
                'amount' => $amount,
                'reason' => 'Pelunasan piutang #'.$lockedReceivable->id,
                'created_by' => $user->id,
            ]);

            $sale = $lockedReceivable->sale_id === null
                ? null
                : Sale::query()->find($lockedReceivable->sale_id);
            $customer = Customer::query()->find($lockedReceivable->customer_id);

            $storeId = $sale instanceof Sale ? (int) $sale->store_id : (int) $user->store_id;
            $customerName = $customer instanceof Customer ? $customer->name : 'pelanggan';

            $journalService->recordEntry(
                $storeId,
                now()->toDateString(),
                'Pelunasan piutang dari '.$customerName,
                PaymentRecord::class,
                (int) $payment->id,
                [
                    ['account_code' => $this->cashAccountCode($cashAccount), 'debit' => $amount, 'credit' => 0],
                    ['account_code' => '1200', 'debit' => 0, 'credit' => $amount],
                ],
            );
        });

        return back()->with('success', 'Pembayaran piutang berhasil dicatat.');
    }

    private function cashAccountCode(CashAccount $cashAccount): string
    {
        return $cashAccount->type === 'cash' ? '1100' : '1110';
    }
}
