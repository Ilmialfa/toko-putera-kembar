# 08. Security

> Ditulis oleh Security Engineer. Mengacu OWASP Top 10 (2021/2025 revision) dan kebutuhan spesifik sistem retail (uang nyata, data pelanggan, potensi kecurangan internal).

---

## 1. Authentication

- **Back-office/POS (internal user)**: Laravel Sanctum SPA authentication (session cookie + CSRF token, karena Inertia adalah same-origin SPA) — bukan token bearer manual untuk web internal.
- **Storefront (customer)**: Guard terpisah (`customer`), Sanctum juga tapi session/guard berbeda dari `web` admin — memastikan token customer tidak bisa dipakai untuk endpoint admin dan sebaliknya.
- **Guest checkout**: tanpa password, diidentifikasi via `guest_token` (random 64-char, disimpan di cookie httpOnly + dikirim juga sebagai referensi tracking pesanan via nomor HP, sesuai SKPL).
- **Kiosk/Scanner device (absensi)**: token API scoped khusus (permission hanya endpoint absensi), disimpan di device kiosk, **di-rotate berkala** dan bisa di-revoke dari admin jika device hilang/dicuri.
- **2FA (Two-Factor Authentication)**: Wajib tersedia untuk role `Owner`/`Admin` (TOTP via app authenticator), opsional untuk role lain. Prioritas implementasi tinggi karena akses laporan keuangan.
- **Rate limiting login**: maksimum 5 percobaan gagal per 15 menit per kombinasi email+IP, lalu lockout sementara + captcha (lihat §5).

## 2. Authorization (RBAC Granular)

- Package `spatie/laravel-permission`. Permission granular per aksi (bukan hanya per modul): contoh `products.view`, `products.create`, `products.edit`, `products.delete`, `products.view_hpp` (permission terpisah khusus untuk melihat kolom HPP — kasir bisa akses produk tapi TIDAK bisa lihat HPP/margin), `pos.discount.override_limit`, `pos.retur.approve`, `finance.view`, `audit_log.view`.
- Role adalah **kumpulan permission yang dikonfigurasi**, bukan hardcode logic `if ($user->role === 'admin')` di kode — semua pengecekan akses via `$user->can('permission.name')` atau `@can` Blade/Inertia helper, supaya owner bisa membuat role kustom (mis. "Kepala Gudang") dari UI tanpa deploy ulang kode.
- **Object-level authorization** via Policy (`08` §—, lihat `05-backend-laravel.md` §2.5): misal kasir hanya bisa void transaksi miliknya sendiri dalam shift yang sama, kecuali punya permission `pos.void.any`.
- Middleware `EnsureStoreContext` memastikan user hanya bisa mengakses data `store_id` yang menjadi haknya (relevan saat multi-cabang aktif di masa depan).

## 3. CSRF Protection

- Bawaan Laravel (`VerifyCsrfToken` middleware) aktif untuk semua request session-based (Inertia). Token CSRF di-refresh otomatis oleh Inertia setelah setiap response.
- Endpoint webhook (jika ada integrasi payment gateway di masa depan) dikecualikan dari CSRF tapi **wajib** verifikasi signature/secret dari provider sebagai gantinya.

## 4. XSS (Cross-Site Scripting)

- React secara default melakukan escaping output (`{variable}` di JSX aman) — **dilarang keras** memakai `dangerouslySetInnerHTML` kecuali untuk konten rich-text yang sudah disanitasi (deskripsi produk, blog post) via library sanitasi (`DOMPurify`) baik saat disimpan (backend, `HTMLPurifier`) **maupun** saat dirender (defense in depth, dua lapis).
- Semua input yang berpotensi masuk halaman lain (nama produk, catatan, nama pelanggan) di-escape otomatis oleh Blade/React — tidak ada raw HTML injection point tanpa sanitasi eksplisit.
- HTTP header `Content-Security-Policy` diset ketat (default-src 'self', hanya whitelist domain CDN yang dipakai untuk font/script eksternal).

## 5. SQL Injection

- **Seluruh query wajib via Eloquent ORM / Query Builder** (parameter binding otomatis) — **dilarang keras** raw SQL dengan string concatenation. Jika terpaksa raw query (laporan kompleks), wajib pakai parameter binding (`DB::select('... where id = ?', [$id])`), tidak pernah interpolasi variabel langsung ke string SQL.
- Code review/AI agent checklist: setiap PR yang menyentuh query wajib dicek tidak ada `DB::raw()` dengan input user tanpa binding.

## 6. Rate Limiting

| Endpoint | Limit |
|---|---|
| Login | 5 percobaan / 15 menit / kombinasi IP+email |
| API publik (storefront) | 60 request/menit/IP (umum), lebih ketat untuk endpoint checkout: 10 request/menit |
| Endpoint absensi (kiosk) | Sesuai jumlah pegawai wajar, dengan anomaly detection (§ di `02-features-business-rules.md` §6.1 double-scan) |
| Voucher/kode promo apply | 10 percobaan/menit/session (cegah brute-force kode voucher) |
| Password reset request | 3 request/jam/email |

Implementasi via Laravel `RateLimiter` + Redis, response `429 Too Many Requests` dengan header `Retry-After`.

## 7. Absensi: Keamanan Foto + Geolocation (Requirement Khusus)

Mengacu ke `02-features-business-rules.md` §6.1, aspek keamanannya:
- **Capture langsung dari kamera** (live `getUserMedia`), **tidak menerima upload file dari galeri** — mencegah submit foto lama/hasil edit.
- **Watermark di-render di sisi client SEBELUM upload** (timestamp server-synced + koordinat), TAPI validasi ulang di **server** wajib: server membandingkan `captured_at_device` vs `captured_at_server` (toleransi drift beberapa detik, di luar itu di-flag anomali), dan koordinat GPS divalidasi ulang di backend (bukan percaya klaim watermark client semata — watermark hanya representasi visual, bukan sumber kebenaran).
- **Immutability**: data absensi (`attendances` table) tidak punya endpoint `UPDATE`/`DELETE` sama sekali di level API (bukan hanya UI yang disembunyikan) — enforce di Policy & tidak ada route method PUT/PATCH/DELETE terdaftar untuk resource ini. Koreksi hanya via tabel terpisah `attendance_corrections` dengan approval Admin/Owner.
- Foto disimpan di storage privat (S3 bucket private, bukan public-read) — akses hanya via signed URL bertenggat waktu pendek (`temporaryUrl()` Laravel), mencegah foto pegawai bisa diakses publik lewat link langsung.
- EXIF metadata dari foto **dihapus/tidak diandalkan** sebagai sumber lokasi (EXIF GPS mudah dipalsukan) — sumber kebenaran lokasi murni dari `navigator.geolocation` browser API yang diverifikasi server-side, bukan metadata file.

## 8. Encryption

- **At rest**: kolom sensitif (`two_factor_secret`, dokumen finansial tertentu jika ada) dienkripsi via Laravel `encrypted` cast (AES-256). Database backup juga terenkripsi (§9).
- **In transit**: HTTPS wajib di semua environment (termasuk staging), HSTS header aktif, TLS 1.2+ minimum.
- **Password**: hash `bcrypt`/`argon2id` (Laravel default), tidak pernah disimpan/di-log plaintext.

## 9. Backup & Restore

- **Backup database**: otomatis harian (full) + incremental/binlog untuk point-in-time recovery, retensi minimum 30 hari, disimpan terenkripsi di storage terpisah dari server produksi (S3-compatible, bucket berbeda region/akun jika memungkinkan).
- **Backup file storage** (foto produk, foto absensi, bukti transfer): sinkron harian ke storage backup terpisah.
- **Restore drill**: prosedur restore diuji berkala (bukan hanya backup dibuat tapi tidak pernah diverifikasi bisa dipulihkan) — dijadwalkan sebagai task rutin di `09-devops-infra-qa.md`.
- Detail teknis job/cron backup → `09-devops-infra-qa.md` §3.

## 10. Error Handling & Logging (Keamanan)

- **Production**: `APP_DEBUG=false` mutlak — stack trace/error detail teknis **tidak pernah** ditampilkan ke end user, hanya pesan generik ramah + kode referensi error (`Ref: ERR-{uuid}`) yang bisa dicari di log server oleh developer.
- Error terperinci tetap di-log lengkap ke sistem logging (§ `05-backend-laravel.md` §8) untuk debugging, tapi log **tidak boleh menyimpan data sensitif mentah** (password, token, nomor kartu — jika ada) — gunakan masking otomatis di formatter log.
- Semua exception kritikal (checkout gagal, WAC calculation error) memicu alert (log level `critical` → notifikasi ke developer/monitoring tool).

## 11. File Upload Security

- Validasi tipe file via **MIME type check server-side** (bukan hanya ekstensi nama file yang mudah dipalsukan) — whitelist: gambar (`jpg/png/webp`, max 5MB), dokumen bukti transfer (`jpg/png/pdf`, max 5MB).
- File disimpan dengan **nama random/hash** (bukan nama asli user) untuk mencegah path traversal & collision, disimpan di luar `public/` langsung — akses lewat controller yang mengecek permission, ATAU signed URL untuk file privat.
- Scan virus/malware untuk upload publik-facing (bukti transfer dari pelanggan) direkomendasikan sebagai lapisan tambahan jika memungkinkan (ClamAV atau layanan scanning cloud) — minimal untuk fase produksi matang.
- Gambar di-resize/re-encode ulang di server (bukan hanya disimpan mentah) — proses re-encoding otomatis "membersihkan" payload berbahaya yang mungkin disisipkan di file gambar (image polyglot attack).

## 12. API Security

- Sanctum token untuk API murni (§1) dengan **scope/ability terbatas** per token (`createToken('kiosk-device', ['attendance:write'])`) — token kiosk TIDAK punya ability lain.
- Semua endpoint API menerapkan permission check yang sama ketatnya dengan halaman Inertia (tidak ada endpoint API "belakang" yang terlewat authorization karena dianggap "hanya dipakai internal").
- CORS dikonfigurasi ketat — hanya origin frontend resmi yang diizinkan, tidak `*` wildcard di production.

## 13. Audit Log

- Setiap aksi sensitif (§ `04-database-schema.md` §3.10 `audit_logs`) tercatat: siapa (`user_id`), apa (`action`), data sebelum/sesudah (`changes_json`), kapan, dari IP mana. Mencakup minimal: login/failed login, create/update/delete data master penting, void transaksi, approve retur/diskon besar, perubahan harga, perubahan role/permission user lain.
- Audit log **immutable** (tidak ada endpoint edit/hapus), hanya bisa dibaca (permission `audit_log.view`, direkomendasikan hanya Owner).
- Retensi audit log: minimum 1 tahun (kebutuhan investigasi kecurangan/dispute historis).

## 14. Session Management

- Session timeout: idle timeout 60 menit untuk back-office/admin (data finansial sensitif), lebih longgar untuk storefront customer.
- Logout otomatis + invalidasi session di server saat: password diganti, 2FA diaktifkan/dinonaktifkan, atau admin memaksa revoke session user lain (misal saat pegawai resign — tombol "Revoke All Sessions" di manajemen user).
- 1 user bisa login multi-device (kasir ganti HP), tapi setiap sesi tercatat (`last_login_ip`, device info) dan bisa di-list & di-revoke individual oleh user/admin.

## 15. Password Policy

- Minimum 8 karakter, kombinasi huruf+angka wajib (kompleksitas simbol opsional/tidak dipaksakan — mengikuti rekomendasi NIST modern yang lebih menekankan panjang & unpredictability daripada aturan kompleksitas kaku yang justru mendorong pola lemah seperti `Password1!`).
- Cek password terhadap daftar password bocor umum (`Have I Been Pwned` API range check, opsional tapi direkomendasikan) saat registrasi/ganti password.
- Force password change untuk akun default/awal yang dibuat admin untuk pegawai baru (tidak boleh pegawai terus pakai password default yang diset admin).

## 16. Pemetaan OWASP Top 10

| OWASP Risk | Mitigasi di Sistem Ini |
|---|---|
| A01 Broken Access Control | RBAC granular (§2) + Policy object-level + `EnsureStoreContext` middleware |
| A02 Cryptographic Failures | Encryption at rest/in transit (§8), password hashing |
| A03 Injection | Eloquent ORM/parameter binding wajib (§5), validasi input ketat (Form Request) |
| A04 Insecure Design | Threat modeling di setiap fitur finansial (approval limit, immutable ledger) sejak desain (§ `02` seluruh business rules) |
| A05 Security Misconfiguration | `APP_DEBUG=false` production, CORS ketat, CSP header, checklist deployment di `09` |
| A06 Vulnerable Components | Dependency scanning otomatis (Dependabot/`composer audit`/`npm audit`) di CI, lihat `09-devops-infra-qa.md` §2 |
| A07 Identification & Auth Failures | 2FA, rate limit login, session management (§1,6,14) |
| A08 Software & Data Integrity Failures | Immutable ledger (`stock_ledger`, `audit_logs`, `attendances`), signed asset build (Vite hash) |
| A09 Logging & Monitoring Failures | Audit log lengkap (§13), structured logging (§10), alert kritikal |
| A10 Server-Side Request Forgery (SSRF) | Validasi ketat jika ada fitur fetch URL eksternal (reverse geocoding, dsb) — whitelist domain, tidak menerima URL arbitrary dari user input |
