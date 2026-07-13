<?php

use App\Models\CashAccount;
use App\Models\CashMovement;
use App\Models\JournalEntry;
use App\Models\Payable;
use App\Models\StoreLocation;
use App\Models\Supplier;
use App\Models\User;
use Database\Seeders\ChartOfAccountSeeder;
use Database\Seeders\RolePermissionSeeder;

it('mencatat pembayaran hutang ke kas dan jurnal seimbang', function () {
    $this->withoutVite();
    $store = StoreLocation::factory()->create(['is_main' => true]);
    $this->seed([RolePermissionSeeder::class, ChartOfAccountSeeder::class]);
    $owner = User::factory()->create(['store_id' => $store->id]);
    $owner->assignRole('Owner');
    $supplier = Supplier::factory()->create(['store_id' => $store->id]);
    $account = CashAccount::factory()->create(['store_id' => $store->id, 'type' => 'cash']);
    $payable = Payable::query()->create(['supplier_id' => $supplier->id, 'amount' => 100000, 'paid_amount' => 0, 'due_date' => now()->addWeek(), 'status' => 'unpaid']);

    $this->actingAs($owner)->post("/admin/finance/payables/{$payable->id}/payment", [
        'cash_account_id' => $account->id,
        'amount' => 40000,
        'paid_at' => now()->format('Y-m-d H:i:s'),
    ])->assertRedirect();

    $journal = JournalEntry::query()->with('lines')->firstOrFail();
    expect($payable->refresh()->status)->toBe('partial')
        ->and($payable->paid_amount)->toBe('40000.00')
        ->and(CashMovement::query()->where('type', 'out')->sum('amount'))->toEqual(40000)
        ->and((float) $journal->lines->sum('debit'))->toEqual((float) $journal->lines->sum('credit'));
});
