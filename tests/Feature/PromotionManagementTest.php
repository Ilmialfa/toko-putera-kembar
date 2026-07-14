<?php

use App\Models\Promotion;
use App\Models\StoreLocation;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

beforeEach(function () {
    $this->withoutVite();
    $this->store = StoreLocation::factory()->create(['is_main' => true]);
    $this->seed(RolePermissionSeeder::class);
    $this->owner = User::factory()->create(['store_id' => $this->store->id]);
    $this->owner->assignRole('Owner');
});

it('membuat campaign voucher lengkap', function () {
    Storage::fake('public');

    $this->actingAs($this->owner)->post('/admin/promotions', [
        'store_id' => $this->store->id,
        'name' => 'Hemat Awal Bulan',
        'description' => 'Voucher member toko.',
        'storefront_visible' => true,
        'storefront_title' => 'Hemat stok warung',
        'storefront_summary' => 'Potongan untuk belanja awal bulan.',
        'storefront_badge' => 'Promo member',
        'storefront_image' => UploadedFile::fake()->image('hemat-awal-bulan.jpg'),
        'type' => 'voucher',
        'status' => 'active',
        'start_date' => now()->subHour()->format('Y-m-d H:i:s'),
        'end_date' => now()->addWeek()->format('Y-m-d H:i:s'),
        'channel' => 'both',
        'customer_group_id' => null,
        'is_stackable' => false,
        'exclusive_group' => 'bulanan',
        'priority' => 20,
        'usage_limit_total' => 100,
        'usage_limit_per_customer' => 1,
        'min_purchase_amount' => 50000,
        'max_discount_amount' => 10000,
        'applicable_scope' => 'all',
        'conditions' => [],
        'rewards' => [['reward_type' => 'fixed_discount', 'value' => 10000, 'free_product_id' => null, 'free_product_qty' => null]],
        'vouchers' => [['code' => 'HEMAT10', 'max_uses' => 100, 'expires_at' => now()->addWeek()->format('Y-m-d H:i:s')]],
        'voucher_quantity' => null,
        'voucher_prefix' => 'PK',
    ])->assertRedirect('/admin/promotions');

    $promotion = Promotion::query()->with('vouchers')->firstOrFail();
    expect($promotion->status)->toBe('active')
        ->and($promotion->storefront_visible)->toBeTrue()
        ->and($promotion->storefront_title)->toBe('Hemat stok warung')
        ->and($promotion->vouchers)->toHaveCount(1)
        ->and($promotion->vouchers->first()->code)->toBe('HEMAT10');

    Storage::disk('public')->assertExists($promotion->storefront_image_path);
});

it('menyalin campaign sebagai draft tanpa voucher', function () {
    $promotion = Promotion::query()->create([
        'store_id' => $this->store->id,
        'name' => 'Promo Asli',
        'type' => 'discount_item',
        'status' => 'active',
        'start_date' => now(),
        'end_date' => now()->addDay(),
        'channel' => 'both',
        'is_active' => true,
        'applicable_scope' => 'all',
    ]);
    $promotion->rewards()->create(['reward_type' => 'percent_discount', 'value' => 10]);

    $this->actingAs($this->owner)->post("/admin/promotions/{$promotion->id}/duplicate")->assertRedirect();

    expect(Promotion::query()->where('name', 'Promo Asli (Salinan)')->where('status', 'draft')->exists())->toBeTrue();
});
