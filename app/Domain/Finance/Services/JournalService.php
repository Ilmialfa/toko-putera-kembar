<?php

namespace App\Domain\Finance\Services;

use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\Sale;
use App\Models\SaleItem;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class JournalService
{
    /**
     * @param  array<int, array{account_code: string, debit: float|int|string, credit: float|int|string}>  $lines
     */
    public function recordEntry(
        int $storeLocationId,
        string $date,
        string $description,
        string $referenceType,
        int $referenceId,
        array $lines,
    ): JournalEntry {
        $totalDebit = collect($lines)->sum(fn (array $line): float => (float) $line['debit']);
        $totalCredit = collect($lines)->sum(fn (array $line): float => (float) $line['credit']);

        if (abs($totalDebit - $totalCredit) > 0.01) {
            throw ValidationException::withMessages([
                'journal' => "Jurnal tidak seimbang. Debit: {$totalDebit}, kredit: {$totalCredit}.",
            ]);
        }

        return DB::transaction(function () use ($storeLocationId, $date, $description, $referenceType, $referenceId, $lines): JournalEntry {
            $accountCodes = collect($lines)->pluck('account_code')->unique()->values();

            /** @var Collection<string, ChartOfAccount> $accounts */
            $accounts = ChartOfAccount::query()
                ->whereIn('code', $accountCodes)
                ->get()
                ->keyBy('code');

            $missingCode = $accountCodes->first(fn (string $code): bool => ! $accounts->has($code));

            if ($missingCode !== null) {
                throw ValidationException::withMessages([
                    'journal' => "Kode akun {$missingCode} tidak ditemukan.",
                ]);
            }

            $entry = JournalEntry::query()->create([
                'store_location_id' => $storeLocationId,
                'entry_date' => $date,
                'description' => $description,
                'reference_type' => $referenceType,
                'reference_id' => $referenceId,
            ]);

            foreach ($lines as $line) {
                $entry->lines()->create([
                    'chart_of_account_id' => $accounts->get($line['account_code'])->id,
                    'debit' => $line['debit'],
                    'credit' => $line['credit'],
                ]);
            }

            return $entry->load('lines.chartOfAccount');
        });
    }

    public function recordSale(Sale $sale): JournalEntry
    {
        $existingEntry = JournalEntry::query()
            ->where('reference_type', Sale::class)
            ->where('reference_id', $sale->id)
            ->first();

        if ($existingEntry !== null) {
            return $existingEntry->load('lines.chartOfAccount');
        }

        $sale->loadMissing(['items', 'payments']);

        $total = (float) $sale->total_amount;
        $cashPaid = (float) $sale->payments->where('method', 'cash')->sum('amount');
        $bankPaid = (float) $sale->payments->where('method', '!=', 'cash')->sum('amount');
        $receivable = max(0, $total - $cashPaid - $bankPaid);

        /** @var array<int, array{account_code: string, debit: float, credit: float}> $lines */
        $lines = [];

        if ($cashPaid > 0) {
            $lines[] = ['account_code' => '1100', 'debit' => $cashPaid, 'credit' => 0.0];
        }

        if ($bankPaid > 0) {
            $lines[] = ['account_code' => '1110', 'debit' => $bankPaid, 'credit' => 0.0];
        }

        if ($receivable > 0) {
            $lines[] = ['account_code' => '1200', 'debit' => $receivable, 'credit' => 0.0];
        }

        $lines[] = ['account_code' => '4100', 'debit' => 0.0, 'credit' => $total];

        $totalCost = (float) SaleItem::query()->where('sale_id', $sale->id)->get()->sum(
            fn (SaleItem $item): float => (float) $item->hpp_at_time * (float) $item->qty,
        );

        if ($totalCost > 0) {
            $lines[] = ['account_code' => '5100', 'debit' => $totalCost, 'credit' => 0.0];
            $lines[] = ['account_code' => '1300', 'debit' => 0.0, 'credit' => $totalCost];
        }

        return $this->recordEntry(
            (int) $sale->store_id,
            $sale->created_at?->toDateString() ?? now()->toDateString(),
            "Penjualan #{$sale->sale_number}",
            Sale::class,
            (int) $sale->id,
            $lines,
        );
    }
}
