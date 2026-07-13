# 01. Product Overview & Vision — Sistem Retail Enterprise Toko Grosir Putera Kembar

> **Dokumen ini adalah pintu masuk utama.** Baca file ini terlebih dahulu sebelum membaca dokumen lain. File lain (02-10) merujuk balik ke dokumen ini untuk konteks bisnis.
>
> **Audiens**: AI coding agent (Antigravity), developer manusia, QA, dan siapa pun yang meng-onboard proyek ini.

---

## 1. Latar Belakang & Konteks Bisnis

Sistem ini dibangun untuk **satu toko grosir fisik** (Toko Grosir Putera Kembar, Pekanbaru) yang saat ini beroperasi manual/semi-manual. Referensi kebutuhan awal berasal dari dokumen SKPL akademik (lihat `SKPL_Toko_Putera_Kembar.docx`), namun dokumentasi teknis ini **memperluas** SKPL tersebut ke level enterprise dengan menambahkan modul yang belum ada di SKPL (promo/diskon lengkap, accounting sederhana, loyalty, multi-gudang, dsb) mengikuti best practice sistem seperti Majoo, Moka POS, Jubelio, iReap, Odoo, dan NetSuite.

### 1.1 Prinsip Desain Utama (Non-Negotiable)

1. **Single-tenant sekarang, multi-tenant-ready secara arsitektur.** Sistem hanya melayani 1 toko (dengan kemungkinan multi-cabang/multi-gudang) saat ini, TAPI setiap tabel, service, dan permission harus dirancang seolah-olah `tenant_id` / `store_id` akan ditambahkan di masa depan tanpa migrasi besar-besaran. Lihat `03-solution-architecture.md` §2 untuk strategi konkret.
2. **Satu sumber kebenaran data (Single Source of Truth).** Produk, harga, stok, dan promo diinput SEKALI di back-office/inventory dan otomatis tersinkron ke POS dan Website (bukan sinkronisasi manual/batch, tapi *real-time write* ke tabel yang sama, dengan flag visibilitas per channel).
3. **Channel-aware, bukan channel-duplicated.** Tidak ada duplikasi data produk untuk POS vs Online. Yang membedakan hanyalah flag (`is_active`, `sellable_pos`, `sellable_online`) dan aturan harga per channel.
4. **Mobile-first untuk operasional.** Pegawai menggunakan HP pribadi sebagai alat kerja utama (kasir, stock opname, terima barang, retur, absensi). Desktop back-office tetap ada untuk owner/admin, tapi seluruh flow operasional harus dirancang mobile-native dari awal, bukan hasil "responsive belakangan".
5. **Auditability di atas segalanya.** Setiap transaksi finansial (penjualan, stok, kas) harus punya jejak audit yang tidak bisa dihapus (soft-delete + audit log + immutable history table). Ini sistem uang nyata milik pemilik toko sendiri — human error dan potensi kecurangan pegawai adalah risiko nyata yang harus dimitigasi secara sistem, bukan hanya prosedural.
6. **Precision matters.** Semua nilai uang dan kuantitas menggunakan tipe data desimal presisi tinggi (bukan float). Lihat `04-database-schema.md` §1.3.

### 1.2 Yang Membedakan dari SKPL Akademik

| Area | SKPL Akademik | Sistem Enterprise Ini |
|---|---|---|
| Promo/Diskon | Tidak eksplisit dibahas | Promo engine lengkap: diskon per-item, diskon global, voucher, bundling, Buy X Get Y, cashback, loyalty point |
| Payment Gateway | Manual transfer only | Manual transfer (default) + arsitektur siap plug-in Midtrans/Xendit di masa depan (interface `PaymentGatewayContract`) |
| Accounting | Tidak ada | Accounting sederhana: HPP, laba rugi, kas/bank, piutang/hutang, jurnal dasar |
| Gudang | Implisit 1 lokasi | Multi-gudang/multi-rak dengan stock movement & transfer antar gudang |
| Harga | Harga bertingkat by kuantitas | Ditambah: harga member, harga reseller, harga promo, margin tracking |
| POS | POS dasar | POS enterprise: shift kasir, cash drawer, park/resume bill, split payment, retur/tukar |
| Attendance | Scan barcode kartu ID | Scan barcode/QR **+ foto wajah dengan watermark timestamp+geolocation, auto-match lokasi toko**, tidak bisa diedit (lihat `08-security.md` §7) |
| Frontend Stack | Tidak dispesifikasikan penuh | Laravel 13 + Inertia.js + React + TypeScript + shadcn/ui + TanStack Query |

---

## 2. Modul Sistem (Module Map)

Sistem dibagi menjadi **6 domain besar**, masing-masing dijelaskan detail di dokumen terpisah:

```
┌─────────────────────────────────────────────────────────────────────┐
│                        SISTEM RETAIL ENTERPRISE                      │
├───────────────┬───────────────┬───────────────┬─────────────────────┤
│  1. MASTER     │  2. INVENTORY │  3. SALES      │  4. E-COMMERCE      │
│     DATA       │     & SUPPLY  │     (POS)      │     & LANDING PAGE  │
│  - Produk      │  - Barang     │  - Kasir       │  - Katalog Online   │
│  - Kategori    │    Masuk      │  - Shift       │  - Cart & Checkout  │
│  - Brand       │  - Stock      │  - Split       │  - Order Tracking   │
│  - Supplier    │    Opname     │    Payment     │  - Landing Page/CMS │
│  - Gudang/Rak  │  - Transfer   │  - Retur       │  - PWA Mobile       │
│  - Satuan &    │    Gudang     │  - Promo       │                     │
│    Konversi    │  - Batch/Exp  │    Engine      │                     │
├───────────────┼───────────────┼───────────────┼─────────────────────┤
│  5. HR & OPS   │  6. FINANCE   │  CROSS-CUTTING: Auth, RBAC,        │
│  - Pegawai     │     (Simple   │  Audit Log, Notification,          │
│  - Absensi     │     Accounting)│  Reporting/Analytics Dashboard     │
│    (Geo+Foto)  │  - Kas/Bank   │                                     │
│  - Payroll     │  - Piutang/   │                                     │
│    dasar (opt) │    Hutang     │                                     │
└───────────────┴───────────────┴───────────────┴─────────────────────┘
```

### 2.1 Peta Dokumen ke Modul

| Dokumen | Modul yang Dibahas |
|---|---|
| `02-features-business-rules.md` | Detail fitur & business rule SEMUA modul di atas |
| `03-solution-architecture.md` | Arsitektur sistem, multi-tenant strategy, integrasi antar modul |
| `04-database-schema.md` | ERD & skema tabel semua modul |
| `05-backend-laravel.md` | Implementasi backend Laravel untuk semua modul |
| `06-frontend-webapp.md` | Implementasi frontend React/Inertia untuk back-office, POS, & storefront |
| `07-uiux-design-system.md` | Design system lintas semua antarmuka |
| `08-security.md` | Keamanan lintas semua modul |
| `09-devops-infra-qa.md` | Infrastruktur, deployment, testing lintas semua modul |
| `10-roadmap-task-breakdown.md` | Breakdown task implementasi per modul, per sprint |

---

## 3. Aktor & Peran Pengguna (Roles)

Sistem menggunakan **Role-Based Access Control (RBAC)** dengan permission granular (bukan hanya role tetap), agar mudah menambah role baru (mis. "Kepala Gudang") tanpa ubah struktur.

| Role | Deskripsi | Akses Utama |
|---|---|---|
| **Owner** | Pemilik toko, akses penuh | Semua modul, termasuk laporan keuangan & audit log |
| **Admin/Manager** | Pengelola operasional harian | Semua modul operasional, TIDAK bisa ubah setting sistem inti atau hapus audit log |
| **Kasir (Cashier)** | Pegawai yang melayani transaksi POS | POS, retur (dengan approval), lihat stok, absensi diri sendiri |
| **Staff Gudang (Warehouse Staff)** | Mengelola stok fisik | Barang masuk, stock opname, transfer gudang, TIDAK bisa akses POS/finance |
| **Staff Online/Fulfillment** | Menyiapkan pesanan online | Order management, update status pesanan, scan QR pengambilan |
| **Customer (Registered)** | Pelanggan terdaftar di website | Storefront, cart, checkout, riwayat pesanan, akun |
| **Customer (Guest)** | Pelanggan tanpa akun | Storefront, checkout via token nomor HP |
| **Kiosk/Scanner Device** | Perangkat absensi di pintu masuk | Hanya endpoint absensi (scoped token khusus) |
| **Super Admin (future/system)** | Untuk kebutuhan multi-tenant di masa depan | Reserved role, tidak dipakai saat ini tapi struktur permission sudah mengakomodasi |

> **Catatan implementasi**: Gunakan package `spatie/laravel-permission` untuk role & permission granular (`produk.create`, `produk.edit`, `pos.retur.approve`, `finance.view`, dst). Role hanyalah kumpulan permission yang bisa dikustomisasi owner dari UI — **jangan hardcode logic berdasarkan nama role** di controller/service, selalu cek permission. Detail lengkap di `08-security.md` §2.

---

## 4. Tujuan Bisnis & Success Metrics

| Tujuan | Metrik Sukses |
|---|---|
| Menghilangkan kesalahan hitung harga grosir manual | 0% selisih harga vs aturan tiering |
| Mempercepat transaksi kasir | Rata-rata transaksi POS < 30 detik/item scan |
| Modal (HPP) selalu akurat real-time | HPP ter-update otomatis di setiap barang masuk, tidak ada input manual HPP |
| Mengurangi kebocoran integritas kasir (selisih kas, absensi palsu) | Selisih kas per shift tercatat & ter-audit; absensi tidak bisa dipalsukan (foto+GPS+timestamp immutable) |
| Meningkatkan penjualan online | Website + PWA installable, checkout < 3 langkah |
| Pemilik bisa memantau bisnis kapan saja | Dashboard real-time dari HP pemilik |

---

## 5. Glosarium Istilah Kunci

| Istilah | Arti |
|---|---|
| **SKU** | Stock Keeping Unit — kode unik internal per produk/varian |
| **HPP** | Harga Pokok Penjualan (Cost of Goods Sold) |
| **WAC** | Weighted Average Cost — metode kalkulasi HPP berbasis rata-rata tertimbang |
| **FIFO** | First In First Out — metode kalkulasi HPP/stok berbasis batch masuk pertama keluar pertama |
| **Satuan Dasar** | Unit terkecil produk yang dipakai sebagai basis stok (misal: Pcs) |
| **Konversi Satuan** | Aturan konversi antar satuan (1 Dus = 12 Lusin = 144 Pcs) |
| **Tiered Pricing** | Harga bertingkat berdasarkan kuantitas/tipe pembeli |
| **Stock Opname** | Proses pencocokan stok sistem vs stok fisik |
| **Park Bill / Suspend Transaction** | Menahan transaksi POS sementara untuk melayani pelanggan lain |
| **Shift Kasir** | Periode kerja seorang kasir dari opening sampai closing, dengan rekonsiliasi kas |
| **Multi-tenant-ready** | Arsitektur yang siap diperluas melayani banyak toko/organisasi berbeda tanpa refactor besar |
| **Channel** | Saluran penjualan: POS (offline) atau Online (website/PWA) |

---

## 6. Teknologi Utama (Ringkasan — detail di dokumen terkait)

- **Backend**: Laravel 13, PHP 8.4+, MySQL 8, Redis (cache/queue/session), Laravel Queue + Scheduler, REST API
- **Frontend**: React 18+, TypeScript, Inertia.js, Tailwind CSS, shadcn/ui, TanStack Query, React Hook Form + Zod
- **Auth**: Laravel Sanctum (SPA + mobile token support)
- **Storage**: Local filesystem (dev) + S3-compatible object storage (production — untuk foto produk, foto absensi, bukti transfer)
- **Testing**: Pest (utama) + PHPUnit
- **PWA**: Service Worker + Web App Manifest untuk instalasi ke home screen, offline cache terbatas, push notification (Web Push API)

Detail lengkap arsitektur → `03-solution-architecture.md`. Detail backend → `05-backend-laravel.md`. Detail frontend → `06-frontend-webapp.md`.

---

## 7. Roadmap Multi-Tenant (Visi Jangka Panjang — Tidak Dikerjakan Sekarang)

Meskipun **tidak dikerjakan di fase ini**, setiap keputusan desain harus mempertimbangkan jalur berikut agar migrasi di masa depan murah:

1. **Fase 1 (Sekarang)**: Single-store, single-tenant. Kolom `store_id` sudah ada di semua tabel transaksional (default = 1 toko), tapi belum ada UI multi-store.
2. **Fase 2 (Multi-cabang)**: Tambah cabang baru cukup insert row baru di tabel `store_locations`, tanpa migrasi skema. Stok per gudang per cabang sudah didukung sejak awal (`warehouses.store_id`).
3. **Fase 3 (Multi-tenant)**: Tambah kolom `tenant_id` di tabel-tabel inti (dengan default value untuk data existing), tambah global scope Eloquent per tenant, pisahkan billing/subscription. Karena permission, service layer, dan query sudah terbiasa di-scope by `store_id`, menambah layer `tenant_id` di atasnya adalah perluasan, bukan perombakan.

Lihat `03-solution-architecture.md` §2 untuk detail teknis strategi ini.

---

## 8. Cara Menggunakan Dokumentasi Ini (untuk AI Agent)

1. Baca dokumen ini (`01`) untuk konteks bisnis dan peta modul.
2. Baca `02-features-business-rules.md` untuk memahami **apa** yang harus dibangun per fitur (business rule detail).
3. Baca `03-solution-architecture.md` untuk memahami **bagaimana** modul-modul saling terhubung.
4. Baca `04-database-schema.md` sebelum membuat migration apa pun.
5. Baca `05-backend-laravel.md` dan `06-frontend-webapp.md` sebagai referensi pola kode (jangan menyimpang dari konvensi yang ditetapkan).
6. Baca `07-uiux-design-system.md` sebelum membuat komponen UI apa pun.
7. Baca `08-security.md` sebelum implementasi fitur apa pun yang menyentuh auth, data sensitif, atau file upload.
8. Ikuti `10-roadmap-task-breakdown.md` sebagai urutan eksekusi kerja (epic → sprint → task), jangan lompat modul tanpa menyelesaikan dependency-nya.
9. Rujuk `09-devops-infra-qa.md` untuk standar testing setiap task selesai dikerjakan (setiap PR/task wajib disertai test Pest).
