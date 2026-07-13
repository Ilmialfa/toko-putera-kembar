# 04. Database Schema & ERD

> Ditulis oleh Senior Database Engineer. Skema dinormalisasi hingga **3NF** (dengan beberapa **controlled denormalization** yang didokumentasikan eksplisit — bukan kelalaian, tapi keputusan sadar untuk performa). Semua tabel transaksional wajib punya `store_id`, `created_at`, `updated_at`; tabel dengan risiko perlu dihapus wajib `deleted_at` (soft delete).
>
> **Konvensi penamaan**: tabel `snake_case` plural, kolom `snake_case`, FK `{singular_table}_id`, pivot table nama gabungan alfabetis (`product_tag` bukan `tag_product`) kecuali ada semantik lebih jelas (`product_units`).
>
> **Semua kolom uang**: `DECIMAL(15,2)` untuk harga/nominal transaksi, `DECIMAL(15,4)` untuk HPP/cost (butuh presisi lebih untuk hindari rounding error kumulatif). **Tidak pernah pakai FLOAT/DOUBLE untuk uang.**
> **Semua kolom kuantitas stok**: `DECIMAL(15,3)` (mendukung produk dijual per gram/kg pecahan, bukan hanya integer).

---

## 1. Prinsip Desain Skema

### 1.1 Normalisasi
- **1NF**: Semua kolom atomik, tidak ada array/list dalam 1 kolom kecuali JSON yang memang didesain sebagai dokumen semi-terstruktur (misal `cms_sections.content_json`, `audit_logs.changes_json`) — ini pengecualian sadar untuk data yang secara alami tidak butuh query relasional.
- **2NF/3NF**: Tidak ada partial/transitive dependency. Contoh: `product_prices` terpisah dari `products` karena 1 produk punya banyak harga (bukan disimpan sebagai kolom `harga_grosir`, `harga_member` dst di tabel `products` — itu melanggar 3NF dan tidak scalable saat butuh tipe harga baru).

### 1.2 Controlled Denormalization (Didokumentasikan)
| Kolom Denormalized | Tabel | Alasan | Sumber Kebenaran Asli |
|---|---|---|---|
| `products.hpp_current` | `products` | Menghindari agregasi `stock_ledger` di setiap request halaman produk | `stock_ledger` (SUM weighted) |
| `products.stok_saat_ini` | `products` | Performa listing produk (ribuan produk, query tanpa agregasi tiap kali) | `stock_ledger` (SUM per produk per gudang) |
| `sales.total_amount` | `sales` | Header total agar tidak perlu JOIN+SUM `sale_items` setiap kali list transaksi | `sale_items` (SUM `subtotal`) |
| `customers.loyalty_point_balance` | `customers` | Performa cek saldo poin saat checkout | `customer_points` (ledger, SUM) |

**Aturan wajib**: Setiap kolom denormalized di atas HARUS di-update via **database transaction yang sama** dengan penulisan ke sumber kebenaran (bukan job async terpisah yang bisa gagal diam-diam), dan harus ada **command Artisan rekonsiliasi** (`php artisan reconcile:stock`, `reconcile:hpp`) yang bisa dijalankan admin untuk memverifikasi/reset cache dari sumber asli.

### 1.3 Tipe Data Standar
| Jenis Data | Tipe MySQL |
|---|---|
| Uang/harga | `DECIMAL(15,2)` |
| HPP/cost per unit | `DECIMAL(15,4)` |
| Kuantitas stok | `DECIMAL(15,3)` |
| Persentase | `DECIMAL(5,2)` |
| ID | `BIGINT UNSIGNED AUTO_INCREMENT` (primary), pertimbangkan `ULID`/`UUID` untuk entitas yang di-expose ke public URL (order tracking, voucher code) agar ID tidak mudah ditebak/enumerasi |
| Timestamp | `TIMESTAMP` (dengan timezone Asia/Jakarta di level aplikasi, disimpan UTC di DB — standar Laravel) |
| Enum | Gunakan kolom `VARCHAR` + validasi enum di level aplikasi (PHP Enum class) **lebih disarankan daripada `ENUM` MySQL native**, karena menambah value baru tidak butuh migration `ALTER TABLE`. Didaftarkan di §7. |

---

## 2. ERD Tingkat Tinggi (Deskripsi Relasi Antar Domain)

```
store_locations ──1:N── warehouses ──1:N── stock_ledger ──N:1── products
      │                                                              │
      1:N                                                          N:1
      │                                                              │
   employees                                                    categories (self-ref)
      │                                                              │
      1:N                                                          N:1
      │                                                              │
  attendances                                                    brands

products ──1:N── product_units ──N:1── units
products ──1:N── product_prices
products ──1:N── product_barcodes
products ──1:N── product_batches ──1:N── product_serials
products ──N:N── product_suppliers ──N:1── suppliers

sales (header) ──1:N── sale_items ──N:1── products
sales ──1:N── sale_payments
sales ──N:1── cashier_shifts ──N:1── employees
sales ──N:1── customers (nullable, walk-in tanpa akun)

orders (header, online) ──1:N── order_items ──N:1── products
orders ──N:1── customers (nullable jika guest, pakai guest_token)
orders ──1:N── order_status_histories

promotions ──1:N── promotion_conditions
promotions ──1:N── promotion_rewards
promotions ──1:N── promotion_usages ──N:1── sales/orders (polymorphic)

stock_in (header) ──1:N── stock_in_details ──N:1── products
stock_in ──N:1── suppliers
stock_in ──1:N── payables

customers ──1:N── customer_addresses
customers ──1:N── customer_points (ledger)
customers ──1:N── receivables

users ──N:N── roles ──N:N── permissions (spatie/laravel-permission)

audit_logs ──N:1── users (polymorphic auditable_type/auditable_id)
```

Diagram visual (PNG/SVG) direkomendasikan digenerate oleh AI agent dari skema final menggunakan tool seperti `dbdiagram.io` (export DBML) atau Laravel package `beyondcode/laravel-er-diagram-generator` sebagai bagian dari task dokumentasi teknis (lihat `10-roadmap-task-breakdown.md`).

---

## 3. Daftar Lengkap Tabel per Domain

### 3.1 Domain: Identity & Access

**`users`** (internal: owner/admin/kasir/staff)
| Kolom | Tipe | Constraint |
|---|---|---|
| id | BIGINT UNSIGNED | PK |
| store_id | BIGINT UNSIGNED | FK → store_locations, index |
| name | VARCHAR(150) | NOT NULL |
| email | VARCHAR(150) | UNIQUE, NOT NULL |
| phone | VARCHAR(20) | NULLABLE, index |
| password | VARCHAR(255) | NOT NULL (hashed) |
| avatar_path | VARCHAR(255) | NULLABLE |
| employee_id | BIGINT UNSIGNED | FK → employees, NULLABLE UNIQUE (1 user = 1 employee record jika staff) |
| is_active | BOOLEAN | DEFAULT true |
| two_factor_secret | TEXT | NULLABLE, ENCRYPTED |
| last_login_at | TIMESTAMP | NULLABLE |
| last_login_ip | VARCHAR(45) | NULLABLE |
| email_verified_at | TIMESTAMP | NULLABLE |
| created_at, updated_at, deleted_at | TIMESTAMP | soft delete |

**`roles`**, **`permissions`**, **`model_has_roles`**, **`model_has_permissions`**, **`role_has_permissions`** — standar `spatie/laravel-permission`, dengan tambahan kolom `store_id NULLABLE` di `model_has_roles` untuk kesiapan multi-cabang (§2.3 di `03-solution-architecture.md`).

**`customers`** (pelanggan online, guard terpisah)
| Kolom | Tipe | Constraint |
|---|---|---|
| id | BIGINT UNSIGNED | PK |
| name | VARCHAR(150) | NOT NULL |
| email | VARCHAR(150) | UNIQUE NULLABLE (nullable karena guest bisa upgrade jadi member belakangan) |
| phone | VARCHAR(20) | UNIQUE NOT NULL (dipakai sebagai token utama, sesuai SKPL) |
| password | VARCHAR(255) | NULLABLE (guest tidak punya password) |
| customer_group_id | BIGINT UNSIGNED | FK → customer_groups, NULLABLE (member/reseller) |
| loyalty_point_balance | INT UNSIGNED | DEFAULT 0 (denormalized, §1.2) |
| is_guest | BOOLEAN | DEFAULT false |
| guest_token | VARCHAR(64) | NULLABLE UNIQUE (untuk guest checkout tracking) |
| email_verified_at, phone_verified_at | TIMESTAMP | NULLABLE |
| created_at, updated_at, deleted_at | | |

**`customer_groups`**: `id`, `name` (Member, Reseller, VIP), `default_discount_percent`, `is_active`.

**`customer_addresses`**: `id`, `customer_id` FK, `label`, `recipient_name`, `phone`, `full_address`, `latitude`, `longitude`, `is_default` BOOLEAN.

---

### 3.2 Domain: Catalog

**`store_locations`**: `id`, `name`, `address`, `latitude`, `longitude`, `delivery_radius_km` DECIMAL(6,2), `phone`, `operating_hours_json`, `is_main`, `is_active`.

**`warehouses`**: `id`, `store_location_id` FK, `name`, `code` UNIQUE, `is_default`, `is_active`.

**`categories`**: `id`, `parent_id` FK self, NULLABLE (index), `name`, `slug` UNIQUE, `image_path`, `icon`, `display_order` INT, `is_active`.

**`brands`**: `id`, `name`, `slug` UNIQUE, `logo_path`, `description`, `is_active`.

**`units`**: `id`, `name` (Pcs, Dus, Lusin), `symbol`, `is_active`.

**`tags`**: `id`, `name`, `slug` UNIQUE.

**`products`** (tabel paling besar — lihat `02-features-business-rules.md` §1.1 untuk daftar field lengkap dengan penjelasan bisnisnya). Ringkasan kolom teknis:
| Kolom | Tipe | Constraint |
|---|---|---|
| id | BIGINT UNSIGNED | PK |
| store_id | BIGINT UNSIGNED | FK, index |
| name | VARCHAR(255) | NOT NULL, FULLTEXT index (name, description_short) untuk search |
| slug | VARCHAR(255) | UNIQUE |
| sku | VARCHAR(100) | UNIQUE, index |
| barcode_primary | VARCHAR(100) | NULLABLE, UNIQUE, index |
| qr_code | VARCHAR(150) | UNIQUE |
| category_id | BIGINT UNSIGNED | FK → categories, index |
| brand_id | BIGINT UNSIGNED | FK → brands, NULLABLE, index |
| default_warehouse_id | BIGINT UNSIGNED | FK → warehouses |
| primary_supplier_id | BIGINT UNSIGNED | FK → suppliers, NULLABLE |
| base_unit_id | BIGINT UNSIGNED | FK → units, NOT NULL |
| product_type | VARCHAR(20) | enum app-level: physical/digital/service |
| costing_method | VARCHAR(10) | enum: WAC/FIFO, DEFAULT 'WAC' |
| is_active, is_sellable, sellable_pos, sellable_online, is_preorder | BOOLEAN | DEFAULT true/false sesuai konteks, masing2 index untuk filter cepat |
| preorder_eta_days | SMALLINT UNSIGNED | NULLABLE |
| weight_grams, length_cm, width_cm, height_cm | DECIMAL | NULLABLE |
| min_stock, max_stock, safety_stock, reorder_point | DECIMAL(15,3) | DEFAULT 0/NULLABLE |
| track_batch, track_expiry, track_serial_number | BOOLEAN | DEFAULT false |
| hpp_current | DECIMAL(15,4) | DEFAULT 0 (denormalized) |
| stok_saat_ini | DECIMAL(15,3) | DEFAULT 0 (denormalized, per-warehouse detail ada di `stock_ledger`, ini agregat total semua gudang untuk performa listing) |
| image_primary_path | VARCHAR(255) | NULLABLE |
| description_short, description_long | TEXT | NULLABLE |
| seo_title, seo_description, seo_keywords | VARCHAR/TEXT | NULLABLE |
| created_by, updated_by | BIGINT UNSIGNED | FK → users |
| created_at, updated_at, deleted_at | | soft delete WAJIB |

**Index tambahan**: composite `(store_id, is_active, sellable_online)` untuk query katalog storefront; composite `(store_id, category_id, is_active)` untuk filter kategori.

**`product_barcodes`**: `id`, `product_id` FK, `barcode` UNIQUE, `unit_id` FK NULLABLE (barcode spesifik per satuan), `is_primary` BOOLEAN.

**`product_units`** (pivot konversi satuan): `id`, `product_id` FK, `unit_id` FK, `conversion_qty` DECIMAL(15,3) NOT NULL, `is_purchase_unit`, `is_sales_unit` BOOLEAN, UNIQUE(`product_id`,`unit_id`).

**`product_prices`**: `id`, `product_id` FK, `unit_id` FK, `price_type` VARCHAR(20) enum(retail/wholesale_tier/member/reseller/promo), `customer_group_id` FK NULLABLE, `min_qty`, `max_qty` DECIMAL NULLABLE, `price` DECIMAL(15,2) NOT NULL, `valid_from`, `valid_until` TIMESTAMP NULLABLE, `channel` VARCHAR(10) enum(pos/online/both) DEFAULT both, `is_active` BOOLEAN. Index composite `(product_id, unit_id, price_type, is_active)`.

**`product_images`**: `id`, `product_id` FK, `path`, `display_order`, `is_primary`.

**`product_suppliers`** (pivot supplier alternatif): `id`, `product_id` FK, `supplier_id` FK, `supplier_price` DECIMAL(15,2), `lead_time_days` INT, `is_primary` BOOLEAN, UNIQUE(`product_id`,`supplier_id`).

**`product_tag`** (pivot): `product_id`, `tag_id`.

**`related_products`** (self-referencing pivot, polymorphic-ish untuk 3 tipe relasi): `id`, `product_id` FK, `related_product_id` FK, `relation_type` VARCHAR(20) enum(related/upsell/cross_sell), UNIQUE(`product_id`,`related_product_id`,`relation_type`).

**`product_batches`**: `id`, `product_id` FK, `warehouse_id` FK, `batch_number` VARCHAR(100), `expiry_date` DATE NULLABLE, `qty_in`, `qty_remaining` DECIMAL(15,3), `hpp_batch` DECIMAL(15,4), `stock_in_detail_id` FK NULLABLE, `received_at` TIMESTAMP. Index `(product_id, warehouse_id, expiry_date)`.

**`product_serials`**: `id`, `product_id` FK, `serial_number` VARCHAR(150) UNIQUE, `status` VARCHAR(20) enum(in_stock/sold/returned/damaged), `warehouse_id` FK, `sold_in_sale_item_id` FK NULLABLE.

**`product_shelf_locations`** (opsional, jika 1 produk tersebar banyak rak): `id`, `product_id` FK, `warehouse_id` FK, `shelf_code` VARCHAR(50), `qty` DECIMAL(15,3).

---

### 3.3 Domain: Inventory

**`suppliers`**: `id`, `store_id` FK, `name`, `code` UNIQUE, `contact_person`, `phone`, `email`, `address`, `payment_terms_days` INT DEFAULT 0, `is_active`, `created_at/updated_at/deleted_at`.

**`purchase_orders`**: `id`, `store_id` FK, `supplier_id` FK, `warehouse_id` FK, `po_number` UNIQUE, `status` VARCHAR(20) enum(draft/sent/partially_received/completed/cancelled), `total_amount` DECIMAL(15,2), `expected_date` DATE NULLABLE, `created_by` FK users.

**`purchase_order_items`**: `id`, `purchase_order_id` FK, `product_id` FK, `unit_id` FK, `qty_ordered`, `qty_received` DECIMAL(15,3) DEFAULT 0, `price_per_unit` DECIMAL(15,2).

**`stock_in`** (header barang masuk): `id`, `store_id` FK, `warehouse_id` FK, `supplier_id` FK, `purchase_order_id` FK NULLABLE, `invoice_number` VARCHAR(100), `total_amount` DECIMAL(15,2), `payment_status` VARCHAR(20) enum(paid/credit/partial), `received_by` FK users, `received_at` TIMESTAMP.

**`stock_in_details`**: `id`, `stock_in_id` FK, `product_id` FK, `unit_id` FK, `qty` DECIMAL(15,3), `qty_base_unit` DECIMAL(15,3) (hasil konversi, disimpan eksplisit untuk audit), `price_per_unit` DECIMAL(15,2), `subtotal` DECIMAL(15,2), `batch_number` VARCHAR(100) NULLABLE, `expiry_date` DATE NULLABLE, `hpp_before` DECIMAL(15,4), `hpp_after` DECIMAL(15,4) (snapshot WAC sebelum/sesudah, untuk audit trail perhitungan).

**`supplier_returns`**: `id`, `stock_in_id` FK NULLABLE, `supplier_id` FK, `warehouse_id` FK, `reason`, `status` enum(draft/completed), `created_by`.

**`supplier_return_items`**: `id`, `supplier_return_id` FK, `product_id` FK, `qty`, `unit_id` FK.

**`stock_transfers`**: `id`, `store_id` FK, `from_warehouse_id` FK, `to_warehouse_id` FK, `status` VARCHAR(20) enum(draft/in_transit/received/cancelled), `requested_by`, `approved_by` NULLABLE, `received_by` NULLABLE FK users, `transferred_at`, `received_at` NULLABLE.

**`stock_transfer_details`**: `id`, `stock_transfer_id` FK, `product_id` FK, `qty` DECIMAL(15,3).

**`stock_opnames`**: `id`, `store_id` FK, `warehouse_id` FK, `scope_type` VARCHAR(20) enum(full/partial), `status` VARCHAR(20) enum(draft/in_progress/completed), `conducted_by` FK users, `scheduled_date`, `completed_at` NULLABLE.

**`stock_opname_details`**: `id`, `stock_opname_id` FK, `product_id` FK, `system_qty`, `physical_qty` DECIMAL(15,3) NULLABLE, `variance_qty` DECIMAL(15,3) NULLABLE (generated/computed at completion), `variance_value` DECIMAL(15,2) NULLABLE, `counted_by` FK users NULLABLE, `counted_at` NULLABLE.

**`stock_out_adjustments`**: `id`, `store_id` FK, `warehouse_id` FK, `product_id` FK, `qty`, `reason_type` VARCHAR(20) enum(waste/damaged/lost/internal_use), `notes` TEXT NOT NULL, `approved_by` FK users NULLABLE, `created_by` FK users, `status` enum(pending/approved/rejected).

**`stock_ledger`** (★ tabel paling penting, **append-only, tidak boleh UPDATE/DELETE**):
| Kolom | Tipe | Constraint |
|---|---|---|
| id | BIGINT UNSIGNED | PK |
| store_id | BIGINT UNSIGNED | FK, index |
| product_id | BIGINT UNSIGNED | FK, index |
| warehouse_id | BIGINT UNSIGNED | FK, index |
| batch_id | BIGINT UNSIGNED | FK → product_batches, NULLABLE |
| movement_type | VARCHAR(20) | enum: in/out (arah pergerakan) |
| qty | DECIMAL(15,3) | NOT NULL (selalu positif, arah ditentukan `movement_type`) |
| qty_running_balance | DECIMAL(15,3) | saldo berjalan setelah movement ini (computed at insert time, untuk kecepatan query histori tanpa re-sum semua baris) |
| hpp_at_time | DECIMAL(15,4) | HPP produk pada saat movement ini terjadi (snapshot) |
| reference_type | VARCHAR(50) | polymorphic: sale/order/stock_in/stock_transfer/stock_opname/stock_out_adjustment/supplier_return |
| reference_id | BIGINT UNSIGNED | polymorphic ID |
| notes | VARCHAR(255) | NULLABLE |
| created_by | BIGINT UNSIGNED | FK users |
| created_at | TIMESTAMP | (tidak ada `updated_at` — immutable) |

Index composite: `(product_id, warehouse_id, created_at)` untuk query histori produk; `(reference_type, reference_id)` untuk trace balik dari transaksi ke pergerakan stok.

---

### 3.4 Domain: Sales (POS)

**`cashier_shifts`**: `id`, `store_id` FK, `store_location_id` FK, `user_id` FK (kasir), `opening_balance` DECIMAL(15,2), `closing_balance_system` DECIMAL(15,2) NULLABLE, `closing_balance_actual` DECIMAL(15,2) NULLABLE, `selisih_kas` DECIMAL(15,2) NULLABLE, `status` VARCHAR(10) enum(open/closed), `opening_at`, `closing_at` NULLABLE, `notes` TEXT NULLABLE.

**`cash_movements`**: `id`, `cashier_shift_id` FK, `cash_account_id` FK NULLABLE, `type` VARCHAR(10) enum(in/out), `amount` DECIMAL(15,2), `reason` VARCHAR(255), `created_by`.

**`sales`** (header transaksi POS & bisa juga dipakai untuk sale hasil order online, lihat `03-solution-architecture.md` §4): 
| Kolom | Tipe |
|---|---|
| id | BIGINT UNSIGNED PK |
| store_id | FK |
| store_location_id | FK |
| sale_number | VARCHAR(50) UNIQUE (format: `INV/{YYYYMM}/{sequence}`) |
| cashier_shift_id | FK NULLABLE (nullable jika berasal dari order online) |
| customer_id | FK NULLABLE |
| channel | VARCHAR(10) enum(pos/online) |
| order_id | FK → orders, NULLABLE (link balik jika channel=online) |
| status | VARCHAR(20) enum(completed/parked/voided/refunded/partially_refunded) |
| subtotal, discount_total, tax_total, total_amount | DECIMAL(15,2) |
| paid_amount, change_amount | DECIMAL(15,2) |
| payment_status | VARCHAR(20) enum(paid/unpaid/partial) — untuk piutang |
| voided_by, voided_at, void_reason | NULLABLE (audit void) |
| created_by | FK users (kasir yang input) |
| created_at, updated_at | |

**`sale_items`**: `id`, `sale_id` FK, `product_id` FK, `unit_id` FK, `qty` DECIMAL(15,3), `price_per_unit` DECIMAL(15,2), `discount_amount` DECIMAL(15,2) DEFAULT 0, `subtotal` DECIMAL(15,2), `hpp_at_time` DECIMAL(15,4) (untuk laporan laba akurat historis), `batch_id` FK NULLABLE, `serial_id` FK NULLABLE.

**`sale_payments`**: `id`, `sale_id` FK, `method` VARCHAR(20) enum(cash/qris/bank_transfer/e_wallet/debit_card/credit_card/piutang/points), `amount` DECIMAL(15,2), `reference_number` VARCHAR(100) NULLABLE (no. referensi QRIS/transfer).

**`sale_returns`**: `id`, `sale_id` FK, `type` VARCHAR(10) enum(return/exchange), `status` enum(pending_approval/approved/rejected), `approved_by` NULLABLE, `total_refund_amount` DECIMAL(15,2), `exchange_sale_id` FK NULLABLE (transaksi baru hasil tukar), `created_by`.

**`sale_return_items`**: `id`, `sale_return_id` FK, `sale_item_id` FK, `qty`, `condition` VARCHAR(20) enum(good/damaged).

---

### 3.5 Domain: Promotion

**`promotions`**: `id`, `store_id` FK, `name`, `type` VARCHAR(20) enum(discount_item/discount_category/voucher/bundling/bxgy/cashback/loyalty_point), `start_date`, `end_date`, `channel` VARCHAR(10) enum(pos/online/both), `is_active`, `is_stackable` BOOLEAN DEFAULT false, `priority` INT DEFAULT 0, `usage_limit_total` INT NULLABLE, `usage_limit_per_customer` INT NULLABLE, `min_purchase_amount` DECIMAL(15,2) NULLABLE, `applicable_scope` VARCHAR(20) enum(all/category/product/brand), `created_by`.

**`promotion_conditions`**: `id`, `promotion_id` FK, `conditionable_type`, `conditionable_id` (polymorphic → product/category/brand), `min_qty` DECIMAL NULLABLE.

**`promotion_rewards`**: `id`, `promotion_id` FK, `reward_type` VARCHAR(20) enum(percent_discount/fixed_discount/free_product/cashback/point_multiplier), `value` DECIMAL(15,2), `free_product_id` FK NULLABLE, `free_product_qty` DECIMAL NULLABLE.

**`vouchers`**: `id`, `promotion_id` FK, `code` VARCHAR(50) UNIQUE, `is_active`.

**`promotion_usages`**: `id`, `promotion_id` FK, `voucher_id` FK NULLABLE, `usable_type`, `usable_id` (polymorphic → sale/order), `customer_id` FK NULLABLE, `discount_amount_applied` DECIMAL(15,2), `used_at`.

**`customer_points`** (ledger, bukan saldo langsung — mirip `stock_ledger`): `id`, `customer_id` FK, `type` VARCHAR(10) enum(earn/redeem/expire/adjustment), `points` INT (positif untuk earn, negatif untuk redeem), `reference_type`, `reference_id` (polymorphic → sale/order), `expiry_date` DATE NULLABLE, `notes`, `created_at`.

---

### 3.6 Domain: E-commerce

**`carts`**: `id`, `customer_id` FK NULLABLE, `session_id` VARCHAR(100) NULLABLE (guest), `created_at`, `updated_at`.

**`cart_items`**: `id`, `cart_id` FK, `product_id` FK, `unit_id` FK, `qty`.

**`orders`** (header order online — struktur mirip `sales` tapi dengan field khusus e-commerce): `id`, `store_id` FK, `order_number` UNIQUE (bisa ULID untuk keamanan tracking publik), `customer_id` FK NULLABLE, `guest_token` VARCHAR(64) NULLABLE, `customer_address_id` FK NULLABLE, `delivery_latitude`, `delivery_longitude` DECIMAL, `distance_km` DECIMAL(6,2), `delivery_fee` DECIMAL(15,2), `subtotal`, `discount_total`, `total_amount` DECIMAL(15,2), `payment_method` VARCHAR(20) enum(bank_transfer/e_wallet — manual, arsitektur siap gateway), `payment_proof_path` VARCHAR(255) NULLABLE, `status` VARCHAR(30) enum(pending_payment/payment_verification/confirmed/preparing/ready_for_pickup/out_for_delivery/completed/cancelled/refunded), `qr_tracking_code` VARCHAR(100) UNIQUE, `verified_by` FK users NULLABLE, `verified_at` NULLABLE, `sale_id` FK NULLABLE (link ke `sales` setelah confirmed, lihat §4 `03`).

**`order_items`**: struktur sama pola dengan `sale_items`: `id`, `order_id` FK, `product_id` FK, `unit_id` FK, `qty`, `price_per_unit`, `discount_amount`, `subtotal`.

**`order_status_histories`**: `id`, `order_id` FK, `status`, `notes` NULLABLE, `changed_by` FK users NULLABLE, `created_at` (audit trail perubahan status, immutable append-only).

**`stock_reservations`**: `id`, `product_id` FK, `order_id` FK NULLABLE (nullable karena reservasi dibuat sebelum order resmi terbentuk, saat checkout in-progress), `session_id` VARCHAR(100), `qty`, `expires_at` TIMESTAMP, `status` enum(active/released/converted).

---

### 3.7 Domain: CMS

**`cms_pages`**: `id`, `slug` UNIQUE (home/about/faq/contact), `title`, `is_active`, `updated_by`.

**`cms_sections`**: `id`, `cms_page_id` FK, `section_type` VARCHAR(30) (hero_banner/text_block/promo_grid/faq_list), `content_json` JSON, `display_order`, `is_active`.

**`blog_posts`**: `id`, `title`, `slug` UNIQUE, `excerpt`, `content` TEXT (rich text), `cover_image_path`, `status` enum(draft/published), `published_at` NULLABLE, `author_id` FK users.

**`faqs`**: `id`, `question`, `answer` TEXT, `category` VARCHAR(50) NULLABLE, `display_order`, `is_active`.

---

### 3.8 Domain: HR

**`employees`**: `id`, `store_id` FK, `store_location_id` FK, `user_id` FK NULLABLE UNIQUE, `full_name`, `position` VARCHAR(50), `barcode_id` VARCHAR(50) UNIQUE (untuk mode kiosk scan), `join_date` DATE, `is_active`.

**`attendances`** (★ immutable, lihat `08-security.md` §7 untuk aturan lengkap):
| Kolom | Tipe |
|---|---|
| id | BIGINT UNSIGNED PK |
| employee_id | FK |
| store_location_id | FK (lokasi tempat absen tercatat) |
| type | VARCHAR(10) enum(check_in/check_out) |
| attendance_method | VARCHAR(15) enum(photo_geo/barcode_kiosk) |
| photo_path | VARCHAR(255) NULLABLE (wajib jika method=photo_geo) |
| captured_at_server | TIMESTAMP NOT NULL (sumber kebenaran) |
| captured_at_device | TIMESTAMP NULLABLE |
| latitude, longitude | DECIMAL(10,7) NULLABLE |
| accuracy_meters | DECIMAL(8,2) NULLABLE |
| matched_store_location_id | FK NULLABLE |
| distance_from_store_meters | DECIMAL(10,2) NULLABLE |
| is_within_radius | BOOLEAN |
| device_info | VARCHAR(255) NULLABLE |
| created_at | (tidak ada `updated_at` — immutable) |

**`attendance_corrections`**: `id`, `attendance_id` FK NULLABLE (nullable jika koreksi berupa "tambah data absensi yang terlewat", bukan revisi data ada), `employee_id` FK, `corrected_type`, `corrected_time` TIMESTAMP, `reason` TEXT NOT NULL, `approved_by` FK users, `created_at`.

---

### 3.9 Domain: Finance

**`cash_accounts`**: `id`, `store_id` FK, `name` (Kas Toko, Bank BCA), `type` enum(cash/bank), `current_balance` DECIMAL(15,2) (denormalized, sumber kebenaran = SUM `cash_movements`), `is_active`.

**`expense_categories`**: `id`, `name` (Listrik, Gaji, Sewa), `is_active`.

**`expenses`**: `id`, `store_id` FK, `expense_category_id` FK, `cash_account_id` FK, `amount` DECIMAL(15,2), `date`, `notes`, `attachment_path` NULLABLE, `created_by`.

**`receivables`** (piutang dari pelanggan): `id`, `customer_id` FK, `sale_id` FK NULLABLE, `order_id` FK NULLABLE, `amount` DECIMAL(15,2), `paid_amount` DECIMAL(15,2) DEFAULT 0, `due_date` DATE, `status` enum(unpaid/partial/paid).

**`payables`** (hutang ke supplier): `id`, `supplier_id` FK, `stock_in_id` FK, `amount` DECIMAL(15,2), `paid_amount` DECIMAL(15,2) DEFAULT 0, `due_date` DATE, `status` enum(unpaid/partial/paid).

**`payment_records`** (pembayaran cicilan piutang/hutang — generik untuk keduanya via polymorphic): `id`, `payable_type` (`receivable`/`payable`), `payable_id`, `amount`, `cash_account_id` FK, `paid_at`, `created_by`.

**`chart_of_accounts`**: `id`, `code` UNIQUE, `name` (Kas, Bank, Piutang, Hutang, Persediaan, Pendapatan Penjualan, HPP, Beban Operasional, Modal), `type` enum(asset/liability/equity/revenue/expense).

**`journal_entries`** (header, immutable): `id`, `store_id` FK, `reference_type`, `reference_id` (polymorphic), `entry_date`, `description`, `created_at` (no update/delete — koreksi via jurnal balik/reversing entry baru).

**`journal_entry_lines`**: `id`, `journal_entry_id` FK, `chart_of_account_id` FK, `debit` DECIMAL(15,2) DEFAULT 0, `credit` DECIMAL(15,2) DEFAULT 0. Constraint aplikasi: total debit = total credit per `journal_entry_id`.

---

### 3.10 Domain: Shared/Core

**`audit_logs`**: `id`, `user_id` FK NULLABLE, `auditable_type`, `auditable_id` (polymorphic), `action` VARCHAR(20) enum(create/update/delete/void/approve/login/failed_login), `changes_json` JSON (before/after snapshot), `ip_address` VARCHAR(45), `user_agent` VARCHAR(255), `created_at`. **Immutable, tidak boleh ada endpoint hapus.**

**`notifications`**: standar Laravel notifications table (`id` UUID, `type`, `notifiable_type/id`, `data` JSON, `read_at`, `created_at`).

**`store_settings`**: `id`, `store_id` FK, `key` VARCHAR(100), `value` TEXT, UNIQUE(`store_id`,`key`).

**`media`** (opsional, jika pakai package `spatie/laravel-medialibrary` untuk semua upload file lintas domain daripada kolom path terpisah di tiap tabel — **direkomendasikan** untuk konsistensi upload/S3/resize): `id`, `model_type`, `model_id`, `collection_name`, `file_name`, `disk`, `size`, `created_at`.

**`system_logs`** (opsional, untuk error tracking jika tidak pakai layanan eksternal seperti Sentry): `id`, `level`, `message`, `context_json`, `created_at`.

---

## 4. Daftar Enum Aplikasi Lengkap (Referensi Silang)

| Enum | Nilai |
|---|---|
| `product_type` | physical, digital, service |
| `costing_method` | WAC, FIFO |
| `price_type` | retail, wholesale_tier, member, reseller, promo |
| `channel` | pos, online, both |
| `movement_type` (stock_ledger) | in, out |
| `reference_type` (stock_ledger, polymorphic) | sale, order, stock_in, stock_transfer, stock_opname, stock_out_adjustment, supplier_return |
| `payment_status` | paid, credit, partial, unpaid |
| `sale.status` | completed, parked, voided, refunded, partially_refunded |
| `sale_payment.method` | cash, qris, bank_transfer, e_wallet, debit_card, credit_card, piutang, points |
| `order.status` | pending_payment, payment_verification, confirmed, preparing, ready_for_pickup, out_for_delivery, completed, cancelled, refunded |
| `promotion.type` | discount_item, discount_category, voucher, bundling, bxgy, cashback, loyalty_point |
| `reason_type` (stock_out_adjustments) | waste, damaged, lost, internal_use |
| `attendance.type` | check_in, check_out |
| `attendance_method` | photo_geo, barcode_kiosk |
| `audit_log.action` | create, update, delete, void, approve, login, failed_login |
| `stock_transfer.status` | draft, in_transit, received, cancelled |
| `stock_opname.status` | draft, in_progress, completed |

> Implementasi: setiap enum di atas dibuat sebagai **PHP 8.1+ backed enum class** di `app/Enums/`, dipakai sebagai cast Eloquent (`casts` di Model), bukan raw string tersebar di codebase. Detail konvensi di `05-backend-laravel.md` §4.

---

## 5. Strategi Indexing

Prinsip: index setiap kolom yang dipakai di `WHERE`, `JOIN`, atau `ORDER BY` pada query yang sering dieksekusi (POS checkout, listing produk, laporan). Ringkasan index kritikal:

- `products`: composite `(store_id, is_active, sellable_pos)`, `(store_id, is_active, sellable_online)`, `(category_id)`, `(brand_id)`, FULLTEXT `(name, description_short)`.
- `stock_ledger`: composite `(product_id, warehouse_id, created_at)`, `(reference_type, reference_id)`.
- `sales`: composite `(store_id, created_at)`, `(cashier_shift_id)`, `(customer_id)`.
- `sale_items`: `(sale_id)`, `(product_id, created_at)` untuk laporan produk terlaris per periode.
- `orders`: `(status)`, `(customer_id)`, unique `(qr_tracking_code)`.
- `attendances`: composite `(employee_id, captured_at_server)`.
- `audit_logs`: composite `(auditable_type, auditable_id)`, `(user_id, created_at)`.

## 6. Foreign Key & Referential Integrity

- Semua FK menggunakan `ON DELETE RESTRICT` sebagai default (mencegah hapus data master yang masih direferensikan transaksi) — KECUALI tabel child murni dalam 1 aggregate (misal `sale_items` → `sales` pakai `ON DELETE CASCADE` karena tidak ada makna item tanpa header-nya, meski dalam praktiknya `sales` juga soft-delete jadi cascade fisik jarang terpicu).
- Tabel master (products, categories, suppliers, dst) menggunakan **soft delete**, bukan hard delete, sehingga FK `RESTRICT` sebenarnya jarang jadi masalah operasional — data "dihapus" secara logis via `deleted_at` + `is_active=false`.

## 7. Pivot, Audit, dan History Table — Daftar Konsolidasi

| Kategori | Tabel |
|---|---|
| **Pivot (many-to-many)** | `product_tag`, `product_suppliers`, `model_has_roles`, `model_has_permissions`, `role_has_permissions`, `related_products` |
| **Audit table (immutable log)** | `audit_logs`, `stock_ledger`, `order_status_histories`, `journal_entries`+`journal_entry_lines`, `attendances`, `customer_points` |
| **History/snapshot table** | `product_batches` (histori batch), `stock_opname_details` (histori opname), `promotion_usages` (histori pemakaian promo) |
| **Correction table (append, bukan overwrite)** | `attendance_corrections` |
