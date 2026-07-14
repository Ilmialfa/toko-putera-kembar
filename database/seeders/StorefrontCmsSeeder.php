<?php

namespace Database\Seeders;

use App\Models\CmsPage;
use Illuminate\Database\Seeder;

class StorefrontCmsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $home = CmsPage::query()->firstOrCreate(
            ['slug' => 'home'],
            ['title' => 'Beranda storefront', 'is_active' => true, 'updated_by' => 1],
        );

        $home->sections()->updateOrCreate(
            ['section_type' => 'hero_banner'],
            [
                'content_json' => [
                    'title' => 'Stok warung lengkap. Harga selalu jelas.',
                    'subtitle' => 'Belanja kebutuhan harian per ons, pcs, renteng, sampai dus dengan harga yang transparan.',
                    'cta_label' => 'Lihat semua produk',
                    'cta_url' => '/katalog',
                ],
                'display_order' => 1,
                'is_active' => true,
            ],
        );

        $home->sections()->updateOrCreate(
            ['section_type' => 'information_banner'],
            [
                'content_json' => [
                    'title' => 'Gratis antar hingga 3 km untuk belanja yang lebih praktis.',
                    'subtitle' => 'Aktifkan lokasi untuk mengecek jangkauan. Pesanan minimal Rp150.000 yang tercakup radius dapat menikmati gratis ongkir.',
                    'cta_label' => 'Lihat informasi',
                    'cta_url' => '/promo',
                ],
                'display_order' => 2,
                'is_active' => true,
            ],
        );

        $about = CmsPage::query()->firstOrCreate(
            ['slug' => 'about'],
            ['title' => 'Tentang Toko Putera Kembar', 'is_active' => true, 'updated_by' => 1],
        );

        $about->sections()->updateOrCreate(
            ['section_type' => 'text_block'],
            [
                'content_json' => [
                    'content' => "Toko Putera Kembar hadir untuk memudahkan warga memperoleh kebutuhan sehari-hari dengan harga yang jelas dan pelayanan yang hangat.\n\nKami terus membangun pengalaman belanja yang lebih praktis, mulai dari toko hingga pesanan online di sekitar Pekanbaru.",
                ],
                'display_order' => 1,
                'is_active' => true,
            ],
        );
    }
}
