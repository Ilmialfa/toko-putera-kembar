<?php

use App\Models\CashAccount;
use App\Models\CashMovement;
use App\Models\Customer;
use App\Models\ExpenseCategory;
use App\Models\JournalEntry;
use App\Models\Receivable;
use App\Models\StoreLocation;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->withoutVite();
    $this->seed([RolePermissionSeeder::class, ChartOfAccountSeeder::class]);
    $this->store = StoreLocation::factory()->create(['is_main' => true]);
    $this->owner = User::factory()->create(['store_id' => $this->store->id]);
    $this->owner->assignRole('Owner');
    $this->cashAccount = CashAccount::query()->create([
        'store_id' => $this->store->id,
        'name' => 'Kas Toko',
        'type' => 'cash',
        'is_active' => true,
    ]);
});

it('records an expense as a cash outflow and a balanced journal', function () {
    $category = ExpenseCategory::query()->create(['name' => 'Listrik']);

    $this->actingAs($this->owner)->post('/admin/finance/expenses', [
        'expense_category_id' => $category->id,
        'cash_account_id' => $this->cashAccount->id,
        'amount' => 125_000,
        'date' => now()->toDateString(),
        'notes' => 'Token listrik toko',
    ])->assertRedirect();

    $journal = JournalEntry::query()->with('lines.chartOfAccount')->firstOrFail();

    expect(CashMovement::query()->where('type', 'out')->sum('amount'))->toEqual(125_000.0)
        ->and($journal->lines->pluck('chartOfAccount.code')->all())->toContain('6300', '1100')
        ->and((float) $journal->lines->sum('debit'))->toEqual((float) $journal->lines->sum('credit'));
});

it('records a receivable settlement as a cash inflow and a balanced journal', function () {
    $customer = Customer::query()->create([
        'name' => 'Pelanggan Tempo',
        'phone' => '081234567890',
    ]);
    $receivable = Receivable::query()->create([
        'customer_id' => $customer->id,
        'amount' => 200_000,
        'paid_amount' => 0,
        'due_date' => now()->addWeek()->toDateString(),
        'status' => 'unpaid',
    ]);

    $this->actingAs($this->owner)->post(
        "/admin/finance/receivables/{$receivable->id}/payment",
        ['amount' => 75_000, 'cash_account_id' => $this->cashAccount->id],
    )->assertRedirect();

    $journal = JournalEntry::query()->with('lines.chartOfAccount')->firstOrFail();

    expect($receivable->refresh()->paid_amount)->toBe('75000.00')
        ->and($receivable->status)->toBe('partial')
        ->and(CashMovement::query()->where('type', 'in')->sum('amount'))->toEqual(75_000.0)
        ->and($journal->lines->pluck('chartOfAccount.code')->all())->toContain('1100', '1200')
        ->and((float) $journal->lines->sum('debit'))->toEqual((float) $journal->lines->sum('credit'));
});
