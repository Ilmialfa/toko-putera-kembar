# 09. DevOps, Infrastructure & QA

> Ditulis oleh DevOps Engineer & QA Engineer.

---

## 1. Environments

| Environment | Tujuan | Catatan |
|---|---|---|
| **Local** | Development harian | Laravel Herd/Sail/Valet, DBngin untuk MySQL lokal (sesuai preferensi setup owner yang sudah ada) |
| **Staging** | Testing sebelum rilis, demo ke owner | Data mirip produksi (anonymized jika perlu), deploy otomatis dari branch `staging` |
| **Production** | Sistem live toko | Deploy manual/terkontrol dari branch `main`, dengan approval step |

- Owner sudah punya preferensi menangani setup lokal secara mandiri (dicatat di konteks proyek) — AI agent **tidak perlu** mengonfigurasi environment lokal owner, cukup sediakan dokumentasi `README.md` setup yang jelas.

## 2. CI/CD Pipeline

Menggunakan GitHub Actions (atau setara), tahapan pipeline setiap push/PR:

1. **Lint**: `pint` (PHP code style, Laravel standar), `eslint` + `prettier` (TypeScript/React).
2. **Static analysis**: `phpstan`/`larastan` level minimal 5, `tsc --noEmit` untuk type-check TypeScript.
3. **Test**: Pest (backend) + component test frontend jika ada (lihat §4).
4. **Security scan**: `composer audit`, `npm audit` — build gagal jika ada vulnerability level **critical/high** tanpa patch tersedia.
5. **Build**: Vite production build (frontend assets), verifikasi build sukses tanpa error.
6. **Deploy** (hanya branch `main`/`staging`): via strategi zero-downtime (lihat §3).

**Aturan wajib**: PR tidak bisa di-merge jika salah satu tahap di atas gagal (branch protection rule).

## 3. Deployment Strategy

- **Zero-downtime deployment**: build assets baru → `php artisan migrate --force` (dengan migration yang aman backward-compatible, lihat §3.1) → symlink switch (Laravel deployment pattern seperti Deployer/Envoyer-style: `releases/{timestamp}` + symlink `current`) → restart queue worker.
- **Queue worker & Scheduler**: dijalankan via Supervisor (queue worker persisten) + cron `* * * * * php artisan schedule:run` (untuk scheduled job seperti `CheckExpiringProductsJob`, `ReleaseExpiredReservationsJob`, backup harian).
- **Storage**: konfigurasi `filesystems.php` dengan disk `s3` untuk production (S3-compatible — bisa AWS S3, atau alternatif lebih ekonomis seperti Cloudflare R2/Wasabi/MinIO self-hosted), disk `local` untuk development.

### 3.1 Migration Safety
- Migration yang menambah kolom `NOT NULL` ke tabel besar wajib pakai `DEFAULT` value atau dipecah jadi 2 langkah (tambah nullable dulu → backfill data → baru diubah jadi NOT NULL di migration terpisah) — mencegah downtime/lock lama di tabel besar (`stock_ledger`, `sale_items`).
- Migration destruktif (hapus kolom/tabel) hanya dijalankan setelah dipastikan kode yang bergantung padanya sudah tidak ada di branch yang di-deploy (hindari deploy code baru + migration destruktif bersamaan tanpa jeda).

## 4. Testing Strategy (Pest + PHPUnit)

### 4.1 Piramida Testing
```
        ▲  E2E (sedikit) — flow kritikal: checkout POS, checkout online, login
       ╱ ╲    (Pest + Laravel Dusk atau Playwright)
      ╱   ╲
     ╱     ╲  Feature Test (banyak) — per Action/Endpoint, business rule
    ╱───────╲    (Pest, database transaction rollback per test)
   ╱         ╲
  ╱  Unit Test ╲ (Service/kalkulasi murni: WAC, price resolution, haversine)
 ╱───────────────╲
```

### 4.2 Test Wajib per Domain (Minimum Coverage)

| Domain | Test Kritikal Wajib Ada |
|---|---|
| Catalog | Price resolution engine (semua kombinasi tier/member/promo), unit conversion, SKU/barcode uniqueness |
| Inventory | WAC calculation presisi (angka desimal, bukan hanya "berhasil"), FIFO/FEFO allocation, race condition 2 stock-in bersamaan, stock ledger tidak pernah minus tanpa izin (backorder handling) |
| Sales (POS) | Checkout dengan split payment, shift closing selisih kas, retur dengan approval limit, void transaksi dengan audit log tercatat |
| Promotion | Stacking rule, usage limit enforcement, voucher expired ditolak |
| Ecommerce | Stock reservation & expiry, Haversine radius validation, guest checkout token uniqueness |
| HR | Attendance ditolak jika di luar radius, attendance tidak bisa diedit (test bahwa endpoint update/delete tidak ada / mengembalikan 403/404) |
| Finance | Journal entry selalu balance (debit=kredit), receivable/payable status transisi benar |
| Security | Permission enforcement per role (test bahwa kasir TIDAK bisa akses endpoint `finance.view`), rate limit login |

### 4.3 Konvensi Pest
- Struktur: `tests/Feature/Domain/{Domain}/{Fitur}Test.php`, `tests/Unit/Domain/{Domain}/{Service}Test.php`.
- Gunakan `RefreshDatabase` trait + factory per model (`ProductFactory`, `SaleFactory`) dengan data realistis (harga/qty masuk akal, bukan `1`/`test` generik) agar test kalkulasi (WAC, price tier) benar-benar teruji dengan angka nyata.
- Target coverage: **≥ 80%** untuk `app/Domain/**/Services` dan `Actions` (logic bisnis inti), coverage lebih longgar untuk Controller/Resource (thin layer, risiko lebih rendah).

## 5. Monitoring & Observability

- **Application monitoring**: log terstruktur (§ `05-backend-laravel.md` §8) dikirim ke layanan log aggregation (self-hosted seperti Grafana Loki, atau layanan cloud) untuk pencarian/alert.
- **Uptime monitoring**: health-check endpoint (`/up`, bawaan Laravel 13) dipantau external uptime checker (interval 1-5 menit), alert ke WhatsApp/email jika down.
- **Queue monitoring**: dashboard Laravel Horizon (jika worker cukup banyak) atau minimal alert jika queue job gagal berulang (`failed_jobs` table dipantau).
- **Database monitoring**: slow query log diaktifkan, review berkala untuk index tambahan.

## 6. Storage Strategy Detail

| Jenis File | Disk | Akses |
|---|---|---|
| Gambar produk | S3 public-read (dengan CDN jika tersedia) | Publik langsung (untuk performa katalog) |
| Foto absensi pegawai | S3 private | Signed URL, hanya bisa diakses role berwenang |
| Bukti transfer pelanggan | S3 private | Signed URL, hanya admin/pegawai verifikasi & pelanggan pemilik order |
| Backup database | S3 bucket terpisah, private, terenkripsi | Hanya akses DevOps/Owner |
| Export laporan (Excel/PDF) | Local temp / S3 dengan TTL pendek | Auto-delete setelah 24-48 jam |

## 7. Checklist Deployment Produksi (Sebelum Go-Live)

- [ ] `APP_DEBUG=false`, `APP_ENV=production`
- [ ] HTTPS aktif + HSTS
- [ ] Backup otomatis terjadwal & sudah diuji restore minimal 1x
- [ ] Rate limiting aktif di semua endpoint sensitif
- [ ] Queue worker + Supervisor aktif dan auto-restart jika crash
- [ ] Scheduler cron terpasang
- [ ] 2FA aktif untuk akun Owner
- [ ] Audit log berfungsi & teruji
- [ ] Load test dasar untuk skenario ramai (jam sibuk toko, beberapa kasir + pelanggan online bersamaan)
- [ ] Semua test Pest hijau di CI sebelum tag release
