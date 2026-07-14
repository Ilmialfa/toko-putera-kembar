<?php

namespace Database\Seeders;

use App\Models\BlogPost;
use App\Models\User;
use Illuminate\Database\Seeder;

class StorefrontContentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $authorId = User::query()->orderBy('id')->value('id');

        if ($authorId === null) {
            return;
        }

        foreach ([
            [
                'slug' => 'belanja-bulanan-lebih-terencana',
                'title' => 'Belanja Bulanan Lebih Terencana untuk Rumah dan Warung',
                'excerpt' => 'Tiga langkah sederhana untuk menyusun daftar kebutuhan, mengatur satuan pembelian, dan menghindari belanja berulang.',
                'content' => "Belanja kebutuhan harian akan terasa lebih ringan jika dimulai dari daftar yang jelas. Pisahkan kebutuhan dapur, minuman, kebersihan, dan stok usaha agar tidak ada barang penting yang terlewat.\n\nPilih satuan sesuai pemakaian. Untuk kebutuhan kecil, pembelian per pcs atau per ons membantu pengeluaran tetap terukur. Jika kebutuhan rutin dan jumlahnya banyak, bandingkan harga per renteng, lusin, atau dus untuk memperoleh harga yang lebih efisien.\n\nSebelum checkout, cek kembali stok di rumah atau warung. Catat barang yang hampir habis, tentukan jumlah yang diperlukan untuk satu sampai dua minggu, lalu gunakan katalog untuk melihat harga terbaru. Dengan cara ini, belanja tetap hemat tanpa mengorbankan kebutuhan penting.",
                'cover_image_path' => 'blog/pantry-belanja.png',
                'published_at' => now()->subDays(2),
            ],
            [
                'slug' => 'cara-menata-stok-warung',
                'title' => 'Cara Menata Stok Warung agar Mudah Dicari dan Cepat Terjual',
                'excerpt' => 'Susun stok dengan kelompok sederhana agar pelanggan lebih mudah memilih dan Anda lebih cepat mengetahui barang yang perlu dibeli kembali.',
                'content' => "Warung yang rapi membantu pelanggan menemukan barang dengan cepat. Mulailah dari kelompok yang paling sering dicari: minuman, makanan ringan, sembako, dan kebutuhan kebersihan. Letakkan produk yang cepat bergerak di area yang mudah dijangkau.\n\nGunakan prinsip barang lama keluar lebih dahulu. Saat stok baru datang, tempatkan di belakang barang yang lebih dulu ada. Cara sederhana ini membantu menjaga kualitas produk dan mengurangi risiko barang tertinggal terlalu lama.\n\nCatat produk yang mulai menipis setiap hari. Daftar kecil ini memudahkan Anda menyiapkan belanja ulang dan menentukan apakah lebih hemat membeli satuan, renteng, atau dus. Stok yang tertata membuat pelayanan lebih cepat dan keputusan belanja lebih tepat.",
                'cover_image_path' => 'blog/rak-warung.png',
                'published_at' => now()->subDays(4),
            ],
            [
                'slug' => 'pilih-satuan-belanja-yang-tepat',
                'title' => 'Pilih Satuan Belanja yang Tepat untuk Kebutuhan Keluarga',
                'excerpt' => 'Pahami kapan sebaiknya membeli per pcs, per kilogram, per renteng, atau per dus agar pengeluaran dan stok rumah tetap seimbang.',
                'content' => "Setiap keluarga memiliki pola belanja yang berbeda. Barang yang jarang dipakai lebih aman dibeli dalam satuan kecil, sedangkan kebutuhan rutin seperti beras, minuman, atau mi instan dapat dipertimbangkan dalam jumlah lebih besar bila ruang penyimpanan mencukupi.\n\nHarga per satuan tidak selalu sama dengan harga paket. Perhatikan tabel pilihan satuan pada produk untuk membandingkan harga per pcs, per renteng, hingga per dus. Sistem akan menghitung harga sesuai pilihan dan jumlah yang dimasukkan ke keranjang.\n\nBelanjalah secukupnya dan sesuaikan dengan kemampuan penyimpanan. Dengan memilih satuan yang tepat, kebutuhan keluarga tetap tersedia, makanan tidak terbuang, dan anggaran belanja lebih terjaga.",
                'cover_image_path' => 'blog/menu-keluarga.png',
                'published_at' => now()->subDays(6),
            ],
        ] as $article) {
            BlogPost::query()->updateOrCreate(
                ['slug' => $article['slug']],
                [...$article, 'author_id' => $authorId, 'status' => 'published'],
            );
        }
    }
}
