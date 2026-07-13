# 10. Roadmap & Task Breakdown (Untuk Eksekusi AI Agent)

> Ditulis oleh Product Manager Senior & Scrum Master. Ini adalah **urutan eksekusi kerja** yang harus diikuti AI coding agent (Antigravity) secara berurutan (epic → sprint → task). Setiap task mereferensikan dokumen detail terkait — AI agent wajib membaca dokumen rujukan sebelum mengerjakan task tersebut.
>
> **Definition of Done (DoD) — berlaku untuk SEMUA task di bawah**, kecuali dinyatakan lain:
> 1. Migration + Model + Factory + Seeder (data dummy realistis) dibuat.
> 2. Service/Action/Policy sesuai pola `05-backend-laravel.md`.
> 3. Halaman/komponen frontend sesuai `06-frontend-webapp.md` dan `07-uiux-design-system.md`.
> 4. Minimal 1 Feature test (Pest) untuk business rule utama (`09-devops-infra-qa.md` §4).
> 5. Permission/Policy diterapkan (`08-security.md` §2).
> 6. Tidak ada `console.log`/`dd()`/kode debug tersisa.

---

## FASE 0 — Fondasi (Sprint 0-1)

**Tujuan**: Skeleton proyek siap, sebelum fitur bisnis apa pun dibangun.

| # | Task | Dependensi | Rujukan |
|---|---|---|---|
| 0.1 | Setup project Laravel 13 + Inertia + React + TypeScript + Tailwind + shadcn/ui (base scaffold) | — | `03` §5, `06` §1 |
| 0.2 | Setup Sanctum (guard `web` admin + guard `customer` terpisah) | 0.1 | `08` §1 |
| 0.3 | Install & konfigurasi `spatie/laravel-permission`, buat seeder role dasar (Owner, Admin, Kasir, Staff Gudang, Staff Online) + permission list awal | 0.1 | `01` §3, `08` §2 |
| 0.4 | Buat trait `BelongsToStore` + `CurrentStoreResolver` + seed `store_locations` default (1 toko) | 0.1 | `03` §2 |
| 0.5 | Setup struktur folder domain (`app/Domain/*`) sesuai konvensi | 0.1 | `05` §1 |
| 0.6 | Setup Enum classes dasar (`app/Enums/*`) sesuai daftar di `04` §4 | 0.1 | `04` §4 |
| 0.7 | Setup design tokens Tailwind (warna, radius, spacing sesuai `07`) + install komponen shadcn/ui dasar (button, input, card, table, dialog, sheet, toast) | 0.1 | `07` §2-6 |
| 0.8 | Setup layout dasar 3 app (`AdminLayout` dengan sidebar, `PosLayout`, `StorefrontLayout`) — hanya shell/navigasi, belum ada konten fitur | 0.7 | `06` §1, `07` §4 |
| 0.9 | Setup CI pipeline (lint, static analysis, test) | 0.1 | `09` §2 |
| 0.10 | Setup Pest + konfigurasi database testing | 0.1 | `09` §4 |
| 0.11 | Setup audit log infrastructure (`audit_logs` table + trait/observer generik `Auditable`) | 0.3, 0.5 | `08` §13, `04` §3.10 |

**Acceptance**: Login sebagai Owner (seeded user) berhasil, sidebar 3 app muncul kosong tapi terstruktur, test dasar hijau di CI.

---

## FASE 1 — Master Data & Catalog (Sprint 2-4)

**Tujuan**: Modul produk lengkap — fondasi semua modul lain bergantung ke sini.

| # | Task | Dependensi | Rujukan |
|---|---|---|---|
| 1.1 | Migration & Model: `categories` (self-ref), `brands`, `units`, `suppliers`, `warehouses`, `tags` | Fase 0 | `04` §3.2, §3.3 |
| 1.2 | CRUD Back-office: Kategori (+subkategori), Brand, Satuan, Supplier, Gudang | 1.1 | `02` §1.2-1.4, `06`, `07` |
| 1.3 | Migration & Model: `products` (semua kolom §1.1 `02`) + `product_barcodes`, `product_units`, `product_images` | 1.1 | `04` §3.2 |
| 1.4 | `ProductObserver` (auto SKU/slug/QR generate) | 1.3 | `05` §2.6 |
| 1.5 | Form Produk lengkap (semua field, termasuk toggle `sellable_pos`/`sellable_online`/`is_preorder`, upload multi-gambar, konversi satuan dinamis) | 1.3, 1.4 | `02` §1.1, `06` §3-4 |
| 1.6 | Migration & Model: `product_prices` + `PriceResolutionService` (algoritma resolusi harga lengkap) | 1.3 | `02` §1.5 |
| 1.7 | Unit test `PriceResolutionService` — semua skenario tier/member/promo/channel | 1.6 | `09` §4.2 |
| 1.8 | Migration & Model: `product_batches`, `product_serials`, `product_suppliers` (pivot), `related_products`, `product_tag` | 1.3 | `04` §3.2 |
| 1.9 | Halaman listing produk (DataTable dengan filter/search/sort) | 1.5 | `06` §4, `05` §5 |
| 1.10 | Job `CheckExpiringProductsJob` (scheduled) | 1.8 | `02` §1.6 |
| 1.11 | Katalog produk publik (read-only, storefront) — grid, filter, search, detail produk | 1.9 | `02` §5.2, `06` §7 |

**Acceptance**: Admin bisa input produk lengkap dengan semua atribut kompleks (satuan, harga tier, batch), harga terhitung otomatis sesuai algoritma resolusi, produk muncul di storefront sesuai flag channel.

---

## FASE 2 — Inventory & Stock Ledger (Sprint 5-7)

**Tujuan**: Sistem stok — kritikal, harus solid sebelum POS dibangun (POS bergantung stok akurat).

| # | Task | Dependensi | Rujukan |
|---|---|---|---|
| 2.1 | Migration & Model: `stock_ledger` (append-only) — **pastikan tidak ada method update/delete di Model level (guard eksplisit)** | Fase 1 | `04` §3.3 |
| 2.2 | `WacCalculationService` + unit test presisi angka | 2.1 | `02` §4.1, `09` §4.2 |
| 2.3 | Migration & Model + CRUD: `purchase_orders`, `purchase_order_items` (opsional PO flow) | Fase 1 | `04` §3.3 |
| 2.4 | Migration & Model: `stock_in`, `stock_in_details` + `ReceiveStockAction` (dengan DB transaction locking) | 2.2 | `02` §4.1, `05` §2.2 |
| 2.5 | Halaman Barang Masuk (form input, pilih supplier, konversi satuan otomatis, preview HPP baru sebelum submit) | 2.4 | `06`, `07` |
| 2.6 | Feature test: race condition 2 stock-in bersamaan untuk produk sama | 2.4 | `09` §4.2 |
| 2.7 | Migration & Model + flow: `supplier_returns`, `supplier_return_items` | 2.4 | `04` §3.3 |
| 2.8 | Migration & Model + flow: `stock_transfers`, `stock_transfer_details` (draft→in_transit→received) | Fase 1 | `02` §4.3 |
| 2.9 | Migration & Model + flow: `stock_opnames`, `stock_opname_details` (scan cepat via barcode, kalkulasi variance, auto-adjustment saat completed) | Fase 1 | `02` §4.4 |
| 2.10 | Migration & Model + flow: `stock_out_adjustments` (waste/damaged/lost/internal_use) dengan approval | Fase 1 | `02` §4.2 |
| 2.11 | `FifoAllocationService` (untuk produk `track_batch=true`, FEFO jika `track_expiry=true`) | 2.1, 1.8 | `02` §1.6 |
| 2.12 | Dashboard/laporan stok (low stock alert, expiring products) | Semua di atas | `02` §8 |
| 2.13 | Command Artisan `reconcile:stock` (rekonsiliasi kolom denormalized vs stock_ledger) | 2.1 | `04` §1.2 |

**Acceptance**: Barang masuk otomatis update HPP (WAC) presisi, stok opname menghasilkan adjustment otomatis dengan jejak lengkap, semua pergerakan stok tercatat immutable di `stock_ledger`.

---

## FASE 3 — POS / Kasir (Sprint 8-11)

**Tujuan**: Modul paling sering dipakai harian — prioritas UX tinggi.

| # | Task | Dependensi | Rujukan |
|---|---|---|---|
| 3.1 | Migration & Model: `cashier_shifts`, `cash_movements`, `cash_accounts` | Fase 2 | `04` §3.4, §3.9 |
| 3.2 | Flow Opening/Closing Shift (UI + `OpenShiftAction`/`CloseCashierShiftAction`, kalkulasi selisih kas) | 3.1 | `02` §2.4, `06` §6.4 |
| 3.3 | Migration & Model: `sales`, `sale_items`, `sale_payments` | 3.1 | `04` §3.4 |
| 3.4 | UI POS desktop (grid produk, panel invoice, payment summary) mengikuti referensi desain BrightPOS | Fase 1, 3.1 | `07` seluruh, `06` §6.1 |
| 3.5 | UI POS mobile (bottom nav, bottom sheet cart, gesture) — didesain terpisah, bukan responsive otomatis | 3.4 | `06` §6.2 |
| 3.6 | `CheckoutPosAction` — split payment, kalkulasi diskon per-item/global, integrasi stock deduction (event `SaleCompleted`) | 3.3, 2.1 | `02` §2.2, `05` §2.2 |
| 3.7 | Scan Barcode/QR (hardware + kamera HP) | 3.4, 3.5 | `02` §2.1 |
| 3.8 | Keyboard shortcut desktop POS | 3.4 | `06` §6.3 |
| 3.9 | Park Bill / Resume Bill | 3.6 | `02` §2.2 |
| 3.10 | Retur/Refund/Exchange flow + approval limit | 3.6 | `02` §2.2 |
| 3.11 | Cetak struk thermal (print CSS) | 3.6 | `02` §2.5 |
| 3.12 | Feature test: checkout lengkap (split payment, diskon, stok terpotong benar, shift closing selisih) | 3.6, 3.2 | `09` §4.2 |
| 3.13 | Audit log untuk aksi sensitif POS (void, diskon besar, no-sale) | 3.6 | `08` §7 |

**Acceptance**: Kasir bisa transaksi lengkap end-to-end (scan→bayar split→cetak struk) < 30 detik/item, shift kasir terekonsiliasi akurat, semua aksi sensitif teraudit.

---

## FASE 4 — Promo & Loyalty (Sprint 12-13)

| # | Task | Dependensi | Rujukan |
|---|---|---|---|
| 4.1 | Migration & Model: `promotions`, `promotion_conditions`, `promotion_rewards`, `vouchers`, `promotion_usages` | Fase 1 | `04` §3.5 |
| 4.2 | `PromotionEngine` Service (resolusi promo aktif, stacking rule, validasi limit) | 4.1 | `02` §3.3 |
| 4.3 | UI Admin: buat promo (semua tipe: diskon item/kategori/voucher/bundling/BXGY/cashback) | 4.2 | `02` §3.1 |
| 4.4 | Integrasi promo ke POS checkout & storefront cart | 4.2, Fase 3 | `02` §3 |
| 4.5 | Migration & Model: `customer_points` (ledger) + `LoyaltyPointService` | Fase 1 | `02` §3.3 |
| 4.6 | Feature test: stacking rule, usage limit, voucher expired | 4.2 | `09` §4.2 |

---

## FASE 5 — E-Commerce & Storefront (Sprint 14-18)

| # | Task | Dependensi | Rujukan |
|---|---|---|---|
| 5.1 | Migration & Model: `customers`, `customer_addresses`, `customer_groups` + auth guard `customer` | Fase 0 | `04` §3.1 |
| 5.2 | Migration & Model: `carts`, `cart_items` (session + persisted) | Fase 1 | `04` §3.6 |
| 5.3 | UI Cart & update qty real-time (recalculate tier) | 5.2, 1.7 | `02` §5.2 |
| 5.4 | Integrasi Leaflet.js + OpenStreetMap untuk pin lokasi & radius validation (Haversine) | 5.1 | `02` §5.2 |
| 5.5 | Migration & Model: `orders`, `order_items`, `order_status_histories`, `stock_reservations` | 5.2 | `04` §3.6 |
| 5.6 | `CheckoutOnlineAction` (guest & registered, kalkulasi ongkir, stock reservation, upload bukti transfer) | 5.4, 5.5 | `02` §5.2-5.3 |
| 5.7 | Job `ReleaseExpiredReservationsJob` (scheduled) | 5.6 | `02` §5.3 |
| 5.8 | Flow verifikasi pembayaran admin + `OrderConfirmed` event (link ke `sales`, potong stok) | 5.6 | `03` §4 |
| 5.9 | Order management pegawai (siapkan pesanan, scan QR selesai) | 5.8 | `02` §5.2 |
| 5.10 | Pelacakan pesanan pelanggan (QR/nomor resi) | 5.8 | `02` §5.2 |
| 5.11 | Akun pelanggan (riwayat pesanan, alamat, saldo poin) | 5.1 | `02` §5.2 |
| 5.12 | Feature test: radius validation, stock reservation expiry, guest checkout token uniqueness | 5.6, 5.7 | `09` §4.2 |

**Acceptance**: Order online otomatis muncul di POS/Inventory reporting yang sama, stok tidak overselling saat 2 pelanggan checkout bersamaan.

---

## FASE 6 — Landing Page, CMS & PWA (Sprint 19-21)

| # | Task | Dependensi | Rujukan |
|---|---|---|---|
| 6.1 | Migration & Model: `cms_pages`, `cms_sections`, `blog_posts`, `faqs` | Fase 0 | `04` §3.7 |
| 6.2 | Halaman Home, About, Promo, Blog, FAQ, Contact (publik) | 6.1, Fase 5 | `02` §5.4, `07` §9 |
| 6.3 | CMS admin (edit hero banner, teks, FAQ tanpa deploy) | 6.1 | `02` §5.4 |
| 6.4 | Setup PWA: manifest.json, service worker, caching strategy | Fase 5 | `06` §7.1-7.2 |
| 6.5 | Install prompt kustom + splash screen | 6.4 | `06` §7.3 |
| 6.6 | Push notification (status pesanan) | 6.4 | `06` §7.4 |
| 6.7 | Performance audit (Lighthouse ≥ 90) — optimasi lazy load gambar, code splitting | Semua di atas | `06` §7.5 |

---

## FASE 7 — HR: Absensi (Sprint 22-23)

**Prioritas tinggi sesuai requirement khusus owner — foto+geo+watermark immutable.**

| # | Task | Dependensi | Rujukan |
|---|---|---|---|
| 7.1 | Migration & Model: `employees`, `attendances` (tanpa route update/delete), `attendance_corrections` | Fase 0 | `04` §3.8 |
| 7.2 | Komponen `CameraCaptureWithWatermark` (getUserMedia, canvas overlay watermark, block galeri) | 7.1 | `06` §2, `08` §7 |
| 7.3 | `useGeolocationCapture` hook + validasi radius client-side (UX feedback cepat) | 7.1 | `02` §6.1 |
| 7.4 | `RecordAttendanceAction` — validasi ulang server-side (waktu server, radius, anti-replay) | 7.1, 7.2, 7.3 | `08` §7 |
| 7.5 | Mode kiosk scan barcode (alternatif, sesuai SKPL asli) | 7.1 | `02` §6.1 |
| 7.6 | UI Admin: riwayat absensi, flag anomali, form koreksi (`attendance_corrections`) | 7.4 | `02` §6.1 |
| 7.7 | Feature test: absensi ditolak di luar radius, endpoint update/delete attendance tidak ada (403/404) | 7.4 | `09` §4.2 |

---

## FASE 8 — Finance & Reporting (Sprint 24-26)

| # | Task | Dependensi | Rujukan |
|---|---|---|---|
| 8.1 | Migration & Model: `cash_accounts`, `expenses`, `expense_categories` | Fase 3 | `04` §3.9 |
| 8.2 | Migration & Model: `receivables`, `payables`, `payment_records` | Fase 3 | `04` §3.9 |
| 8.3 | Migration & Model: `chart_of_accounts`, `journal_entries`, `journal_entry_lines` + `JournalService` (auto-generate dari event `SaleCompleted`/`StockInReceived`/`ExpenseRecorded`) | 8.1, 8.2 | `02` §7 |
| 8.4 | Laporan Laba Rugi, Kas/Bank, Piutang/Hutang | 8.3 | `02` §7-8 |
| 8.5 | Dashboard Owner (widget real-time: income, expense, net profit, top products, payment methods, low stock) sesuai referensi BrightPOS | Semua fase sebelumnya | `02` §8, `07` §—, `05` §7 |
| 8.6 | Feature test: journal entry selalu balance, laporan laba rugi akurat vs data mentah | 8.3, 8.4 | `09` §4.2 |

---

## FASE 9 — Hardening, Security Review & Go-Live Prep (Sprint 27-28)

| # | Task | Dependensi | Rujukan |
|---|---|---|---|
| 9.1 | Review permission matrix lengkap semua role vs semua endpoint | Semua fase | `08` §2 |
| 9.2 | Penetration testing dasar (checklist OWASP Top 10) | Semua fase | `08` §16 |
| 9.3 | Load testing skenario ramai (multi-kasir + pelanggan online bersamaan) | Semua fase | `03` §7 |
| 9.4 | Setup backup otomatis + uji restore | Fase 0 | `08` §9, `09` §6 |
| 9.5 | Checklist deployment produksi | Semua fase | `09` §7 |
| 9.6 | Dokumentasi user manual (untuk owner/pegawai, bahasa Indonesia) — di luar scope 10 file teknis ini, dibuat terpisah jika diminta | — | — |
| 9.7 | UAT (User Acceptance Testing) bersama owner Toko Putera Kembar | Semua fase | `01` §4 |

---

## Catatan Prioritisasi untuk AI Agent

1. **Jangan lompat fase.** Fase 2 (Inventory) adalah pondasi Fase 3 (POS) dan Fase 5 (E-commerce) — stok yang tidak akurat akan merusak seluruh sistem downstream.
2. **Fase 7 (Absensi)** bisa dikerjakan paralel setelah Fase 0 selesai (tidak bergantung Inventory/POS) jika owner ingin modul ini cepat dipakai lebih dulu — fleksibel dipindah lebih awal sesuai prioritas bisnis owner.
3. Setiap akhir fase, jalankan **regresi test penuh** (`php artisan test`) sebelum lanjut fase berikutnya.
4. Modul **Purchase Order (2.3)** dan **Payroll pegawai** bersifat opsional/best-effort — bisa di-defer ke fase lanjutan pasca go-live jika tenggat waktu ketat, karena bukan blocker operasional inti (stock-in tanpa PO tetap berfungsi penuh).
