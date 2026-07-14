<?php

use App\Models\BlogPost;
use App\Models\User;
use Database\Seeders\RolePermissionSeeder;

beforeEach(function () {
    $this->withoutVite();
    $this->seed(RolePermissionSeeder::class);
    $this->owner = User::factory()->create();
    $this->owner->assignRole('Owner');
});

it('allows an owner to publish a full storefront article with an automatic url', function () {
    $this->actingAs($this->owner)->post('/admin/cms/blogs', [
        'title' => 'Cara Hemat Belanja Stok Warung',
        'slug' => '',
        'excerpt' => 'Panduan singkat menata pembelian stok mingguan.',
        'content' => '<h2>Belanja lebih terukur</h2><p>Pilih satuan sesuai kebutuhan agar stok tetap sehat.</p>',
        'status' => 'published',
        'published_at' => null,
    ])->assertRedirect('/admin/cms/blogs');

    $post = BlogPost::query()->firstOrFail();

    expect($post->slug)->toBe('cara-hemat-belanja-stok-warung')
        ->and($post->author_id)->toBe($this->owner->id)
        ->and($post->published_at)->not->toBeNull();

    $this->get("/blog/{$post->slug}")
        ->assertOk()
        ->assertSee('Cara Hemat Belanja Stok Warung')
        ->assertSee('Pilih satuan sesuai kebutuhan');
});

it('does not show draft articles to storefront visitors', function () {
    $post = BlogPost::query()->create([
        'title' => 'Catatan Internal',
        'slug' => 'catatan-internal',
        'excerpt' => 'Tidak untuk pelanggan.',
        'content' => '<p>Draft.</p>',
        'status' => 'draft',
        'author_id' => $this->owner->id,
    ]);

    $this->get("/blog/{$post->slug}")->assertNotFound();
});
