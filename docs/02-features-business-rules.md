# 02. Fitur & Business Rules Lengkap

> Dokumen ini adalah **spesifikasi fungsional detail**. Setiap sub-bab menjelaskan field, kemungkinan state, dan aturan bisnis — bukan hanya nama fitur. Ini adalah dokumen yang paling sering dirujuk oleh AI agent saat implementasi CRUD/logic.
>
> Konvensi: field bertanda **(wajib)** harus ada di form create. Field lain opsional/nullable.

---

## 1. MODUL MASTER DATA — PRODUK

### 1.1 Entitas Produk — Field Lengkap

| Field | Tipe | Keterangan |
|---|---|---|
| `name` | string (wajib) | Nama produk |
| `slug` | string, unique | Untuk URL SEO-friendly di website |
| `sku` | string, unique (wajib) | Kode internal, auto-generate atau manual dengan prefix kategori |
| `barcode_primary` | string, unique, nullable | Barcode utama (EAN-13/UPC) |
| `barcodes[]` | relasi 1-N ke `product_barcodes` | **Multiple barcode** per produk (misal beda barcode dari 2 supplier berbeda untuk produk identik) |
| `qr_code` | string, generated | QR code unik untuk internal tracking (label rak, opname cepat) |
| `brand_id` | FK nullable | Brand/merek |
| `category_id` | FK (wajib) | Kategori |
| `subcategory_id` | FK nullable | Subkategori (self-referencing `categories.parent_id`, jadi kategori & subkategori adalah tabel yang sama dengan hierarki) |
| `tags[]` | pivot many-to-many | Tag bebas untuk pencarian & related product |
| `default_warehouse_id` | FK | Gudang utama penyimpanan |
| `shelf_location` | string, nullable | Kode rak (misal "A-12-3") — bisa juga tabel `product_shelf_locations` jika 1 produk tersebar di banyak rak/gudang |
| `primary_supplier_id` | FK nullable | Supplier utama |
| `alternative_supplier_ids[]` | pivot many-to-many ke `product_suppliers` | Supplier alternatif, masing-masing dengan harga beli & lead time berbeda |
| `is_active` | boolean, default true | Status aktif produk (nonaktif = disembunyikan semua channel, tidak dihapus) |
| `is_sellable` | boolean, default true | Apakah produk boleh dijual sama sekali (produk bisa aktif tapi non-sellable, misal bahan baku internal) |
| `sellable_pos` | boolean, default true | **Tampil/bisa dijual di POS** |
| `sellable_online` | boolean, default true | **Tampil/bisa dijual di website** |
| `is_preorder` | boolean, default false | Produk preorder (stok bisa 0, tapi tetap bisa dipesan dengan estimasi ready) |
| `preorder_eta_days` | int, nullable | Estimasi hari ketersediaan jika preorder |
| `product_type` | enum(`physical`,`digital`,`service`) | Fisik / digital (tidak butuh stok & pengiriman) / jasa |
| `weight_grams` | decimal, nullable | Berat untuk kalkulasi ongkir |
| `dimensions` (length/width/height_cm) | decimal x3, nullable | Dimensi untuk kalkulasi ongkir volumetrik |
| `min_stock` | decimal, default 0 | Ambang batas stok minimum → trigger alert |
| `max_stock` | decimal, nullable | Ambang batas stok maksimum → cegah over-purchasing |
| `safety_stock` | decimal, default 0 | Buffer stok yang tidak boleh terjual habis (dipisah dari min_stock; dipakai untuk kalkulasi reorder point) |
| `reorder_point` | decimal, nullable | Titik pemicu rekomendasi pembelian ulang (bisa dihitung otomatis dari rata2 penjualan harian × lead time supplier + safety stock) |
| `track_batch` | boolean, default false | Apakah produk dilacak per **batch/lot** |
| `track_expiry` | boolean, default false | Apakah produk punya **tanggal kedaluwarsa** |
| `track_serial_number` | boolean, default false | Apakah produk dilacak per **serial number** unik (elektronik, dsb) |
| `costing_method` | enum(`WAC`,`FIFO`) per produk atau global setting | Metode kalkulasi HPP. Default WAC (sesuai SKPL), tapi arsitektur mendukung FIFO per kategori produk tertentu (lihat §1.5) |
| `base_unit_id` | FK ke `units` (wajib) | **Satuan dasar** (Pcs) — basis semua perhitungan stok |
| `unit_conversions[]` | relasi 1-N ke `product_units` | Konversi satuan (lihat §1.4) |
| `image_primary` | string (path/S3 URL) | Gambar utama |
| `images[]` | relasi 1-N ke `product_images` | Galeri gambar produk |
| `video_url` | string, nullable | Link video produk (YouTube/S3) |
| `description_short` | text, nullable | Deskripsi singkat (untuk kartu produk) |
| `description_long` | text (rich text/markdown), nullable | Deskripsi lengkap (halaman detail) |
| `seo_title`, `seo_description`, `seo_keywords` | string/text, nullable | SEO metadata untuk halaman produk di website |
| `related_product_ids[]` | pivot | Produk terkait (related product) |
| `upsell_product_ids[]` | pivot | Produk upselling (ditampilkan sebagai "upgrade") |
| `cross_sell_product_ids[]` | pivot | Produk cross-selling (ditampilkan sebagai "sering dibeli bersama") |
| `hpp_current` | decimal(15,4), computed/cached | HPP terkini (hasil WAC/FIFO, di-cache di kolom untuk performa, sumber kebenaran tetap di `stock_ledger`) |
| `created_by`, `updated_by` | FK ke users | Audit jejak siapa yang membuat/mengubah |
| timestamps + `deleted_at` | | Soft delete wajib (produk tidak boleh hard-delete jika sudah pernah bertransaksi) |

**Business Rules:**
- Produk **tidak boleh dihapus permanen** jika sudah punya riwayat transaksi (penjualan/barang masuk) — gunakan soft delete + set `is_active = false`.
- `sku` auto-generate format: `{PREFIX_KATEGORI}-{SEQUENCE}` (contoh: `MNM-000123` untuk kategori Minuman), tapi admin boleh override manual.
- Jika `product_type = digital` atau `service`, field stok/gudang/berat/dimensi disembunyikan di form dan tidak divalidasi wajib.
- Jika `is_preorder = true`, sistem mengizinkan `stok_tersedia < qty_dipesan` di checkout online, tapi WAJIB menampilkan estimasi ETA ke pelanggan.
- Perubahan `sellable_pos`/`sellable_online` **real-time** — tidak ada cache delay > 60 detik (gunakan cache invalidation via event, bukan TTL panjang).

### 1.2 Kategori & Subkategori

- Tabel `categories` **self-referencing** (`parent_id` nullable) — mendukung hierarki N-level (Kategori → Subkategori → Sub-subkategori), meski UI default hanya expose 2 level (Kategori & Subkategori) untuk kesederhanaan toko grosir.
- Setiap kategori punya `image`, `icon`, `is_active`, `display_order` (untuk urutan tampil di storefront).
- Kategori tidak bisa dihapus jika masih punya produk aktif — harus dipindah/nonaktifkan dulu.

### 1.3 Brand

- Tabel `brands` sederhana: `name`, `logo`, `description`, `is_active`.
- Dipakai untuk filter di storefront dan pelaporan performa per brand.

### 1.4 Satuan & Konversi (Unit of Measure — UOM)

Ini adalah salah satu **fitur paling kritikal** untuk toko grosir. Struktur:

- Tabel `units`: master satuan (Pcs, Lusin, Renteng, Pack, Dus, Karton, Kg, Liter, dst) dengan `symbol` dan `is_base_unit` (boolean, hanya berlaku sebagai flag informatif — status "basis" sebenarnya ditentukan per produk).
- Tabel `product_units` (pivot per produk): 
  - `product_id`, `unit_id`, `conversion_qty` (berapa satuan dasar dalam 1 unit ini), `barcode` (opsional, tiap level satuan bisa punya barcode sendiri — misal barcode dus beda dari barcode pcs), `is_purchase_unit` (default untuk pembelian), `is_sales_unit` (boleh dijual dalam satuan ini).
  - Contoh data: Produk "Indomie Goreng" base unit = Pcs.
    - 1 Renteng = 40 Pcs
    - 1 Dus = 480 Pcs (12 renteng)
- **Konversi otomatis saat transaksi**: Saat kasir/gudang input qty dalam satuan apa pun (Dus/Renteng/Pcs), sistem otomatis mengonversi ke satuan dasar untuk update stok (`stok_pcs = stok_pcs ± (qty_input × conversion_qty)`), dan **harga per satuan dihitung otomatis proporsional** kecuali ada harga override manual per satuan (lihat §1.5).
- Validasi: `conversion_qty` harus > 0; tidak boleh ada 2 unit dengan `conversion_qty` sama persis kecuali sengaja (warning, bukan block).

### 1.5 Harga & Margin (Multi-Price Engine)

Tabel `product_prices` menyimpan **banyak baris harga per produk**, dengan kombinasi field berikut:

| Field | Keterangan |
|---|---|
| `product_id`, `unit_id` | Harga spesifik per kombinasi produk+satuan |
| `price_type` | enum: `retail`, `wholesale_tier`, `member`, `reseller`, `promo` |
| `min_qty`, `max_qty` | Range kuantitas berlaku (untuk `wholesale_tier`) — nullable untuk tipe non-tier |
| `customer_group_id` | FK nullable, untuk `member`/`reseller` — dikaitkan ke grup pelanggan tertentu |
| `price` | decimal(15,2) (wajib) |
| `valid_from`, `valid_until` | nullable, untuk harga promo bertenggat waktu |
| `channel` | enum(`pos`,`online`,`both`), default `both` | Harga bisa berbeda POS vs online |
| `is_active` | boolean |

**Algoritma Resolusi Harga (Price Resolution — urutan prioritas, exact-match-first):**

1. Jika ada harga `promo` aktif (dalam rentang `valid_from`–`valid_until`) yang cocok channel & qty → **pakai ini, harga tertinggi prioritas.**
2. Jika pelanggan tergolong `customer_group` (member/reseller) dan ada harga `member`/`reseller` yang cocok → pakai ini.
3. Jika ada harga `wholesale_tier` yang qty pembelian jatuh di antara `min_qty`–`max_qty` → pakai tier dengan `min_qty` **tertinggi yang masih ≤ qty** (exact-match-first: cari range paling spesifik/tertinggi dulu).
4. Fallback ke harga `retail` unit yang dipilih.
5. Jika tidak ada harga sama sekali untuk unit tersebut → hitung proporsional dari harga `retail` satuan dasar × `conversion_qty` (dengan flag warning di UI admin bahwa harga ini "harga kalkulasi", bukan harga eksplisit).

- **Margin & HPP**: `margin = price_retail - hpp_current`, `margin_percent = margin / hpp_current * 100`. Ditampilkan di form produk (read-only, computed) untuk membantu admin set harga jual yang sehat. Sistem bisa memberi **warning visual** jika `price_retail < hpp_current` (jual rugi) saat admin set harga atau saat transaksi POS (kasir dengan permission terbatas tidak bisa override harga di bawah HPP tanpa approval).

### 1.6 Batch, Expired Date, Serial Number

- Tabel `product_batches`: `product_id`, `warehouse_id`, `batch_number`, `expiry_date` (nullable jika `track_expiry=false`), `qty_in`, `qty_remaining`, `hpp_batch` (untuk FIFO), `received_at`, `barang_masuk_detail_id` (link ke sumber masuknya batch ini).
- Tabel `product_serials`: `product_id`, `serial_number` (unique), `status` (enum: `in_stock`, `sold`, `returned`, `damaged`), `warehouse_id`, `sold_in_transaction_id` (nullable).
- **Business rule expiry**: Sistem menjalankan scheduled job harian (`CheckExpiringProductsJob`) yang mem-flag produk dengan `expiry_date` mendekati (misal H-30, H-7, H-1, konfigurasi bisa disetel per kategori) dan mengirim notifikasi ke admin/owner. Produk expired otomatis dikeluarkan dari `sellable_online` (tidak otomatis dari POS, karena bisa jadi ada kebijakan diskon habiskan stok — keputusan tetap di admin, sistem hanya alert).
- **FIFO enforcement**: Saat penjualan produk dengan `track_batch=true` dan `costing_method=FIFO`, sistem otomatis memotong stok dari batch dengan `expiry_date` terdekat / `received_at` terlama dulu (konfigurasi FEFO — First Expired First Out — sebagai varian FIFO yang lebih relevan untuk barang grosir; default: FEFO jika `track_expiry=true`, murni FIFO jika tidak).

---

## 2. MODUL POS (POINT OF SALE) — ENTERPRISE GRADE

### 2.1 Input & Scanning

- **Scan Barcode**: Input via hardware scanner (keyboard emulation) atau kamera HP (library `@zxing/browser` atau `html5-qrcode` di frontend). Scan barcode dari `product_barcodes` ATAU `product_units.barcode` (barcode per level satuan) — sistem otomatis mendeteksi satuan berdasarkan barcode yang di-scan.
- **Scan QR**: QR code internal (label rak/produk) untuk lookup cepat tanpa harus tahu barcode pabrik.
- **Keyboard Shortcut**: Wajib untuk kasir desktop cepat — contoh: `F2` cari produk, `F4` diskon item, `F6` bayar, `F8` park bill, `Esc` batal item, angka+`*` untuk qty cepat (`3*` lalu scan = qty 3). Daftar lengkap shortcut didefinisikan di `06-frontend-webapp.md` §6.
- **Touch-Friendly**: Semua tombol POS minimal 44×44px touch target (mengikuti guideline mobile), grid produk visual dengan gambar (mirip referensi desain BrightPOS yang dilampirkan user).

### 2.2 Alur Transaksi & Pembayaran

- **Split Payment**: 1 transaksi bisa dibayar dengan kombinasi metode (misal Rp50.000 cash + sisanya QRIS). Tabel `sale_payments` (1-N terhadap `sales`) menyimpan tiap metode & nominal.
- Metode pembayaran didukung: `cash`, `qris`, `bank_transfer`, `e_wallet`, `debit_card`, `credit_card`, `piutang` (kasbon/tempo pelanggan), `points` (bayar sebagian dengan loyalty point).
- **Piutang (Customer Debt/Tempo)**: Jika pelanggan (harus pelanggan terdaftar dengan `customer_id`, bukan guest) memilih bayar sebagian/seluruhnya dengan tempo, sistem mencatat di tabel `receivables` (piutang usaha) dengan jatuh tempo, dan **transaksi tetap dianggap "lunas" secara stok** (barang tetap keluar) tapi status finansial `partially_paid`/`unpaid`.
- **Hutang (ke Supplier)**: Dicatat otomatis dari modul Barang Masuk (lihat §4), bukan dari POS.
- **Park Bill / Suspend Transaction**: Kasir bisa menahan transaksi (misal pelanggan lupa bawa uang, atau ada antrian) → transaksi disimpan dengan status `parked`, keranjang tersimpan utuh, kasir bisa lanjut transaksi lain. **Resume Bill**: ambil kembali transaksi yang di-park dari daftar.
- **Retur, Refund, Tukar (Exchange)**:
  - Retur: pelanggan kembalikan barang, sistem kembalikan stok (kecuali ditandai rusak), butuh referensi ke `sale_id` asal.
  - Refund: pengembalian uang — bisa cash atau non-cash (saldo/point).
  - Exchange: retur + penjualan baru dalam 1 alur (barang A ditukar barang B), dicatat sebagai 2 transaksi terhubung (`exchange_group_id`).
  - **Approval**: Retur/refund di atas nominal tertentu (configurable, default Rp100.000) butuh approval Admin/Owner (permission `pos.retur.approve`), tidak bisa dieksekusi kasir biasa sendirian.

### 2.3 Diskon & Promo (lihat detail lengkap engine promo di §3)

- Diskon per-item (di level baris keranjang) dan diskon global (di level total transaksi) — keduanya bisa nominal (Rp) atau persentase (%).
- Kasir dengan permission terbatas punya **batas maksimum diskon manual** (misal maks 10% tanpa approval, lebih dari itu perlu approval Admin — role-based limit disimpan di `permission` atau tabel `discount_limits` per role).

### 2.4 Shift Kasir & Cash Management

- **Opening Shift**: Kasir input `modal_awal` (starting cash) sebelum mulai transaksi. Tabel `cashier_shifts`: `user_id`, `store_location_id`, `opening_balance`, `opening_at`, `closing_balance_system` (dihitung otomatis dari transaksi), `closing_balance_actual` (dihitung manual oleh kasir saat closing), `selisih_kas` (`closing_balance_actual - closing_balance_system`), `closing_at`, `status` (`open`/`closed`), `notes`.
- **Cash Drawer**: Setiap transaksi cash tercatat menambah/mengurangi expected cash in drawer. Sistem mendukung pencatatan `cash_in`/`cash_out` manual di luar transaksi (misal ambil kas untuk kembalian tambahan, atau setor kas ke brankas) via tabel `cash_movements`.
- **Closing Shift**: Kasir wajib input hitungan fisik kas di laci → sistem hitung **selisih kas** otomatis dan wajib beri catatan alasan jika selisih ≠ 0. Selisih signifikan (di atas threshold) trigger notifikasi ke Admin/Owner.
- **Multi Kasir**: Beberapa kasir bisa aktif bersamaan (multi device/multi lokasi), masing-masing dengan shift independen. 1 device kasir bisa dipakai bergantian oleh kasir berbeda (login/logout per shift, bukan device-bound).
- **Audit Log**: Setiap aksi sensitif POS (void transaksi, edit harga manual, diskon di atas limit, buka laci tanpa transaksi/"no-sale") dicatat ke `audit_logs` dengan `actor_id`, `action`, `before/after` snapshot (JSON), `ip_address`, `device_info`.

### 2.5 Cetak Struk & Dokumen

- Cetak nota thermal (58mm/80mm) via `window.print()` dengan CSS khusus print, atau integrasi ESC/POS driver untuk printer thermal via WebUSB/WebBluetooth (opsional fase lanjutan). Format struk minimal: nama toko, tanggal/jam, no. transaksi, kasir, daftar item+qty+harga, subtotal, diskon, pajak (jika ada), total, metode bayar, kembalian, footer custom.

---

## 3. MODUL PROMO & DISKON ENGINE (Tambahan dari SKPL — Best Practice)

Ini modul yang **tidak eksplisit ada di SKPL** tapi wajib ada untuk kelas enterprise.

### 3.1 Tipe Promo

| Tipe | Deskripsi | Contoh |
|---|---|---|
| **Diskon Item** | Diskon langsung ke produk tertentu | Sabun Mandi diskon 10% |
| **Diskon Kategori** | Diskon ke seluruh produk dalam kategori | Semua Minuman diskon 5% |
| **Voucher/Kode Promo** | Kode yang diinput pelanggan (online) atau kasir (POS) | Kode `HEMAT10` = diskon Rp10.000 min. belanja Rp100.000 |
| **Bundling** | Paket beberapa produk dengan harga khusus jika dibeli bersamaan | Beli Kopi+Gula+Krimer = Rp25.000 (harga normal Rp30.000) |
| **Buy X Get Y (BXGY)** | Beli produk A sejumlah X, dapat produk B (bisa sama/beda) gratis/diskon | Beli 2 Mie Instan gratis 1 |
| **Cashback** | Pengembalian sebagian uang dalam bentuk saldo/point, bukan diskon langsung di struk | Belanja min Rp50.000 cashback Rp5.000 (masuk saldo member) |
| **Loyalty Point** | Poin akumulasi dari transaksi, bisa ditukar jadi diskon/produk | Rp10.000 belanja = 1 poin, 100 poin = diskon Rp10.000 |

### 3.2 Struktur Data Promo

- Tabel `promotions`: `name`, `type` (enum sesuai §3.1), `start_date`, `end_date`, `channel` (`pos`/`online`/`both`), `is_active`, `priority` (urutan resolusi jika ada promo bertumpuk), `usage_limit_total` (nullable), `usage_limit_per_customer` (nullable), `min_purchase_amount` (nullable), `applicable_scope` (`all`/`category`/`product`/`brand`), `created_by`.
- Tabel `promotion_conditions`: kondisi spesifik per promo (produk/kategori mana yang berlaku, qty minimum, dsb) — desain generik dengan `conditionable_type`/`conditionable_id` (polymorphic) agar fleksibel menambah tipe kondisi baru tanpa migrasi.
- Tabel `promotion_rewards`: hasil promo (diskon nominal/persen, produk gratis, cashback amount, point multiplier).
- Tabel `promotion_usages`: histori pemakaian promo per transaksi/pelanggan (untuk enforce `usage_limit`).
- Tabel `vouchers`: kode voucher spesifik (relasi ke `promotions`, punya `code` unique, bisa generate massal untuk campaign).

### 3.3 Business Rules Promo

- **Stacking Rule**: Default, HANYA 1 promo tipe "diskon" boleh berlaku per item (yang paling menguntungkan pelanggan / prioritas tertinggi menang), TAPI loyalty point earning tetap jalan terlepas dari promo diskon lain (point dihitung dari nilai akhir setelah diskon). Aturan stacking harus configurable per promo (`is_stackable` boolean).
- **Validasi real-time**: Saat kasir/pelanggan apply voucher, sistem validasi: masih dalam periode aktif, belum melebihi `usage_limit`, memenuhi `min_purchase_amount`, channel sesuai.
- **Loyalty Point**: Tabel `customer_points` (ledger, bukan hanya saldo — setiap transaksi masuk/keluar point tercatat sebagai baris terpisah untuk audit, mirip `stock_ledger`). Poin punya `expiry_date` opsional (kebijakan kadaluwarsa poin, configurable).

---

## 4. MODUL INVENTORY & SUPPLY CHAIN

### 4.1 Barang Masuk (Purchasing & Receiving)

- **Purchase Order (PO)** — opsional tapi direkomendasikan sebagai best practice: Admin bisa buat PO ke supplier dulu (`purchase_orders`, status: `draft`→`sent`→`partially_received`→`completed`→`cancelled`) sebelum barang benar-benar datang. SKPL hanya mensyaratkan pencatatan langsung saat barang datang (tanpa PO) — sistem enterprise ini **mendukung keduanya**: (a) direct stock-in tanpa PO (untuk kasus mendadak/kulakan pasar), dan (b) stock-in dari PO (untuk pembelian terjadwal ke supplier tetap).
- **Receiving (Barang Masuk aktual)**: Tabel `stock_in` (header) + `stock_in_details` (baris per produk): `supplier_id`, `warehouse_id`, `po_id` (nullable), `invoice_number`, `qty` (dalam satuan pembelian, otomatis dikonversi ke satuan dasar), `unit_id`, `purchase_price_total`, `batch_number`/`expiry_date` (jika applicable), `payment_status` (`paid`/`credit`/`partial`).
- **Kalkulasi HPP (WAC)** — sesuai SKPL, formula:
  ```
  Valuasi_Lama = Sisa_Stok_Lama × HPP_Lama
  Valuasi_Baru = Valuasi_Lama + Total_Tagihan_Faktur_Baru
  HPP_Baru = Valuasi_Baru / (Sisa_Stok_Lama + Qty_Masuk_Baru)
  ```
  Dijalankan dalam **database transaction (locking)** untuk mencegah race condition jika ada 2 barang masuk bersamaan untuk produk yang sama.
- **Supplier Return (Retur ke Supplier)**: Jika barang dari supplier cacat/salah kirim, dicatat di `supplier_returns`, mengurangi stok & mengurangi hutang ke supplier (atau menambah piutang ke supplier jika sudah lunas).

### 4.2 Barang Keluar (Non-Sales)

Selain keluar karena penjualan (POS/online), stok bisa berkurang karena:
- **Waste** (barang terbuang/kadaluwarsa)
- **Damaged Goods** (rusak)
- **Lost Goods** (hilang, misal karena pencurian/human error)
- **Internal Use** (dipakai internal toko, bukan dijual)

Semua ini dicatat di tabel `stock_out_adjustments` dengan `reason_type` (enum di atas), `notes` wajib diisi, dan butuh approval Admin/Owner (permission `inventory.adjustment.approve`) karena berdampak pada laporan laba rugi (kerugian).

### 4.3 Transfer Gudang (Stock Transfer)

- Tabel `stock_transfers` (header) + `stock_transfer_details`: `from_warehouse_id`, `to_warehouse_id`, `status` (`draft`→`in_transit`→`received`→`cancelled`), `requested_by`, `approved_by`, `received_by`.
- Stok dikurangi dari gudang asal saat status `in_transit`, ditambahkan ke gudang tujuan saat status `received` (bukan langsung, untuk merepresentasikan barang "dalam perjalanan" secara akurat, terutama jika multi-cabang).

### 4.4 Stock Opname (Stock Audit)

- Tabel `stock_opnames` (header): `warehouse_id`, `scheduled_date`, `status` (`draft`→`in_progress`→`completed`), `conducted_by`.
- Tabel `stock_opname_details`: `product_id`, `system_qty` (snapshot saat opname dibuat), `physical_qty` (hasil hitung fisik, diinput staff — bisa via scan barcode berurutan untuk mempercepat), `variance_qty` (`physical_qty - system_qty`), `variance_value` (`variance_qty × hpp_current`).
- Setelah opname `completed`, sistem otomatis membuat **stock adjustment** untuk menyesuaikan stok sistem ke stok fisik, dengan jejak lengkap di `stock_ledger` (`reference_type = stock_opname`).
- Opname bisa **partial** (hanya kategori/rak tertentu) atau **full** (seluruh gudang) — field `scope_type`/`scope_ids`.

### 4.5 Stock Movement / Stock Ledger (Sumber Kebenaran Stok)

**Ini adalah tabel paling penting di seluruh sistem inventory.** Setiap perubahan stok — dari sumber manapun (penjualan, barang masuk, transfer, opname, retur, waste) — **wajib** menghasilkan 1 baris di `stock_ledger` (immutable, append-only, tidak pernah di-update/delete). Kolom `products.stok_saat_ini` (jika dipakai sebagai cache untuk performa query) **harus selalu bisa direkonstruksi ulang** dari SUM `stock_ledger`. Detail skema di `04-database-schema.md` §5.

---

## 5. MODUL E-COMMERCE (WEBSITE PENJUALAN)

### 5.1 Prinsip Sinkronisasi

- **TIDAK ADA input produk terpisah untuk website.** Produk yang diinput di modul Master Data otomatis tersedia untuk ditampilkan di website, dikontrol murni oleh flag `sellable_online` dan `is_active`.
- **Stok real-time**: Stok yang ditampilkan di halaman produk website = `stok_tersedia` (stok sistem dikurangi qty yang sedang di keranjang orang lain dengan status "reserved" jika sistem menerapkan stock reservation — lihat §5.3) — bukan cache lama.
- **Harga sinkron**: Harga di website mengikuti Price Resolution Engine yang sama (§1.5) dengan `channel = online` atau `both`.
- **Promo sinkron**: Promo dengan `channel = online`/`both` otomatis tampil di website tanpa input ulang.
- **Semua transaksi online otomatis masuk POS & Inventory**: Order online, setelah dibayar/dikonfirmasi, membuat entry yang **identik strukturnya** dengan transaksi POS di tabel `sales`/`sale_items` (dengan `channel = online`), sehingga laporan penjualan, HPP, dan stok terpotong dari sumber yang sama — tidak ada modul pelaporan terpisah untuk online vs offline.

### 5.2 Fitur Storefront

1. **Katalog Produk** — grid/list, filter (kategori, brand, harga, ketersediaan), sort (terlaris, termurah, terbaru), search dengan full-text/relevance (lihat `05-backend-laravel.md` untuk implementasi search).
2. **Detail Produk** — galeri gambar/video, deskripsi, pilihan satuan (dropdown Pcs/Dus/dst dengan harga otomatis update), tabel harga bertingkat (transparan ke pelanggan, misal "beli 1-11 pcs Rp5.000, beli 12+ Rp4.500"), related/upsell/cross-sell product, estimasi stok ("Tersedia" / "Stok Terbatas" / "Pre-Order" / "Habis").
3. **Keranjang Belanja (Cart)** — session-based untuk guest, persisted ke DB untuk user login (agar cart tidak hilang ganti device). Update qty real-time menghitung ulang tiering harga otomatis.
4. **Checkout**:
   - Guest checkout (pakai nomor HP sebagai token tracking, sesuai SKPL) ATAU checkout dengan akun.
   - Alamat pengiriman via GPS/pin lokasi (Leaflet.js + OpenStreetMap, sesuai batasan SKPL — tidak pakai Google Maps berbayar).
   - **Validasi radius pengiriman** — Haversine formula, sesuai SKPL, dari `store_locations` terdekat/utama.
   - Kalkulasi ongkir berdasarkan jarak (tiering jarak: 0-3km Rp5.000, 3-7km Rp10.000, dst — configurable) DAN/ATAU berat/volume total pesanan.
   - Pemilihan metode pembayaran manual (upload bukti transfer) — dengan status `pending_verification` sampai admin/pegawai verifikasi.
   - **Stock reservation** (lihat §5.3).
5. **Pelacakan Pesanan** — via QR code unik / nomor resi, status: `pending_payment` → `payment_verification` → `confirmed` → `preparing` → `ready_for_pickup`/`out_for_delivery` → `completed` → (`cancelled`/`refunded`).
6. **Akun Pelanggan** — registrasi/login terpisah dari back-office (guard `customer` berbeda dari guard `web`/admin), riwayat pesanan, saldo loyalty point, alamat tersimpan (multiple).
7. **Panduan Pemesanan** — halaman statis/CMS untuk onboarding pelanggan baru.

### 5.3 Stock Reservation (Best Practice Tambahan)

Untuk mencegah overselling saat 2 pelanggan checkout produk stok terbatas bersamaan:
- Saat pelanggan mencapai step checkout (bukan sekadar add to cart), sistem membuat **soft reservation** (`stock_reservations` table, `expires_at` misal 15 menit) yang mengurangi `stok_tersedia` yang ditampilkan tapi TIDAK mengurangi `stok_ledger` sungguhan.
- Jika checkout tidak selesai dalam waktu reservasi, reservation expired otomatis dilepas (scheduled job `ReleaseExpiredReservationsJob`).
- Stok baru benar-benar terpotong (masuk `stock_ledger`) saat order `confirmed` (pembayaran terverifikasi).

### 5.4 Landing Page & CMS

- Halaman: **Home** (hero banner, produk unggulan, kategori pilihan, promo aktif), **About** (profil toko), **Catalog** (redirect ke katalog produk), **Promo** (daftar promo aktif), **Blog** (opsional, artikel/tips — tabel `blog_posts` dengan CMS sederhana), **FAQ** (tabel `faqs`, kategori pertanyaan), **Contact** (form kontak + peta lokasi toko).
- **CMS sederhana**: Admin bisa edit konten halaman statis (hero banner, teks About, FAQ) dari back-office tanpa perlu developer — tabel `cms_pages`/`cms_sections` dengan struktur JSON fleksibel per blok konten (bukan hardcode di frontend).

---

## 6. MODUL HR & OPERASIONAL — ABSENSI

### 6.1 Absensi dengan Foto + Geolocation + Timestamp (Requirement Khusus Owner)

Ini **memperluas** SKPL yang awalnya hanya scan barcode. Requirement tambahan dari pemilik:

- Pegawai membuka menu Absensi di HP (bagian dari aplikasi PWA/back-office mobile).
- Sistem **mewajibkan akses kamera** (bukan upload dari galeri — kamera live capture saja, untuk cegah foto lama/rekayasa) via `<input type="file" accept="image/*" capture="user">` atau custom camera component dengan `getUserMedia` API untuk kontrol penuh (lebih disarankan agar bisa overlay watermark sebelum capture & block galeri sepenuhnya).
- Sistem **mewajibkan akses GPS** (`navigator.geolocation.getCurrentPosition`) — pegawai harus izinkan lokasi, tidak bisa lanjut tanpa izin.
- **Watermark otomatis** di-render di atas foto (canvas overlay) berisi: tanggal, jam (real-time dari **server**, bukan device, untuk cegah manipulasi jam HP), dan koordinat lokasi (lat/long + alamat hasil reverse geocoding jika tersedia).
- **Auto-match lokasi**: Sistem membandingkan koordinat GPS pegawai vs koordinat `store_locations` (radius toleransi configurable, misal 100 meter). Jika di luar radius → absensi **ditolak** dengan pesan jelas ("Anda berada di luar radius toko, hubungi admin"), KECUALI role tertentu diberi pengecualian (misal pegawai delivery — permission `attendance.remote.allowed`).
- **Immutable**: Setelah foto+data absensi tersimpan (`attendances` table), **tidak ada endpoint edit** untuk foto/timestamp/koordinat. Jika ada kesalahan, hanya Admin/Owner yang bisa menambah **catatan koreksi terpisah** (`attendance_corrections` table, tetap menyimpan data asli, bukan menimpa) — mirip prinsip accounting "tidak menghapus jurnal, buat jurnal koreksi".
- Data tersimpan: `employee_id`, `photo_path` (S3), `captured_at_server` (timestamp server, sumber kebenaran), `captured_at_device` (timestamp device, untuk deteksi anomali jika berbeda jauh dari server time → flag mencurigakan), `latitude`, `longitude`, `accuracy_meters`, `matched_store_location_id`, `distance_from_store_meters`, `type` (`check_in`/`check_out`), `device_info` (user agent, untuk audit).
- Tetap mendukung mode **kiosk scan barcode** (sesuai SKPL asli) sebagai alternatif di lokasi tertentu (misal monitor di pintu masuk untuk gudang), field `attendance_method` (enum: `photo_geo`, `barcode_kiosk`) membedakan sumbernya.

### 6.2 Manajemen Pegawai

- Data pegawai: profil, role/jabatan, tanggal masuk kerja, status aktif, `store_location_id` penempatan, riwayat gaji dasar (opsional, jika payroll sederhana diaktifkan — lihat `10-roadmap-task-breakdown.md` untuk penentuan fase ini in-scope atau tidak).

---

## 7. MODUL ACCOUNTING SEDERHANA (Simple Finance)

Tidak menggantikan software akuntansi penuh (Accurate/Jurnal), tapi cukup untuk kebutuhan pemilik toko memantau kesehatan bisnis:

### 7.1 Komponen

- **HPP**: Sudah otomatis dari stock ledger (§4.5), agregat per periode untuk laporan laba rugi.
- **Laba Rugi (Profit & Loss)**: Laporan otomatis dari `Pendapatan (total penjualan) - HPP - Beban Operasional`, per periode (harian/mingguan/bulanan).
- **Pendapatan**: Otomatis dari `sales` (POS + Online).
- **Pengeluaran (Expenses)**: Input manual kategori beban (listrik, gaji, sewa, dll) — tabel `expenses` dengan `category_id`, `amount`, `date`, `notes`, `attachment` (bukti/struk).
- **Kas (Cash) & Bank**: Tabel `cash_accounts` (multi-akun: Kas Toko, Bank BCA, dst), setiap transaksi kas (penjualan cash, pengeluaran, setor bank) tercatat sebagai mutasi di `cash_movements` (relasi ke akun terkait).
- **Piutang (Receivables)**: Dari POS tempo pelanggan (§2.2) — tracking status lunas/belum, jatuh tempo, reminder.
- **Hutang (Payables)**: Dari Barang Masuk kredit ke supplier (§4.1) — tracking status lunas/belum, jatuh tempo.
- **Jurnal Sederhana**: Tabel `journal_entries` (header) + `journal_entry_lines` (debit/kredit per akun) — **di-generate otomatis** dari setiap transaksi (penjualan, barang masuk, pengeluaran) mengikuti mapping akun standar (Chart of Accounts sederhana: Kas, Bank, Piutang, Hutang, Persediaan, Pendapatan Penjualan, HPP, Beban Operasional, Modal). Ini untuk kebutuhan audit dasar double-entry, bukan modul akuntansi penuh dengan multi-currency/consolidation.

### 7.2 Business Rule

- Semua modul finance ini bersifat **derived/generated**, bukan input manual duplikat — mis. admin tidak perlu input "penjualan hari ini Rp X" secara manual ke laporan, karena laporan dihitung dari data transaksi asli. Input manual HANYA untuk `expenses` (beban operasional yang memang tidak otomatis dari sistem).

---

## 8. LAPORAN & ANALITIK (Cross-Cutting)

| Laporan | Sumber Data | Filter |
|---|---|---|
| Laporan Penjualan | `sales`, `sale_items` | Periode, kasir, channel (POS/online), kategori |
| Laporan Stok | `stock_ledger`, `products` | Gudang, kategori, status (low stock, expiring) |
| Laporan Supplier | `stock_in`, `payables` | Supplier, periode |
| Laporan Keuntungan | `sales` + HPP dari `stock_ledger` | Periode, produk, kategori |
| Laporan Kasir/Shift | `cashier_shifts`, `cash_movements` | Kasir, periode, selisih kas |
| Dashboard Owner | Agregat semua di atas | Real-time widget: total income, expense, net profit, total orders, top selling products, payment method breakdown, low stock alert, active cashiers — **sesuai referensi desain BrightPOS yang dilampirkan** |

Detail struktur query & endpoint di `05-backend-laravel.md` §7 (Reporting Service Pattern).
