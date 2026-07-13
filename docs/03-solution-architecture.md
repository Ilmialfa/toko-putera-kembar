# 03. Solution Architecture

> Ditulis oleh perspektif Solution Architect & Software Architect. Dokumen ini menjelaskan **bagaimana** sistem disusun secara teknis di level tinggi, sebelum masuk ke detail backend (`05`) dan frontend (`06`).

---

## 1. Gaya Arsitektur

### 1.1 Pilihan: Modular Monolith (bukan Microservices)

Untuk skala 1 toko (dengan potensi multi-cabang), **modular monolith** adalah pilihan tepat — bukan microservices. Alasan:
- Kompleksitas operasional microservices (service discovery, distributed transaction, network latency antar service) tidak sepadan untuk skala ini.
- Modular monolith tetap memberi **batas domain yang jelas** (lihat §3) sehingga bisa dipecah jadi microservices di masa depan JIKA benar-benar dibutuhkan (misal saat multi-tenant skala besar), tanpa menulis ulang business logic dari nol.

### 1.2 Pola Arsitektur Internal: Layered + Domain-Oriented

```
Request (HTTP/Inertia)
   ↓
Route → Middleware (auth, permission, tenant-scope)
   ↓
Controller (HTTP concern only — validasi request, panggil service, return response)
   ↓
Form Request (validasi input)
   ↓
Action / Service Layer (business logic murni, framework-agnostic sebisa mungkin)
   ↓
Repository (opsional, untuk query kompleks/reusable) → Eloquent Model
   ↓
Database (MySQL) / Cache (Redis) / Queue (Redis+Laravel Queue)
```

Detail pola ini (Service/Action/Repository/Policy/Observer) dijabarkan lengkap di `05-backend-laravel.md` §2.

---

## 2. Strategi Multi-Tenant-Ready (Tanpa Over-Engineering di Awal)

Ini adalah keputusan arsitektur paling penting yang diminta owner. Prinsip: **"Design for extension, not for the future you don't need yet."** Kita TIDAK membangun multi-tenancy penuh sekarang (itu buang waktu & kompleksitas untuk 1 toko), tapi kita memastikan struktur berikut ada sejak hari pertama:

### 2.1 Kolom `store_id` di Semua Tabel Transaksional & Master Data yang Relevan

Setiap tabel yang datanya **spesifik per toko** (produk, transaksi, stok, pegawai, pengaturan) WAJIB punya kolom `store_id` (FK ke `store_locations`), meskipun saat ini nilainya selalu `1`. Ini membuat:
- Query pelaporan sudah terbiasa di-scope by store sejak awal → menambah multi-cabang HANYA berarti insert row baru di `store_locations`, tanpa migrasi skema apa pun.
- Menambah `tenant_id` di masa depan (Fase 3, lihat `01-product-overview.md` §7) menjadi **penambahan kolom baru** yang sifatnya independen dari `store_id` (satu tenant bisa punya banyak store), bukan perombakan model data.

### 2.2 Global Query Scope (Laravel)

Buat trait `BelongsToStore` yang di-apply ke model-model relevan, menerapkan **global scope** otomatis (`WHERE store_id = current_store()`), sehingga developer/AI agent **tidak perlu ingat manual** menambahkan filter store di setiap query — human error dicegah di level framework.

```php
trait BelongsToStore
{
    protected static function bootBelongsToStore(): void
    {
        static::addGlobalScope(new StoreScope);
        static::creating(function ($model) {
            if (!$model->store_id) {
                $model->store_id = app(CurrentStoreResolver::class)->id();
            }
        });
    }
}
```

`CurrentStoreResolver` saat ini selalu mengembalikan store default (`1`), tapi di masa depan bisa diganti resolver yang membaca dari session/subdomain/header tanpa mengubah kode yang memakainya (dependency inversion).

### 2.3 Permission & RBAC yang Sudah Store-Aware

Struktur permission (`spatie/laravel-permission`, lihat `08-security.md` §2) dirancang agar 1 user BISA (secara struktur, walau UI belum expose sekarang) punya role berbeda di store berbeda — pivot table permission sudah menyertakan `store_id` nullable sejak awal, agar Fase 2 (multi-cabang, 1 pemilik banyak toko dengan pegawai berbeda) tidak butuh migrasi skema.

### 2.4 Configuration per Store, Bukan Global Config File

Pengaturan yang idealnya beda per toko (jam operasional, radius pengiriman, pajak, template struk, metode pembayaran aktif) disimpan di tabel `store_settings` (key-value per `store_id`), BUKAN di file `.env` atau `config/*.php`. Ini memastikan multi-cabang/multi-tenant di masa depan tidak butuh redeploy aplikasi untuk beda konfigurasi per toko.

### 2.5 Yang SENGAJA TIDAK Dibangun Sekarang (Scope Guard)

Agar AI agent tidak over-engineer dan membuang waktu, berikut yang **eksplisit di luar scope fase ini**:
- UI untuk membuat toko/tenant baru.
- Subdomain/domain routing per tenant.
- Billing/subscription per tenant.
- Data isolation lintas tenant di level database (row-level security penuh) — cukup `store_id` scoping aplikasi.

---

## 3. Batas Domain (Bounded Context) — untuk Struktur Folder Modular

Mengikuti Domain-Driven mindset (tanpa harus full DDD), kode backend diorganisir per domain, bukan per tipe file generik. Domain-domain utama:

| Domain | Tanggung Jawab | Tabel Utama |
|---|---|---|
| `Catalog` | Produk, kategori, brand, satuan, harga | `products`, `categories`, `brands`, `units`, `product_prices` |
| `Inventory` | Stok, gudang, barang masuk/keluar, opname, transfer | `stock_ledger`, `warehouses`, `stock_in`, `stock_opnames`, `stock_transfers` |
| `Sales` | POS, shift kasir, retur | `sales`, `sale_items`, `cashier_shifts`, `sale_payments` |
| `Promotion` | Promo, voucher, loyalty | `promotions`, `vouchers`, `customer_points` |
| `Ecommerce` | Cart, order online, checkout, storefront | `carts`, `orders`, `order_items`, `stock_reservations` |
| `CMS` | Landing page, blog, FAQ | `cms_pages`, `blog_posts`, `faqs` |
| `HR` | Pegawai, absensi | `employees`, `attendances` |
| `Finance` | Kas, bank, piutang, hutang, jurnal | `cash_accounts`, `receivables`, `payables`, `journal_entries` |
| `Identity` | User, role, permission, customer | `users`, `roles`, `permissions`, `customers` |
| `Reporting` | Agregasi lintas domain, dashboard | (read-model, tidak punya tabel sendiri, query lintas domain) |
| `Shared/Core` | Utilities lintas domain: audit log, notification, media upload, store settings | `audit_logs`, `notifications`, `media`, `store_settings`, `store_locations` |

Setiap domain punya folder sendiri berisi Model, Service, Action, Policy, Resource, Request miliknya sendiri — detail struktur folder di `05-backend-laravel.md` §1.

**Aturan integrasi antar domain**: Domain A yang butuh data/aksi dari Domain B **tidak boleh** langsung query model Domain B — harus lewat Service/Action publik Domain B (mis. `Sales` domain memanggil `InventoryService::deductStock()`, bukan langsung `StockLedger::create()`). Ini menjaga agar business rule stok tetap terpusat di satu tempat meskipun dipicu dari banyak domain (POS, Online Order, Opname, dst).

---

## 4. Integrasi Antar Modul (Event-Driven di Titik Kritis)

Menggunakan **Laravel Events & Listeners** untuk titik integrasi yang sifatnya "efek samping", agar domain tetap loosely-coupled:

| Event | Dilempar Oleh | Didengar Oleh (Listener) |
|---|---|---|
| `SaleCompleted` | Sales domain (POS checkout selesai) | `Inventory` (potong stok), `Promotion` (catat pemakaian promo & tambah loyalty point), `Finance` (buat journal entry), `Reporting` (invalidate cache dashboard) |
| `OrderConfirmed` | Ecommerce domain (pembayaran online terverifikasi) | `Inventory` (potong stok, sama seperti SaleCompleted — di-reuse via shared Action), `Notification` (kirim notif WA/email ke pelanggan) |
| `StockInReceived` | Inventory domain | `Finance` (update hutang supplier jika kredit), `Catalog` (update `hpp_current` cache di produk) |
| `AttendanceRecorded` | HR domain | `Notification` (jika di luar radius/anomali, notif ke admin) |
| `StockBelowMinimum` | Inventory domain (dicek via observer saat stok berkurang) | `Notification` (alert dashboard & push notification) |

Event-driven ini juga menjadi titik ekstensi alami untuk fase multi-tenant/multi-channel di masa depan (misal integrasi payment gateway pihak ketiga cukup jadi listener baru dari `OrderConfirmed`, tanpa mengubah domain Ecommerce).

---

## 5. Arsitektur Frontend (Ringkasan — detail penuh di `06`)

- **Inertia.js sebagai jembatan** — tidak ada REST API terpisah untuk kebutuhan halaman internal (back-office/POS/storefront) agar development cepat dan konsisten dengan Laravel routing/validation. **REST API murni (dengan Sanctum token)** disediakan terpisah khusus untuk kebutuhan yang benar-benar butuh API contract (misal jika nanti ada aplikasi mobile native, atau integrasi pihak ketiga) — lihat `05-backend-laravel.md` §6 untuk konvensi API.
- Tiga "aplikasi" React dalam satu codebase, berbagi komponen UI (`shadcn/ui` + design system `07`):
  1. **Back-Office App** (`/admin/*`) — desktop-first tapi responsive, untuk Owner/Admin.
  2. **POS App** (`/pos/*`) — mobile-first & tablet-first, dioptimalkan untuk kasir (termasuk mode kiosk touch-only).
  3. **Storefront App** (`/` publik) — PWA, mobile-first, untuk pelanggan.

---

## 6. Diagram Arsitektur Tingkat Tinggi (Deskripsi Tekstual)

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Back-Office │     │   POS (Web/  │     │  Storefront  │
│  (Desktop)   │     │   Mobile PWA)│     │  (PWA)       │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                     │
       └────────────┬───────┴──────────┬──────────┘
                     │  Inertia.js (SSR-like, shared auth session)
                     ▼
        ┌────────────────────────────────┐
        │     Laravel 13 Application      │
        │  ┌──────────┬──────────┬──────┐ │
        │  │Controller│  Service │Action│ │
        │  ├──────────┴──────────┴──────┤ │
        │  │   Domain Modules (§3)       │ │
        │  ├─────────────────────────────┤ │
        │  │ Events/Listeners │  Queue    │ │
        │  └─────────────────────────────┘ │
        └───────┬──────────────┬───────────┘
                │              │
       ┌────────▼───┐   ┌──────▼───────┐
       │   MySQL 8   │   │  Redis       │
       │ (source of  │   │ (cache,      │
       │  truth)     │   │  queue,      │
       │             │   │  session)    │
       └─────────────┘   └──────────────┘
                │
       ┌────────▼──────────────┐
       │  S3-Compatible Storage │
       │  (foto produk, foto    │
       │   absensi, bukti bayar)│
       └─────────────────────────┘
```

---

## 7. Non-Functional Requirements (NFR)

| Aspek | Target |
|---|---|
| Response time halaman back-office | < 500ms (server processing, belum termasuk network) |
| Response time transaksi POS (checkout) | < 1 detik |
| Concurrent users | Didesain aman untuk puluhan concurrent user (skala 1 toko dengan beberapa kasir + pelanggan online bersamaan); arsitektur cache (Redis) & index database (`04`) memastikan headroom untuk pertumbuhan tanpa refactor |
| Uptime | Target 99.5% (self-hosted/VPS dengan monitoring dasar, lihat `09-devops-infra-qa.md`) |
| Data durability | Backup harian otomatis (lihat `08-security.md` §9) |
| Mobile performance (PWA) | Lighthouse Performance score ≥ 90, First Contentful Paint < 2s pada koneksi 4G |

---

## 8. Keputusan Teknologi & Alasannya (Architecture Decision Records — Ringkas)

| Keputusan | Alasan |
|---|---|
| Laravel 13 + Inertia.js (bukan API + SPA murni) | Development velocity tinggi untuk tim kecil, auth/session/CSRF ditangani Laravel secara native, SEO untuk storefront tetap terjaga (server-rendered pertama kali) |
| MySQL (bukan PostgreSQL) | Familiaritas tim, ekosistem hosting Indonesia lebih umum mendukung MySQL, kebutuhan sistem tidak butuh fitur eksklusif Postgres (JSONB advance, dsb) — meski desain skema tetap kompatibel jika migrasi diperlukan |
| Redis untuk cache+queue+session | Mengurangi jumlah moving parts infrastruktur (1 service untuk 3 kebutuhan) |
| Sanctum (bukan Passport/OAuth2) | Cukup untuk SPA + mobile token sederhana, tidak butuh kompleksitas OAuth2 penuh untuk skala ini |
| shadcn/ui (bukan MUI/AntD) | Komponen yang di-copy ke codebase sendiri (bukan npm dependency berat), mudah dikustomisasi sesuai design system `07`, konsisten dengan Tailwind |
| PWA (bukan native app React Native) | Owner eksplisit meminta pengalaman "seperti aplikasi" tanpa biaya maintenance 2 codebase terpisah (web + native); PWA cukup untuk kebutuhan install-to-homescreen, offline cache terbatas, push notification |
