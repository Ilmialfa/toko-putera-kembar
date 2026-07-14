<?php

use App\Models\Category;
use App\Models\StoreLocation;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed(RolePermissionSeeder::class);

    $store = StoreLocation::factory()->create();
    $owner = User::factory()->create(['store_id' => $store->id]);
    $owner->assignRole('Owner');

    $this->actingAs($owner);
});

it('stores a category icon and optional category image', function () {
    Storage::fake('public');

    $this->post('/admin/master/categories', [
        'name' => 'Kebutuhan Bayi',
        'icon' => 'baby',
        'image' => UploadedFile::fake()->image('kategori-bayi.png'),
        'display_order' => 12,
        'is_active' => true,
    ])->assertRedirect();

    $this->assertDatabaseHas('categories', [
        'name' => 'Kebutuhan Bayi',
        'icon' => 'baby',
        'display_order' => 12,
    ]);

    $imagePath = (string) Category::query()
        ->where('name', 'Kebutuhan Bayi')
        ->value('image_path');

    expect($imagePath)->toStartWith('categories/');
    Storage::disk('public')->assertExists($imagePath);
});
