# 07. UI/UX Design System

> Ditulis oleh Senior UI Designer & Senior Mobile UX Designer. Sistem desain ini **mengikuti gaya referensi visual yang dilampirkan owner** (screenshot back-office bergaya "BrightPOS": aksen hijau-lime, sidebar putih bersih, kartu produk dengan gambar, layout dashboard berbasis widget card). **Catatan penting**: referensi desain hanya diambil dari sisi **warna, bentuk sidebar, dan layout/grid** — bukan fitur (fitur mengikuti `02-features-business-rules.md`). Landing page & e-commerce mengikuti gaya visual yang sama (konsisten 1 sistem, bukan 2 desain berbeda).

---

## 1. Prinsip Desain

- **Modern, premium, minimalis, cepat** — sesuai brief owner. Terinspirasi aplikasi 2026: banyak whitespace, shadow lembut (bukan flat 100% tapi juga bukan skeuomorphic), radius besar (rounded-xl/2xl), tipografi tegas untuk angka (dashboard metric harus mudah dibaca sekilas).
- **Konsistensi lintas 3 aplikasi** (Back-Office, POS, Storefront) — 1 design system, bukan 3 desain terpisah. Pelanggan yang lihat struk/website dan pegawai yang pakai POS harus merasakan "brand" visual yang sama.
- **Data-dense tapi tidak berantakan** — back-office/POS menampilkan banyak angka (harga, stok, HPP), harus tetap scannable via hierarki tipografi & grouping yang jelas (bukan sekadar tabel padat tanpa spacing).

---

## 2. Color Palette

Berdasarkan referensi (aksen hijau-lime `#C5F547`-ish / lime-green, latar putih/abu sangat muda, teks gelap netral):

| Token | Nilai (contoh) | Penggunaan |
|---|---|---|
| `--primary` | Lime Green `#B4E61D` / `hsl(78, 85%, 53%)` | CTA utama (tombol "Place an Order", "Simpan"), highlight aktif di sidebar, badge sukses |
| `--primary-foreground` | `#1A1A1A` (hampir hitam) | Teks di atas tombol primary (kontras lebih baik daripada putih di atas lime) |
| `--background` | `#F7F8F5` (off-white kehijauan sangat samar) | Latar utama aplikasi |
| `--surface` / `--card` | `#FFFFFF` | Latar kartu/panel |
| `--foreground` | `#111827` | Teks utama |
| `--muted-foreground` | `#6B7280` | Teks sekunder/label |
| `--border` | `#E5E7EB` | Garis pembatas halus |
| `--success` | `#22C55E` | Status berhasil, stok aman |
| `--warning` | `#F59E0B` | Stok rendah, selisih kas kecil |
| `--destructive` | `#EF4444` | Error, void transaksi, stok habis |
| `--info` | `#3B82F6` | Info netral, badge "Pending" |
| Chart palette | Lime `#B4E61D`, abu tua `#111827`, kuning `#FBBF24`, oranye `#F97316`, biru `#3B82F6` (mengikuti pola donut chart "Qris/Cash/Card" di referensi) | Data visualization, dibedakan by hue bukan hanya shade agar accessible |

**Dark Mode**: `--background` → `#0F1210` (hitam kehijauan gelap, bukan hitam pekat murni), `--surface` → `#1A1D19`, `--primary` tetap lime (kontras baik di gelap), `--foreground` → `#F3F4F6`.

**Aturan aksesibilitas**: Kombinasi teks/background minimal rasio kontras **4.5:1** (WCAG AA). Karena lime-green kontrasnya rendah terhadap putih, `--primary` **tidak dipakai untuk teks di atas background putih** — hanya sebagai fill tombol/badge dengan teks gelap di atasnya, atau sebagai border/accent tipis.

---

## 3. Typography

| Elemen | Font | Ukuran/Weight |
|---|---|---|
| Font family | **Inter** (atau **Plus Jakarta Sans** sebagai alternatif lebih "premium/rounded") — sans-serif modern, angka tabular untuk konsistensi kolom harga | — |
| Heading H1 (judul halaman) | 24-28px, Semi-bold (600) | `text-2xl font-semibold` |
| Heading H2 (judul section/card) | 18-20px, Semi-bold | `text-lg font-semibold` |
| Body | 14px, Regular (400) | `text-sm` |
| Caption/label | 12px, Medium (500), warna `muted-foreground` | `text-xs font-medium` |
| Metric besar (dashboard, mis. "$12,450") | 28-32px, Bold (700), **tabular-nums** wajib | `text-3xl font-bold tabular-nums` |
| Angka mata uang di tabel/struk | Selalu **tabular-nums**, rata kanan | — |

---

## 4. Grid & Layout

- Base spacing unit: **4px** (Tailwind default scale: 1=4px, 2=8px, 3=12px, 4=16px...).
- Container max-width back-office: `1440px` (layar analitik butuh ruang lebar untuk chart+widget berdampingan, sesuai referensi).
- Grid dashboard: 12-column, widget metric card dalam grid 4 kolom (desktop) → 2 kolom (tablet) → 1 kolom (mobile).
- Sidebar: lebar `240px` (expanded) / `72px` (collapsed, icon-only), fixed, warna surface putih dengan item aktif berlatar lime-green soft (`bg-primary/10` + teks/icon gelap, bukan lime solid penuh — sesuai referensi yang menunjukkan item "Dashboard" aktif berbentuk pill lime dengan icon+teks gelap).
- Radius standar: `rounded-lg` (8px) untuk input/button kecil, `rounded-xl`/`rounded-2xl` (12-16px) untuk card/panel besar — mengikuti kesan "premium, lembut" di referensi.

---

## 5. Icon

- Set ikon: **Lucide Icons** (via `lucide-react`, sudah tersedia sesuai stack yang ditentukan) — style outline konsisten, cocok dengan estetika minimalis referensi.
- Ukuran standar: `16px` (inline dengan teks kecil), `20px` (default tombol/menu), `24px` (header/empty state).
- Ikon sidebar selalu didampingi label teks (tidak icon-only kecuali mode collapsed).

---

## 6. Component Guidelines (shadcn/ui sebagai basis)

| Komponen | Kustomisasi dari default shadcn |
|---|---|
| Button (primary) | Background `--primary`, teks gelap, radius `rounded-lg`, height 40px (default)/48px (CTA besar POS "Place an Order") |
| Card | Border tipis `--border` + shadow sangat halus (`shadow-sm`), radius `rounded-xl`, padding `p-5`/`p-6` |
| Badge/Status pill | Radius penuh (`rounded-full`), warna sesuai status (`success`/`warning`/`destructive`/`info`), contoh dari referensi: "Success" hijau, "Refunds" merah muda |
| Input | Border `--border`, focus ring `--primary` dengan opacity, height 40px, radius `rounded-lg` |
| Sidebar nav item | Default: icon + label abu-abu; Aktif: background pill lime soft + teks/icon gelap tebal (meniru referensi persis) |
| Table | Header row background sangat subtle (`--background`), row hover subtle highlight, angka rata kanan, aksi (edit/hapus) di kolom paling kanan berupa icon button |

---

## 7. Motion & Animation

- Durasi standar: **150-200ms** untuk micro-interaction (hover, toggle), **250-300ms** untuk transisi panel/modal/drawer, easing `ease-out` untuk masuk, `ease-in` untuk keluar.
- Prinsip: animasi **fungsional**, bukan dekoratif berlebihan — beri feedback (item masuk cart → sedikit bounce/scale di badge cart), bukan animasi panjang yang menghambat kecepatan kerja kasir.
- Skeleton loading TIDAK pakai animasi shimmer berlebihan yang mengganggu — pulse halus (`animate-pulse` Tailwind default sudah cukup).
- Page transition (Inertia) — gunakan progress bar tipis di top (`NProgress`-style, sudah built-in Inertia) untuk navigasi antar halaman, hindari full-page fade yang memperlambat persepsi kecepatan.

---

## 8. State: Loading, Skeleton, Empty, Error, Success

### 8.1 Loading & Skeleton
- **Skeleton** (bukan spinner) untuk loading konten yang sudah tahu bentuknya (tabel, card list, dashboard widget) — mempertahankan layout stabil (no layout shift).
- **Spinner** hanya untuk aksi tombol (submit form) — ikon loading di dalam tombol, tombol disabled selama proses.

### 8.2 Empty State
- Selalu sertakan: ilustrasi/icon sederhana (bukan foto berat), judul singkat ("Belum ada transaksi"), deskripsi 1 baris, CTA jika relevan ("Mulai transaksi baru →"). Contoh dari `02-features-business-rules.md` §5: chart dashboard tanpa data → "Belum ada data penjualan bulan ini."

### 8.3 Error State
- Error validasi form: pesan merah di bawah field terkait (bukan hanya toast general) + border input jadi merah.
- Error sistem (network/500): full-panel error state dengan tombol "Coba Lagi", pesan ramah bahasa Indonesia (bukan raw error teknis ke end user — detail teknis hanya di log, lihat `08-security.md` §10).

### 8.4 Success State
- Toast hijau ringkas untuk aksi cepat (simpan, hapus).
- Untuk transaksi penting (checkout POS selesai, order online confirmed) → **halaman/modal konfirmasi dedicated** dengan ringkasan jelas (bukan sekadar toast yang mudah terlewat), karena ini adalah bukti transaksi finansial.

---

## 9. Landing Page & E-commerce Storefront — Penerapan Design System

- Menggunakan **palet & tipografi identik** dengan back-office (konsistensi brand), tapi dengan porsi whitespace lebih besar dan tipografi hero lebih besar (36-48px) khas landing page marketing.
- Hero section: gradient/solid lime sebagai aksen background section promosi, foto produk besar dengan card shadow lembut.
- Product card storefront: gambar rasio 1:1, nama produk, harga (dengan strikethrough jika promo), badge stok ("Stok Terbatas" kuning, "Pre-Order" biru, "Habis" abu-abu).
- Bottom navigation mobile storefront (PWA): Home / Katalog / Keranjang (dengan badge counter) / Pesanan / Akun — ikon Lucide + label kecil, background putih dengan indicator aktif lime.

---

## 10. Referensi Desain dari Owner (Cara AI Agent Menggunakannya)

Saat eksekusi implementasi, owner akan melampirkan foto referensi tambahan (mockup dari BrightPOS-style). AI agent harus:
1. Mengambil **hanya** elemen warna/bentuk sidebar/layout grid dari referensi tersebut.
2. **Tidak** meniru fitur/label/menu dari referensi apa adanya — nama menu, struktur data, dan alur kerja tetap mengikuti `02-features-business-rules.md` (sistem ini toko grosir, bukan restoran/kafe seperti contoh referensi).
3. Menjaga konsistensi token desain di atas (warna, spacing, radius) di setiap komponen baru yang dibuat, tidak membuat palet warna baru ad-hoc per halaman.
