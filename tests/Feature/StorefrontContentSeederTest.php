<?php

use App\Models\BlogPost;
use App\Models\User;
use Database\Seeders\StorefrontContentSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('seeds three published storefront articles with cover images', function () {
    User::factory()->create();

    $this->seed(StorefrontContentSeeder::class);

    expect(BlogPost::query()->where('status', 'published')->count())->toBe(3)
        ->and(BlogPost::query()->where('slug', 'cara-menata-stok-warung')->value('cover_image_path'))
        ->toBe('blog/rak-warung.png');
});
