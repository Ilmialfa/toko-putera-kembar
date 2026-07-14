<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductBarcode;
use App\Models\ProductPrice;
use App\Models\ProductSupplier;
use App\Models\ProductUnit;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;

class CatalogExpansionSeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['slug' => 'makanan', 'name' => 'Makanan', 'icon' => 'utensils-crossed', 'display_order' => 2],
            ['slug' => 'minuman', 'name' => 'Minuman', 'icon' => 'milk', 'display_order' => 1],
            ['slug' => 'sembako', 'name' => 'Sembako', 'icon' => 'shopping-basket', 'display_order' => 3],
            ['slug' => 'kebersihan', 'name' => 'Kebersihan', 'icon' => 'spray-can', 'display_order' => 5],
            ['slug' => 'rokok', 'name' => 'Rokok', 'icon' => 'cigarette', 'display_order' => 4],
            ['slug' => 'perawatan-diri', 'name' => 'Perawatan Diri', 'icon' => 'heart-pulse', 'display_order' => 6],
            ['slug' => 'bayi-anak', 'name' => 'Bayi & Anak', 'icon' => 'baby', 'display_order' => 7],
            ['slug' => 'bumbu-masak', 'name' => 'Bumbu & Masak', 'icon' => 'cooking-pot', 'display_order' => 8],
            ['slug' => 'makanan-beku', 'name' => 'Makanan Beku', 'icon' => 'snowflake', 'display_order' => 9],
        ] as $category) {
            Category::query()->updateOrCreate(
                ['slug' => $category['slug']],
                ['name' => $category['name'], 'icon' => $category['icon'], 'display_order' => $category['display_order'], 'is_active' => true],
            );
        }

        foreach ([
            'abc' => 'ABC', 'ajinomoto' => 'Ajinomoto', 'bimoli' => 'Bimoli',
            'champ' => 'Champ', 'coca-cola' => 'Coca-Cola', 'cussons' => 'Cussons',
            'djarum' => 'Djarum', 'fiesta' => 'Fiesta', 'frisian-flag' => 'Frisian Flag',
            'garnier' => 'Garnier', 'garudafood' => 'Garudafood', 'indofood' => 'Indofood',
            'kapal-api' => 'Kapal Api', 'le-minerale' => 'Le Minerale', 'mamy-poko' => 'MamyPoko',
            'mayora' => 'Mayora', 'nestle' => 'Nestle', 'orang-tua' => 'Orang Tua',
            'oreo' => 'Oreo', 'paseo' => 'Paseo', 'pocari' => 'Pocari Sweat',
            'sania' => 'Sania', 'sosro' => 'Sosro', 'ultra-milk' => 'Ultra Milk',
            'unilever' => 'Unilever', 'wings' => 'Wings', 'zwitsal' => 'Zwitsal',
        ] as $slug => $name) {
            Brand::query()->updateOrCreate(['slug' => $slug], ['name' => $name, 'is_active' => true]);
        }

        foreach ([
            ['code' => 'SUP-001', 'name' => 'PT. Distributor Utama', 'contact_person' => 'Dimas Pratama', 'phone' => '0761-555-001', 'email' => 'utama@demo.puterakembar.test', 'address' => 'Jl. Tuanku Tambusai No. 10, Pekanbaru', 'payment_terms_days' => 14],
            ['code' => 'SUP-002', 'name' => 'CV Sumber Pangan Riau', 'contact_person' => 'Rina Wati', 'phone' => '0761-555-002', 'email' => 'pangan@demo.puterakembar.test', 'address' => 'Jl. Arifin Ahmad No. 22, Pekanbaru', 'payment_terms_days' => 14],
            ['code' => 'SUP-003', 'name' => 'CV Tirta Segar Pekanbaru', 'contact_person' => 'Arman', 'phone' => '0761-555-003', 'email' => 'tirta@demo.puterakembar.test', 'address' => 'Jl. Soekarno Hatta No. 45, Pekanbaru', 'payment_terms_days' => 7],
            ['code' => 'SUP-004', 'name' => 'PT Mitra Kebersihan Nusantara', 'contact_person' => 'Siska', 'phone' => '0761-555-004', 'email' => 'bersih@demo.puterakembar.test', 'address' => 'Jl. Riau No. 88, Pekanbaru', 'payment_terms_days' => 21],
            ['code' => 'SUP-005', 'name' => 'CV Sehat Keluarga', 'contact_person' => 'Fajar', 'phone' => '0761-555-005', 'email' => 'sehat@demo.puterakembar.test', 'address' => 'Jl. Hangtuah No. 17, Pekanbaru', 'payment_terms_days' => 14],
            ['code' => 'SUP-006', 'name' => 'PT Dingin Sejahtera', 'contact_person' => 'Nanda', 'phone' => '0761-555-006', 'email' => 'dingin@demo.puterakembar.test', 'address' => 'Jl. HR Soebrantas No. 31, Pekanbaru', 'payment_terms_days' => 7],
        ] as $supplierData) {
            Supplier::query()->updateOrCreate(
                ['code' => $supplierData['code']],
                [...$supplierData, 'store_id' => 1, 'is_active' => true],
            );
        }

        $units = Unit::query()->get()->keyBy('symbol');
        $categories = Category::query()->get()->keyBy('slug');
        $brands = Brand::query()->get()->keyBy('slug');
        $warehouse = Warehouse::query()->where('store_location_id', 1)->firstOrFail();
        $suppliers = Supplier::query()->where('store_id', 1)->get()->keyBy('code');
        $slop = Unit::firstOrCreate(['name' => 'Slop'], ['symbol' => 'slop', 'is_active' => true]);
        $units->put('slop', $slop);

        /** @var array<int, array<string, mixed>> $catalog */
        $catalog = [
            ['sku' => 'MNM-000005', 'name' => 'Teh Botol Sosro 450ml', 'category' => 'minuman', 'brand' => 'mayora', 'cost' => 3900, 'price' => 5500, 'tier' => 5000, 'stock' => 180, 'pack' => ['dus', 24, 120000], 'short' => 'Teh melati siap minum dalam botol 450 ml.', 'long' => 'Teh Botol Sosro 450 ml dengan rasa teh melati yang segar. Cocok untuk stok warung, acara keluarga, dan minuman harian.'],
            ['sku' => 'MNM-000006', 'name' => 'Coca-Cola Kaleng 330ml', 'category' => 'minuman', 'brand' => null, 'cost' => 4300, 'price' => 6500, 'tier' => 5900, 'stock' => 144, 'pack' => ['dus', 24, 144000], 'short' => 'Minuman berkarbonasi kaleng 330 ml.', 'long' => 'Coca-Cola kaleng 330 ml dengan rasa khas yang dingin dan menyegarkan. Cocok dijual satuan maupun paket dus.'],
            ['sku' => 'MNM-000007', 'name' => 'Ultra Milk UHT Cokelat 250ml', 'category' => 'minuman', 'brand' => null, 'cost' => 4100, 'price' => 6000, 'tier' => 5500, 'stock' => 216, 'pack' => ['dus', 24, 132000], 'short' => 'Susu UHT rasa cokelat ukuran praktis 250 ml.', 'long' => 'Ultra Milk UHT cokelat 250 ml dibuat dari susu berkualitas dengan rasa cokelat yang disukai keluarga. Praktis dibawa untuk bekal dan stok toko.'],
            ['sku' => 'MNM-000008', 'name' => 'Le Minerale 600ml', 'category' => 'minuman', 'brand' => null, 'cost' => 1900, 'price' => 3500, 'tier' => 3000, 'stock' => 240, 'pack' => ['dus', 24, 72000], 'short' => 'Air mineral botol 600 ml untuk kebutuhan harian.', 'long' => 'Le Minerale 600 ml adalah air mineral kemasan botol yang praktis untuk dibawa. Dijual satuan atau per dus untuk rumah dan usaha.'],
            ['sku' => 'MKN-000003', 'name' => 'Biskuit Roma Kelapa 300g', 'category' => 'makanan', 'brand' => 'mayora', 'cost' => 9500, 'price' => 13000, 'tier' => 11800, 'stock' => 96, 'pack' => ['dus', 12, 141600], 'short' => 'Biskuit kelapa renyah kemasan 300 gram.', 'long' => 'Biskuit Roma Kelapa 300 gram dengan rasa kelapa yang renyah. Pilihan camilan untuk rumah, warung, dan hampers.'],
            ['sku' => 'MKN-000004', 'name' => 'Chitato Sapi Panggang 68g', 'category' => 'makanan', 'brand' => 'indofood', 'cost' => 7200, 'price' => 10000, 'tier' => 9000, 'stock' => 120, 'pack' => ['dus', 20, 180000], 'short' => 'Keripik kentang rasa sapi panggang 68 gram.', 'long' => 'Chitato rasa sapi panggang 68 gram, camilan keripik kentang yang gurih dan populer. Tersedia harga satuan dan grosir.'],
            ['sku' => 'MKN-000005', 'name' => 'Kecap Bango Manis 520ml', 'category' => 'makanan', 'brand' => 'unilever', 'cost' => 17500, 'price' => 23000, 'tier' => 21000, 'stock' => 72, 'pack' => ['dus', 12, 252000], 'short' => 'Kecap manis kualitas pilihan botol 520 ml.', 'long' => 'Kecap Bango manis 520 ml untuk memasak, marinasi, dan pelengkap hidangan. Rasa manis gurih untuk rumah tangga dan usaha kuliner.'],
            ['sku' => 'MKN-000006', 'name' => 'Sarden ABC Saus Tomat 425g', 'category' => 'makanan', 'brand' => null, 'cost' => 15800, 'price' => 21000, 'tier' => 19000, 'stock' => 84, 'pack' => ['dus', 12, 228000], 'short' => 'Ikan sarden kaleng saus tomat 425 gram.', 'long' => 'Sarden ABC saus tomat 425 gram, makanan praktis berbahan ikan pilihan yang siap menjadi stok dapur.'],
            ['sku' => 'SMB-000004', 'name' => 'Beras Ramos Medium', 'category' => 'sembako', 'brand' => null, 'base' => 'kg', 'display' => 'ons', 'cost' => 14000, 'price' => 16000, 'tier' => 15000, 'stock' => 300, 'pack' => ['ons', 0.1, 1700], 'short' => 'Beras ramos medium pulen, dijual mulai per ons.', 'long' => 'Beras Ramos medium dengan tekstur pulen untuk konsumsi sehari-hari. Tersedia pilihan per ons dan kilogram agar pelanggan membeli sesuai kebutuhan.'],
            ['sku' => 'SMB-000005', 'name' => 'Tepung Terigu Segitiga Biru 1kg', 'category' => 'sembako', 'brand' => null, 'cost' => 10500, 'price' => 13500, 'tier' => 12500, 'stock' => 100, 'pack' => ['dus', 12, 150000], 'short' => 'Tepung terigu serbaguna kemasan 1 kilogram.', 'long' => 'Tepung terigu Segitiga Biru 1 kg untuk roti, gorengan, dan aneka kue. Kemasan praktis untuk rumah dan usaha kuliner.'],
            ['sku' => 'SMB-000006', 'name' => 'Telur Ayam Negeri', 'category' => 'sembako', 'brand' => null, 'cost' => 1900, 'price' => 2600, 'tier' => 2400, 'stock' => 360, 'pack' => ['lsn', 12, 28800], 'short' => 'Telur ayam negeri segar, satuan atau per lusin.', 'long' => 'Telur ayam negeri segar untuk memasak dan usaha makanan. Dijual per butir atau per lusin dengan harga khusus pembelian banyak.'],
            ['sku' => 'SMB-000007', 'name' => 'Garam Refina 500g', 'category' => 'sembako', 'brand' => null, 'cost' => 3200, 'price' => 4500, 'tier' => 4000, 'stock' => 150, 'pack' => ['dus', 24, 96000], 'short' => 'Garam beryodium halus kemasan 500 gram.', 'long' => 'Garam Refina 500 gram beryodium untuk bumbu dapur harian. Kemasan higienis dan praktis untuk dijual kembali.'],
            ['sku' => 'KBR-000002', 'name' => 'Rinso Anti Noda 770g', 'category' => 'kebersihan', 'brand' => 'unilever', 'cost' => 18500, 'price' => 25000, 'tier' => 23000, 'stock' => 60, 'pack' => ['dus', 12, 276000], 'short' => 'Deterjen bubuk untuk membersihkan noda membandel.', 'long' => 'Rinso Anti Noda 770 gram membantu membersihkan pakaian dan menjaga warna. Cocok untuk rumah tangga, laundry, serta stok warung.'],
            ['sku' => 'KBR-000003', 'name' => 'Lifebuoy Sabun Cair Total 450ml', 'category' => 'kebersihan', 'brand' => 'unilever', 'cost' => 14500, 'price' => 19500, 'tier' => 18000, 'stock' => 72, 'pack' => ['dus', 12, 216000], 'short' => 'Sabun mandi cair perlindungan kebersihan 450 ml.', 'long' => 'Lifebuoy sabun cair Total 450 ml untuk kebersihan keluarga sehari-hari. Botol pompa praktis untuk penjualan eceran atau paket.'],
            ['sku' => 'KBR-000004', 'name' => 'Baygon Aerosol 600ml', 'category' => 'kebersihan', 'brand' => null, 'cost' => 23500, 'price' => 31000, 'tier' => 28500, 'stock' => 48, 'pack' => ['dus', 12, 342000], 'short' => 'Pengusir serangga aerosol ukuran 600 ml.', 'long' => 'Baygon aerosol 600 ml untuk membantu mengendalikan serangga di rumah. Gunakan sesuai petunjuk kemasan.'],
            ['sku' => 'KBR-000005', 'name' => 'Tisu Paseo Smart 250 Lembar', 'category' => 'kebersihan', 'brand' => null, 'cost' => 8200, 'price' => 11500, 'tier' => 10500, 'stock' => 96, 'pack' => ['dus', 12, 126000], 'short' => 'Tisu wajah lembut kemasan 250 lembar.', 'long' => 'Tisu Paseo Smart 250 lembar lembut dan praktis untuk rumah, kantor, serta usaha. Produk kebutuhan yang cepat bergerak.'],
            ['sku' => 'RKK-000001', 'name' => 'Sampoerna A Mild 16 Batang', 'category' => 'rokok', 'brand' => null, 'cost' => 28500, 'price' => 33000, 'tier' => 31500, 'stock' => 60, 'pack' => ['slop', 10, 315000], 'short' => 'Produk tembakau untuk pelanggan dewasa.', 'long' => 'Sampoerna A Mild isi 16 batang. Produk khusus pelanggan dewasa sesuai peraturan. Jangan dijual kepada anak di bawah umur.'],
            ['sku' => 'RKK-000002', 'name' => 'Gudang Garam Surya 16 Batang', 'category' => 'rokok', 'brand' => null, 'cost' => 30000, 'price' => 35000, 'tier' => 33500, 'stock' => 48, 'pack' => ['slop', 10, 335000], 'short' => 'Produk tembakau untuk pelanggan dewasa.', 'long' => 'Gudang Garam Surya isi 16 batang. Produk khusus pelanggan dewasa sesuai peraturan. Jangan dijual kepada anak di bawah umur.'],
            ['sku' => 'MNM-000009', 'name' => 'Yakult Minuman Probiotik 65ml', 'category' => 'minuman', 'brand' => null, 'cost' => 1900, 'price' => 2800, 'tier' => 2500, 'stock' => 120, 'pack' => ['dus', 50, 125000], 'short' => 'Minuman probiotik botol 65 ml.', 'long' => 'Yakult 65 ml dengan bakteri baik untuk melengkapi kebutuhan minuman keluarga. Simpan dingin agar kualitas produk terjaga.'],
            ['sku' => 'MNM-000010', 'name' => 'Fruit Tea Blackcurrant 350ml', 'category' => 'minuman', 'brand' => null, 'cost' => 3000, 'price' => 4500, 'tier' => 4000, 'stock' => 144, 'pack' => ['dus', 24, 96000], 'short' => 'Minuman teh rasa blackcurrant 350 ml.', 'long' => 'Fruit Tea Blackcurrant 350 ml dengan rasa buah yang segar. Pilihan minuman praktis untuk warung dan kegiatan keluarga.'],
            ['sku' => 'MKN-000007', 'name' => 'Indomie Kari Ayam', 'category' => 'makanan', 'brand' => 'indofood', 'cost' => 2400, 'price' => 3500, 'tier' => 3000, 'stock' => 280, 'pack' => ['rtg', 40, 120000], 'short' => 'Mie instan kuah rasa kari ayam.', 'long' => 'Indomie Kari Ayam dengan bumbu kuah gurih dan praktis disajikan. Tersedia per bungkus dan harga grosir untuk pembelian banyak.'],
            ['sku' => 'MKN-000008', 'name' => 'Beng Beng Maxx 32g', 'category' => 'makanan', 'brand' => null, 'cost' => 2100, 'price' => 3000, 'tier' => 2700, 'stock' => 180, 'pack' => ['dus', 24, 64800], 'short' => 'Wafer cokelat renyah ukuran 32 gram.', 'long' => 'Beng Beng Maxx 32 gram, camilan wafer cokelat renyah untuk anak dan keluarga. Cocok sebagai stok kasir warung.'],
            ['sku' => 'SMB-000008', 'name' => 'Susu Kental Manis Frisian Flag Putih 370g', 'category' => 'sembako', 'brand' => null, 'cost' => 9000, 'price' => 12500, 'tier' => 11500, 'stock' => 96, 'pack' => ['dus', 24, 276000], 'short' => 'Susu kental manis rasa putih kemasan 370 gram.', 'long' => 'Susu kental manis Frisian Flag putih 370 gram untuk minuman, roti, dan pelengkap makanan. Kemasan kaleng praktis untuk stok dapur.'],
            ['sku' => 'SMB-000009', 'name' => 'Kopi Kapal Api Special Mix Sachet', 'category' => 'sembako', 'brand' => null, 'cost' => 1100, 'price' => 1700, 'tier' => 1500, 'stock' => 400, 'pack' => ['dus', 20, 30000], 'short' => 'Kopi instan sachet siap seduh.', 'long' => 'Kopi Kapal Api Special Mix sachet dengan rasa kopi susu yang praktis diseduh. Cocok untuk stok warung, kantor, dan rumah.'],
            ['sku' => 'KBR-000006', 'name' => 'Wipol Classic Pine 800ml', 'category' => 'kebersihan', 'brand' => 'unilever', 'cost' => 12500, 'price' => 17500, 'tier' => 16000, 'stock' => 72, 'pack' => ['dus', 12, 192000], 'short' => 'Pembersih lantai aroma pinus 800 ml.', 'long' => 'Wipol Classic Pine 800 ml membantu membersihkan lantai dengan aroma pinus yang segar. Cocok untuk kebutuhan rumah dan usaha.'],
            ['sku' => 'MNM-000011', 'name' => 'Teh Pucuk Harum 350ml', 'category' => 'minuman', 'brand' => 'mayora', 'cost' => 2800, 'price' => 4500, 'tier' => 4000, 'stock' => 192, 'pack' => ['dus', 24, 96000], 'short' => 'Teh melati siap minum ukuran 350 ml.', 'long' => 'Teh Pucuk Harum 350 ml dengan rasa teh melati yang ringan dan menyegarkan. Cocok untuk stok minuman warung dan acara keluarga.'],
            ['sku' => 'MNM-000012', 'name' => 'Fanta Strawberry 390ml', 'category' => 'minuman', 'brand' => 'coca-cola', 'cost' => 4200, 'price' => 6500, 'tier' => 6000, 'stock' => 144, 'pack' => ['dus', 24, 144000], 'short' => 'Minuman bersoda rasa stroberi 390 ml.', 'long' => 'Fanta Strawberry 390 ml menghadirkan rasa buah yang manis dan segar. Tersedia untuk penjualan satuan maupun pembelian dus.'],
            ['sku' => 'MNM-000013', 'name' => 'Floridina Orange 350ml', 'category' => 'minuman', 'brand' => 'mayora', 'cost' => 2600, 'price' => 4000, 'tier' => 3600, 'stock' => 168, 'pack' => ['dus', 24, 86400], 'short' => 'Minuman rasa jeruk dengan serat buah.', 'long' => 'Floridina Orange 350 ml adalah minuman rasa jeruk dengan serat buah. Praktis untuk bekal dan stok minuman harian.'],
            ['sku' => 'MNM-000014', 'name' => 'Susu Ultra Milk Plain 250ml', 'category' => 'minuman', 'brand' => 'ultra-milk', 'cost' => 4000, 'price' => 6000, 'tier' => 5500, 'stock' => 192, 'pack' => ['dus', 24, 132000], 'short' => 'Susu UHT plain ukuran 250 ml.', 'long' => 'Ultra Milk Plain 250 ml adalah susu UHT praktis dengan rasa susu asli. Cocok untuk kebutuhan keluarga dan stok warung.'],
            ['sku' => 'MNM-000015', 'name' => 'Pocari Sweat 500ml', 'category' => 'minuman', 'brand' => 'pocari', 'cost' => 7200, 'price' => 10000, 'tier' => 9000, 'stock' => 96, 'pack' => ['dus', 24, 216000], 'short' => 'Minuman isotonik botol 500 ml.', 'long' => 'Pocari Sweat 500 ml membantu menggantikan cairan tubuh setelah beraktivitas. Simpan dalam kondisi sejuk untuk rasa terbaik.'],
            ['sku' => 'MKN-000009', 'name' => 'Indomie Soto Mie', 'category' => 'makanan', 'brand' => 'indofood', 'cost' => 2400, 'price' => 3500, 'tier' => 3000, 'stock' => 280, 'pack' => ['rtg', 40, 120000], 'short' => 'Mie instan kuah rasa soto mie.', 'long' => 'Indomie Soto Mie dengan kuah gurih dan bumbu khas. Cocok dijual eceran, per renteng, atau untuk stok rumah.'],
            ['sku' => 'MKN-000010', 'name' => 'Mie Sedaap Korean Spicy Soup', 'category' => 'makanan', 'brand' => 'wings', 'cost' => 2600, 'price' => 3800, 'tier' => 3400, 'stock' => 200, 'pack' => ['rtg', 40, 136000], 'short' => 'Mie instan kuah pedas ala Korea.', 'long' => 'Mie Sedaap Korean Spicy Soup untuk pelanggan yang menyukai rasa kuah pedas. Kemasan praktis dan cocok untuk stok warung.'],
            ['sku' => 'MKN-000011', 'name' => 'Tango Wafer Vanilla 130g', 'category' => 'makanan', 'brand' => 'orang-tua', 'cost' => 5800, 'price' => 8500, 'tier' => 7800, 'stock' => 120, 'pack' => ['dus', 20, 156000], 'short' => 'Wafer renyah rasa vanila kemasan 130 gram.', 'long' => 'Tango Wafer Vanilla 130 gram adalah camilan renyah dengan lapisan krim vanila. Cocok untuk suguhan rumah dan penjualan eceran.'],
            ['sku' => 'MKN-000012', 'name' => 'Oreo Original 133g', 'category' => 'makanan', 'brand' => 'oreo', 'cost' => 8200, 'price' => 12000, 'tier' => 10800, 'stock' => 108, 'pack' => ['dus', 12, 129600], 'short' => 'Biskuit cokelat berisi krim vanila 133 gram.', 'long' => 'Oreo Original 133 gram dengan biskuit cokelat dan krim vanila. Pilihan camilan keluarga yang mudah disajikan.'],
            ['sku' => 'MKN-000013', 'name' => 'Qtela Singkong Balado 60g', 'category' => 'makanan', 'brand' => 'indofood', 'cost' => 3900, 'price' => 6000, 'tier' => 5400, 'stock' => 144, 'pack' => ['dus', 24, 129600], 'short' => 'Keripik singkong rasa balado 60 gram.', 'long' => 'Qtela Singkong Balado 60 gram menawarkan keripik singkong renyah dengan bumbu balado. Sesuai untuk stok camilan warung.'],
            ['sku' => 'SMB-000010', 'name' => 'Bimoli Minyak Goreng 1 Liter', 'category' => 'sembako', 'brand' => 'bimoli', 'cost' => 15500, 'price' => 18500, 'tier' => 17500, 'stock' => 120, 'pack' => ['dus', 12, 210000], 'short' => 'Minyak goreng kemasan 1 liter.', 'long' => 'Bimoli minyak goreng 1 liter untuk kebutuhan memasak harian. Tersedia harga eceran, grosir, dan kemasan dus.'],
            ['sku' => 'SMB-000011', 'name' => 'Susu Kental Manis Frisian Flag Cokelat 370g', 'category' => 'sembako', 'brand' => 'frisian-flag', 'cost' => 9200, 'price' => 13000, 'tier' => 11800, 'stock' => 96, 'pack' => ['dus', 24, 283200], 'short' => 'Susu kental manis rasa cokelat 370 gram.', 'long' => 'Frisian Flag cokelat 370 gram untuk minuman, roti, dan pelengkap makanan. Kaleng praktis untuk stok dapur dan toko.'],
            ['sku' => 'SMB-000012', 'name' => 'Sania Beras Premium 5kg', 'category' => 'sembako', 'brand' => 'sania', 'cost' => 68000, 'price' => 78000, 'tier' => 73500, 'stock' => 60, 'pack' => ['dus', 4, 294000], 'short' => 'Beras premium kemasan 5 kilogram.', 'long' => 'Sania Beras Premium 5 kg merupakan pilihan beras praktis untuk keluarga. Kemasan tersegel untuk menjaga kualitas beras.'],
            ['sku' => 'SMB-000013', 'name' => 'Sarden ABC Pedas 425g', 'category' => 'sembako', 'brand' => 'abc', 'cost' => 15800, 'price' => 21500, 'tier' => 19500, 'stock' => 84, 'pack' => ['dus', 12, 234000], 'short' => 'Ikan sarden kaleng saus pedas 425 gram.', 'long' => 'Sarden ABC pedas 425 gram adalah makanan praktis dengan saus kaya rasa. Siap menjadi stok makanan rumah dan warung.'],
            ['sku' => 'KBR-000007', 'name' => 'So Klin Liquid 800ml', 'category' => 'kebersihan', 'brand' => 'wings', 'cost' => 11200, 'price' => 16500, 'tier' => 15000, 'stock' => 84, 'pack' => ['dus', 12, 180000], 'short' => 'Deterjen cair untuk pakaian ukuran 800 ml.', 'long' => 'So Klin Liquid 800 ml membersihkan pakaian sehari-hari dengan praktis. Cocok untuk kebutuhan rumah dan usaha laundry.'],
            ['sku' => 'KBR-000008', 'name' => 'Mama Lemon Jeruk Nipis 680ml', 'category' => 'kebersihan', 'brand' => 'wings', 'cost' => 9800, 'price' => 14500, 'tier' => 13200, 'stock' => 96, 'pack' => ['dus', 12, 158400], 'short' => 'Sabun cuci piring aroma jeruk nipis.', 'long' => 'Mama Lemon 680 ml membantu membersihkan lemak pada peralatan makan. Aroma jeruk nipis memberi kesan segar setelah mencuci.'],
            ['sku' => 'KBR-000009', 'name' => 'Molto Pewangi Pakaian 820ml', 'category' => 'kebersihan', 'brand' => 'unilever', 'cost' => 14500, 'price' => 20500, 'tier' => 18800, 'stock' => 72, 'pack' => ['dus', 12, 225600], 'short' => 'Pewangi pakaian cair ukuran 820 ml.', 'long' => 'Molto 820 ml memberikan keharuman pada pakaian setelah dicuci. Kemasan besar cocok untuk rumah dan laundry.'],
            ['sku' => 'KBR-000010', 'name' => 'Vixal Pembersih Toilet 500ml', 'category' => 'kebersihan', 'brand' => 'unilever', 'cost' => 7200, 'price' => 10500, 'tier' => 9600, 'stock' => 108, 'pack' => ['dus', 12, 115200], 'short' => 'Pembersih toilet botol 500 ml.', 'long' => 'Vixal 500 ml membantu membersihkan kerak pada toilet. Gunakan sesuai petunjuk keamanan pada kemasan.'],
            ['sku' => 'PRD-000001', 'name' => 'Pepsodent Herbal 190g', 'category' => 'perawatan-diri', 'brand' => 'unilever', 'cost' => 9200, 'price' => 13500, 'tier' => 12200, 'stock' => 120, 'pack' => ['dus', 24, 292800], 'short' => 'Pasta gigi herbal kemasan 190 gram.', 'long' => 'Pepsodent Herbal 190 gram untuk perawatan gigi harian keluarga. Kemasan besar cocok dijual satuan dan grosir.'],
            ['sku' => 'PRD-000002', 'name' => 'Lifebuoy Sabun Batang Total 110g', 'category' => 'perawatan-diri', 'brand' => 'unilever', 'cost' => 3200, 'price' => 5000, 'tier' => 4500, 'stock' => 180, 'pack' => ['dus', 48, 216000], 'short' => 'Sabun mandi batang 110 gram.', 'long' => 'Lifebuoy Total 110 gram adalah sabun mandi batang untuk kebutuhan kebersihan keluarga sehari-hari.'],
            ['sku' => 'PRD-000003', 'name' => 'Sunsilk Black Shine 170ml', 'category' => 'perawatan-diri', 'brand' => 'unilever', 'cost' => 11800, 'price' => 17000, 'tier' => 15500, 'stock' => 96, 'pack' => ['dus', 12, 186000], 'short' => 'Sampo rambut kemasan 170 ml.', 'long' => 'Sunsilk Black Shine 170 ml untuk perawatan rambut sehari-hari. Kemasan praktis yang mudah disimpan di rumah atau toko.'],
            ['sku' => 'PRD-000004', 'name' => 'Garnier Micellar Water 125ml', 'category' => 'perawatan-diri', 'brand' => 'garnier', 'cost' => 18500, 'price' => 27000, 'tier' => 24800, 'stock' => 48, 'pack' => ['dus', 12, 297600], 'short' => 'Pembersih wajah micellar water 125 ml.', 'long' => 'Garnier Micellar Water 125 ml membantu membersihkan wajah dari kotoran dan riasan. Simpan pada suhu ruang.'],
            ['sku' => 'BYI-000001', 'name' => 'MamyPoko Pants Extra Dry M 10', 'category' => 'bayi-anak', 'brand' => 'mamy-poko', 'cost' => 28500, 'price' => 35000, 'tier' => 32500, 'stock' => 60, 'pack' => ['dus', 6, 195000], 'short' => 'Popok celana bayi ukuran M isi 10.', 'long' => 'MamyPoko Pants Extra Dry ukuran M isi 10 untuk kebutuhan popok bayi. Pilih ukuran sesuai berat badan anak.'],
            ['sku' => 'BYI-000002', 'name' => 'Zwitsal Baby Shampoo 100ml', 'category' => 'bayi-anak', 'brand' => 'zwitsal', 'cost' => 9800, 'price' => 14500, 'tier' => 13200, 'stock' => 72, 'pack' => ['dus', 24, 316800], 'short' => 'Sampo bayi lembut ukuran 100 ml.', 'long' => 'Zwitsal Baby Shampoo 100 ml diformulasikan untuk rambut bayi. Gunakan secukupnya dan bilas hingga bersih.'],
            ['sku' => 'BYI-000003', 'name' => 'Cussons Baby Powder 100g', 'category' => 'bayi-anak', 'brand' => 'cussons', 'cost' => 7600, 'price' => 11000, 'tier' => 10000, 'stock' => 84, 'pack' => ['dus', 24, 240000], 'short' => 'Bedak bayi lembut kemasan 100 gram.', 'long' => 'Cussons Baby Powder 100 gram membantu menjaga kulit bayi tetap nyaman. Simpan di tempat kering.'],
            ['sku' => 'BMS-000001', 'name' => 'Royco Kaldu Ayam 230g', 'category' => 'bumbu-masak', 'brand' => 'unilever', 'cost' => 6200, 'price' => 9000, 'tier' => 8200, 'stock' => 120, 'pack' => ['dus', 24, 196800], 'short' => 'Bumbu kaldu ayam kemasan 230 gram.', 'long' => 'Royco Kaldu Ayam 230 gram untuk menyedapkan aneka masakan. Kemasan praktis untuk rumah dan usaha kuliner.'],
            ['sku' => 'BMS-000002', 'name' => 'Saus Sambal ABC 340ml', 'category' => 'bumbu-masak', 'brand' => 'abc', 'cost' => 7900, 'price' => 11500, 'tier' => 10400, 'stock' => 96, 'pack' => ['dus', 12, 124800], 'short' => 'Saus sambal botol 340 ml.', 'long' => 'Saus Sambal ABC 340 ml dengan rasa pedas manis untuk pelengkap gorengan dan masakan.'],
            ['sku' => 'BMS-000003', 'name' => 'Masako Sapi 250g', 'category' => 'bumbu-masak', 'brand' => 'ajinomoto', 'cost' => 7300, 'price' => 10500, 'tier' => 9600, 'stock' => 108, 'pack' => ['dus', 24, 230400], 'short' => 'Bumbu kaldu sapi kemasan 250 gram.', 'long' => 'Masako Sapi 250 gram untuk menambah rasa gurih pada masakan keluarga dan usaha makanan.'],
            ['sku' => 'FRZ-000001', 'name' => 'Fiesta Nugget Chicken 500g', 'category' => 'makanan-beku', 'brand' => 'fiesta', 'cost' => 28000, 'price' => 38000, 'tier' => 35000, 'stock' => 48, 'pack' => ['dus', 10, 350000], 'short' => 'Nugget ayam beku kemasan 500 gram.', 'long' => 'Fiesta Nugget Chicken 500 gram adalah makanan beku praktis untuk keluarga. Simpan di freezer agar kualitas tetap terjaga.'],
            ['sku' => 'FRZ-000002', 'name' => 'Champ Sosis Ayam 375g', 'category' => 'makanan-beku', 'brand' => 'champ', 'cost' => 22000, 'price' => 30500, 'tier' => 28000, 'stock' => 48, 'pack' => ['dus', 10, 280000], 'short' => 'Sosis ayam beku kemasan 375 gram.', 'long' => 'Champ Sosis Ayam 375 gram cocok untuk sarapan dan bekal. Simpan selalu dalam freezer sebelum digunakan.'],
        ];

        foreach ($catalog as $index => $item) {
            $baseUnit = $units->get($item['base'] ?? 'pcs');
            [$packageSymbol, $conversion, $packagePrice] = $item['pack'];
            $packageUnit = $units->get($packageSymbol);
            $barcode = '899900000'.str_pad((string) ($index + 101), 4, '0', STR_PAD_LEFT);
            $product = Product::query()->updateOrCreate(['sku' => $item['sku']], [
                'store_id' => 1, 'name' => $item['name'], 'slug' => Str::slug($item['name']),
                'category_id' => $categories->get($item['category'])?->id, 'brand_id' => $item['brand'] ? $brands->get($item['brand'])?->id : null,
                'base_unit_id' => $baseUnit?->id, 'online_display_unit_id' => $units->get($item['display'] ?? ($item['base'] ?? 'pcs'))?->id,
                'default_warehouse_id' => $warehouse->id, 'primary_supplier_id' => $this->supplierFor($item['category'], $suppliers)->id, 'barcode_primary' => $barcode,
                'description_short' => $item['short'], 'description_long' => $item['long'], 'hpp_current' => $item['cost'], 'stok_saat_ini' => $item['stock'],
                'min_stock' => max(12, (int) ($item['stock'] / 8)), 'product_type' => 'physical', 'costing_method' => 'WAC', 'display_price_prefix' => 'exact',
                'is_active' => true, 'is_sellable' => true, 'sellable_pos' => true, 'sellable_online' => true,
            ]);
            ProductUnit::query()->updateOrCreate(['product_id' => $product->id, 'unit_id' => $packageUnit?->id], ['conversion_qty' => $conversion, 'is_purchase_unit' => true, 'is_sales_unit' => true]);
            ProductBarcode::query()->updateOrCreate(['barcode' => $barcode], ['product_id' => $product->id, 'unit_id' => $baseUnit?->id, 'is_primary' => true]);
            ProductSupplier::query()->updateOrCreate(
                ['product_id' => $product->id, 'supplier_id' => $product->primary_supplier_id],
                ['supplier_sku' => 'SUP-'.$item['sku'], 'default_price' => $item['cost']],
            );
            $this->setPrice($product, $baseUnit?->id, 1, $item['price'], 'retail');
            $this->setPrice($product, $baseUnit?->id, 12, $item['tier'], 'wholesale_tier');
            $this->setPrice($product, $packageUnit?->id, 1, $packagePrice, 'retail');
        }
    }

    private function setPrice(Product $product, ?int $unitId, int $minimumQuantity, int|float $price, string $type): void
    {
        ProductPrice::query()->updateOrCreate(
            ['product_id' => $product->id, 'store_id' => 1, 'unit_id' => $unitId, 'min_qty' => $minimumQuantity, 'price_type' => $type],
            ['price' => $price, 'channel' => 'both', 'is_active' => true],
        );
    }

    /** @param Collection<string, Supplier> $suppliers */
    private function supplierFor(string $category, Collection $suppliers): Supplier
    {
        $supplierCodes = [
            'minuman' => 'SUP-003',
            'kebersihan' => 'SUP-004',
            'perawatan-diri' => 'SUP-005',
            'bayi-anak' => 'SUP-005',
            'makanan-beku' => 'SUP-006',
            'makanan' => 'SUP-002',
            'sembako' => 'SUP-002',
            'bumbu-masak' => 'SUP-002',
        ];

        return $suppliers->get($supplierCodes[$category] ?? 'SUP-001') ?? $suppliers->firstOrFail();
    }
}
