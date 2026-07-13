<?php

use App\Domain\Finance\Services\JournalService;
use App\Models\ChartOfAccount;
use App\Models\JournalEntry;
use App\Models\StoreLocation;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->journalService = new JournalService;
    $this->store = StoreLocation::factory()->create();

    // Seed test accounts
    ChartOfAccount::create(['code' => '1100', 'name' => 'Kas', 'type' => 'asset']);
    ChartOfAccount::create(['code' => '4100', 'name' => 'Pendapatan', 'type' => 'revenue']);
});

test('it can record a balanced journal entry', function () {
    $lines = [
        ['account_code' => '1100', 'debit' => 150000, 'credit' => 0],
        ['account_code' => '4100', 'debit' => 0, 'credit' => 150000],
    ];

    $entry = $this->journalService->recordEntry(
        $this->store->id,
        now()->toDateString(),
        'Penjualan Test',
        'App\Models\Sale',
        1,
        $lines
    );

    expect($entry)->toBeInstanceOf(JournalEntry::class);
    expect($entry->lines)->toHaveCount(2);

    $totalDebit = $entry->lines->sum('debit');
    $totalCredit = $entry->lines->sum('credit');

    expect($totalDebit)->toEqual(150000);
    expect($totalCredit)->toEqual(150000);
});

test('it throws exception if journal is unbalanced', function () {
    $lines = [
        ['account_code' => '1100', 'debit' => 150000, 'credit' => 0],
        ['account_code' => '4100', 'debit' => 0, 'credit' => 100000],
    ];

    expect(fn () => $this->journalService->recordEntry(
        $this->store->id,
        now()->toDateString(),
        'Unbalanced Test',
        'App\Models\Sale',
        1,
        $lines
    ))->toThrow(Exception::class, 'Jurnal tidak seimbang');
});
