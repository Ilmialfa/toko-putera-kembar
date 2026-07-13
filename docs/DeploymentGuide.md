# Deployment Guide: Toko Putera Kembar

## 1. Kebutuhan server

- Ubuntu 24.04 LTS, minimal 2 vCPU dan RAM 2 GB (disarankan 4 GB).
- Nginx, PHP 8.4 beserta ekstensi Laravel, Composer 2.
- MySQL 8.0+ atau MariaDB yang kompatibel.
- Node.js 22 LTS dan npm untuk membangun aset.
- Supervisor atau systemd untuk queue worker.
- HTTPS aktif dan document root mengarah ke folder `public`.

## 2. Instalasi rilis

```bash
git clone <repository> /var/www/toko-putera-kembar
cd /var/www/toko-putera-kembar
composer install --no-dev --prefer-dist --optimize-autoloader
npm ci
npm run build
cp .env.example .env
php artisan key:generate
```

Atur pemilik dan izin folder runtime:

```bash
chown -R www-data:www-data /var/www/toko-putera-kembar
chmod -R 775 storage bootstrap/cache
php artisan storage:link
```

## 3. Environment produksi

Gunakan nilai rahasia yang dikelola oleh server, bukan nilai contoh di repository.

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://domain-toko.example
APP_TIMEZONE=Asia/Jakarta
APP_LOCALE=id

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=putera_kembar_prod
DB_USERNAME=putera_kembar
DB_PASSWORD=<secret-kuat>

CACHE_STORE=database
SESSION_DRIVER=database
QUEUE_CONNECTION=database

INITIAL_ADMIN_NAME="Owner Putera Kembar"
INITIAL_ADMIN_EMAIL=owner@domain-toko.example
INITIAL_ADMIN_PASSWORD=<minimal-12-karakter-dan-unik>
```

`INITIAL_ADMIN_*` hanya dipakai saat bootstrap produksi. Seeder produksi tidak membuat akun demo atau memakai kata sandi default.

## 4. Database dan bootstrap

```bash
php artisan migrate --force
php artisan db:seed --force
php artisan optimize
```

Setelah login pertama, ganti kata sandi owner dan aktifkan autentikasi dua faktor/passkey.

## 5. Queue worker dan scheduler

Jalankan worker persisten melalui Supervisor atau systemd:

```bash
php artisan queue:work --sleep=3 --tries=3 --max-time=3600
```

Tambahkan satu cron entry:

```cron
* * * * * cd /var/www/toko-putera-kembar && php artisan schedule:run >> /dev/null 2>&1
```

Scheduler menangani pelepasan reservasi stok kedaluwarsa dan pemeriksaan produk mendekati kedaluwarsa. Restart worker setelah setiap rilis:

```bash
php artisan queue:restart
```

## 6. Prosedur setiap deployment

```bash
php artisan down --retry=60
git pull --ff-only
composer install --no-dev --prefer-dist --optimize-autoloader
npm ci
npm run build
php artisan migrate --force
php artisan optimize
php artisan queue:restart
php artisan up
```

Jalankan gerbang kualitas sebelum artefak dirilis:

```bash
composer test
npm run lint:check
npm run format:check
npm run types:check
npm run build
composer audit
npm audit --audit-level=high
```

## 7. Backup dan monitoring

- Pastikan scheduler aktif agar kebijakan backup aplikasi dapat berjalan.
- Simpan backup database dan file unggahan di lokasi terpisah dari server aplikasi.
- Pantau `storage/logs/laravel.log`, kegagalan queue, kapasitas disk, dan masa berlaku TLS.
- Uji pemulihan backup secara berkala; backup yang belum pernah direstorasi belum dapat dianggap valid.

## 8. Sanity check pascarilis

- Buka endpoint `/up` dan pastikan respons sehat.
- Login sebagai owner, buka dashboard, pesanan online, inventory, keuangan, dan CMS.
- Lakukan satu transaksi POS uji hingga jurnal terbentuk.
- Lakukan checkout online uji, verifikasi bukti bayar, dan pastikan reservasi berubah menjadi pengurangan stok.
- Uji absensi dari akun pegawai di dalam dan di luar radius.
- Pastikan browser console dan log Laravel tidak memuat error baru.
