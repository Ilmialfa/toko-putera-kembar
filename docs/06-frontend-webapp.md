# 06. Frontend (React + TypeScript + Inertia.js)

> Ditulis oleh Senior React Developer & Senior Mobile UX Designer. Mencakup 3 aplikasi dalam 1 codebase: **Back-Office**, **POS**, **Storefront (PWA)**.

---

## 1. Struktur Folder

```
resources/js/
├── Apps/
│   ├── Admin/           (halaman back-office: Dashboard, ProductList, ReportPage, ...)
│   ├── Pos/              (halaman POS: NewTransaction, Shift, ParkedBills, ...)
│   └── Storefront/       (halaman publik: Home, Catalog, ProductDetail, Cart, Checkout, ...)
├── Components/
│   ├── ui/                (shadcn/ui base components — button, input, dialog, table, dst — hasil `npx shadcn add`)
│   ├── shared/             (komponen lintas app: DataTable, EmptyState, ConfirmDialog, MoneyInput, BarcodeScanner, CameraCaptureWithWatermark)
│   ├── pos/                (komponen khusus POS: ProductGrid, CartPanel, PaymentSummary, ShiftClosingModal)
│   └── storefront/         (komponen khusus storefront: ProductCard, PriceTierTable, DeliveryRadiusMap)
├── Hooks/                 (useCart, usePermission, useCurrentShift, useGeolocationCapture, useBarcodeScanner)
├── Layouts/                (AdminLayout — sidebar seperti referensi BrightPOS, PosLayout, StorefrontLayout)
├── Lib/                    (api client, query-client setup, zod schemas, formatters (currency/date), permission helper)
├── Types/                  (TypeScript interfaces/types generated dari backend — lihat §2.5)
├── pwa/                    (service-worker.ts, manifest config)
└── app.tsx                 (Inertia entrypoint, root component per app)
```

**Aturan**: Komponen di `Components/shared` HARUS reusable lintas 3 app (tidak boleh ada dependency spesifik POS di dalam `shared`). Komponen spesifik-app tinggal di folder app masing-masing.

---

## 2. State Management

### 2.1 Server State → TanStack Query
- Semua data dari server (list produk, detail transaksi, laporan) dikelola **TanStack Query**, bukan `useState` manual + `useEffect fetch`. Ini memberi caching, background refetch, dan optimistic update secara konsisten.
- Karena Inertia sudah membawa props di initial load, TanStack Query dipakai terutama untuk: (a) data yang perlu **refetch berkala** tanpa reload halaman (dashboard real-time, daftar pesanan online baru), dan (b) interaksi client-side murni tanpa full page visit (search produk di POS, cek stok cepat).
- Untuk navigasi antar halaman penuh, tetap pakai Inertia `router.visit()`/`<Link>` sebagai mekanisme utama (bukan client-side routing terpisah) — konsisten dengan pola Inertia.

### 2.2 Client/UI State → React state lokal + Context terbatas
- State UI murni (modal terbuka/tutup, tab aktif) → `useState`/`useReducer` lokal.
- State yang perlu dibagi banyak komponen dalam 1 flow (keranjang POS aktif, shift kasir aktif) → React Context per app (`PosCartContext`, `CurrentShiftContext`), **bukan Redux/Zustand** — kompleksitas state cukup rendah untuk tidak butuh state management library tambahan. Jika kompleksitas bertambah signifikan di masa depan, Zustand adalah kandidat upgrade termudah (API mirip Context tapi tanpa provider re-render issue).

### 2.3 Form State → React Hook Form + Zod
- Semua form (create/edit produk, checkout, dsb) pakai `react-hook-form` + resolver `zod`. Skema Zod didefinisikan sekali per entity di `Lib/schemas/`, dipakai untuk validasi form DAN sebagai referensi tipe TypeScript (`z.infer<typeof productSchema>`).
- Validasi client-side (Zod) adalah **UX enhancement**, bukan pengganti validasi server (Form Request Laravel tetap sumber kebenaran final).

### 2.4 Optimistic Update
- Dipakai di titik interaksi cepat yang butuh terasa instan: tambah/kurang qty di keranjang POS, tambah item ke cart storefront. Pola: update UI state lokal dulu → kirim request background → rollback jika gagal (`onError` di TanStack Query mutation dengan `context` snapshot sebelumnya).
- **Tidak dipakai** untuk aksi finansial final (checkout submit, approve retur) — aksi ini harus menunggu konfirmasi server sebelum UI menganggap berhasil.

### 2.5 Tipe Data Backend↔Frontend
- Generate TypeScript types dari Laravel (via package `spatie/laravel-typescript-transformer` atau `laravel-data` dengan TypeScript export) agar `Types/` tidak diketik manual & selalu sinkron dengan DTO/Resource backend — mencegah drift antara backend dan frontend seiring skema berubah.

---

## 3. Component Architecture

- **Presentational vs Container** secara longgar: halaman (`Apps/*/Pages/*.tsx`) adalah container yang fetch data (via Inertia props) & compose komponen; komponen di `Components/` sebisa mungkin presentational (menerima props, tidak fetch sendiri) kecuali komponen yang memang secara alami self-contained (`BarcodeScanner`, `CameraCaptureWithWatermark`).
- Gunakan **compound component pattern** untuk komponen kompleks reusable (misal `<DataTable>` dengan `<DataTable.Filter>`, `<DataTable.Pagination>`) agar fleksibel dikustomisasi per halaman tanpa props explosion.
- Semua komponen interaktif dari `shadcn/ui` dikustomisasi sesuai token design system (`07-uiux-design-system.md`), bukan dipakai default Tailwind tanpa penyesuaian warna/radius.

---

## 4. Tabel Data (DataTable)

- Komponen `<DataTable>` generik berbasis TanStack Table (headless) + shadcn/ui table components, mendukung: sorting (klik header), filter kolom, pagination (cursor-based, tombol Next/Prev bukan nomor halaman untuk data besar), column visibility toggle, row selection (untuk bulk action), export (trigger job Excel backend).
- Loading state: skeleton row (bukan spinner penuh layar) — lihat `07-uiux-design-system.md` §7.

---

## 5. Pagination & Infinite Scroll

- **Back-office table** → cursor pagination dengan tombol Next/Prev (konsisten dengan `05-backend-laravel.md` §5.2).
- **Storefront katalog produk (mobile)** → infinite scroll (load more saat mendekati akhir viewport, via `IntersectionObserver`) — pola yang terasa native di mobile, sesuai requirement PWA "terasa seperti aplikasi".
- **POS product grid** → tidak pagination sama sekali untuk grid "Recent/Favorite" (cukup 8-12 item), tapi search hasil → infinite scroll juga.

---

## 6. POS UI/UX Detail (Desktop & Mobile)

Mengacu ke referensi desain yang dilampirkan user (BrightPOS: sidebar hijau-lime, kartu produk dengan gambar, panel invoice di kanan, payment summary di bawah).

### 6.1 Layout Desktop/Tablet
- Sidebar kiri (fixed, collapsible): navigasi Dashboard/Analysis/Transactions/Payment/Archive.
- Panel tengah: grid produk dengan tab kategori (Recent/Food/Drink/Dessert/Etc — di sistem ini diganti kategori real toko), search bar, quantity stepper per kartu produk.
- Panel kanan (fixed): "Invoice" berjalan (daftar item + qty + subtotal), Payment Summary (subtotal, pajak, total), tombol metode split payment, tombol "Place an Order" besar (primary CTA, warna aksen).

### 6.2 Layout Mobile (Kasir via HP — Didesain Khusus, Bukan Responsive Otomatis)
- **Bottom navigation** (bukan sidebar) untuk 4-5 menu utama POS: Kasir, Riwayat, Stok Cepat, Absensi, Akun.
- Alur transaksi mobile: full-screen product search/scan → tap produk → muncul **bottom sheet** cart (bukan panel sisi, karena layar sempit) → swipe up untuk lihat detail cart penuh → tombol bayar full-width di bawah (thumb-reachable zone).
- **Gesture**: swipe kiri pada item cart untuk hapus/diskon cepat (mirip pola e-commerce app native), pull-to-refresh untuk sinkronisasi stok/promo terbaru.
- Kamera untuk scan barcode via `BarcodeDetector` API (native browser jika didukung) dengan fallback library `zxing`.
- Keyboard numeric khusus muncul otomatis untuk input qty/uang tunai (bukan keyboard alfanumerik penuh).

### 6.3 Keyboard Shortcut (Desktop POS)
| Shortcut | Aksi |
|---|---|
| `F2` | Fokus ke search produk |
| `F4` | Diskon item terpilih |
| `F6` | Buka panel pembayaran |
| `F8` | Park bill |
| `F9` | Resume bill (buka daftar parked) |
| `Esc` | Batalkan item terakhir di cart |
| `Ctrl+P` | Cetak ulang struk terakhir |
| angka + `*` lalu scan | Set qty cepat sebelum scan barcode |

### 6.4 Shift & Cash Drawer UI
- Modal wajib muncul saat login kasir pertama kali di hari itu: input modal awal (opening balance) sebelum bisa akses menu transaksi.
- Widget kecil di header POS menampilkan status shift aktif (durasi berjalan, kasir siapa).
- Closing shift: form input hitungan fisik per denominasi uang (opsional detail per pecahan Rp100rb/50rb/dst untuk akurasi) → sistem tampilkan selisih otomatis dengan warna (hijau=pas, merah=selisih) sebelum kasir konfirmasi tutup shift.

---

## 7. PWA & Mobile Experience (Storefront + Back-office Mobile)

### 7.1 Web App Manifest
- `manifest.json`: `name`, `short_name`, `icons` (multi-resolusi 192/512, termasuk maskable icon), `display: "standalone"`, `theme_color` & `background_color` sesuai design token (`07`), `start_url`, `orientation: "portrait"` untuk storefront (POS bisa `"any"` untuk tablet landscape).

### 7.2 Service Worker
- Strategi caching berlapis:
  - **App shell** (JS/CSS bundle, font, logo) → `Cache First` (jarang berubah, versi di-bust via hash filename build).
  - **Data produk/katalog** → `Network First, fallback to cache` (utamakan data terbaru, tapi tetap bisa browse katalog terakhir saat offline).
  - **Transaksi/checkout** → **tidak di-cache**, murni network (data finansial tidak boleh stale/offline-submit tanpa penanganan konflik eksplisit).
- Offline fallback page sederhana untuk storefront ("Anda sedang offline, produk terakhir yang dilihat: ...").

### 7.3 Installable & Splash Screen
- Prompt instalasi kustom (`beforeinstallprompt` event) ditampilkan setelah user berinteraksi cukup (misal setelah 2 kali kunjungan atau checkout pertama berhasil), bukan langsung memaksa di kunjungan pertama (mengikuti best practice UX PWA agar tidak mengganggu).
- Splash screen otomatis dari manifest (icon+background color) saat app dibuka dari home screen.

### 7.4 Push Notification
- Web Push API + service worker untuk notifikasi: status pesanan berubah (untuk pelanggan), promo baru, alert stok rendah/shift belum ditutup (untuk pegawai/admin — app back-office mobile). Backend kirim via Laravel Notification channel `webpush` (package `laravel-notification-channels/webpush`).

### 7.5 Performance
- Code splitting per route (Inertia + Vite otomatis lazy-load per halaman).
- Gambar produk: lazy load (`loading="lazy"`), served dalam format WebP dengan multiple resolusi (`srcset`) dari storage S3 (resize dilakukan job backend saat upload, lihat `05-backend-laravel.md` §2.7).
- Target Lighthouse ≥ 90 (sesuai NFR di `03-solution-architecture.md` §7).

---

## 8. Theming & Dark Mode

- Tailwind dengan CSS variables untuk semua warna (`--primary`, `--background`, dst — didefinisikan di `07-uiux-design-system.md` §2), sehingga dark mode adalah swap variable set, bukan duplikasi class `dark:*` di semua tempat.
- Dark mode toggle tersimpan di `localStorage` + `prefers-color-scheme` sebagai default awal. **Prioritas implementasi dark mode: Back-Office & POS terlebih dulu** (dipakai lama oleh pegawai, kenyamanan mata penting); storefront dark mode adalah nice-to-have fase lanjutan.

---

## 9. Notification, Toast, Dialog, Drawer

- **Toast** (shadcn/ui `sonner` atau `toast`): feedback aksi singkat (berhasil simpan, gagal validasi ringkas). Auto-dismiss 3-4 detik, posisi top-right (desktop) / top-center (mobile agar tidak tertutup bottom nav).
- **Dialog (Modal)**: konfirmasi aksi destruktif (hapus, void transaksi) — WAJIB dialog konfirmasi eksplisit, tidak boleh aksi destruktif 1-klik langsung.
- **Drawer (Bottom Sheet di mobile, Side Sheet di desktop)**: untuk form cepat/detail tanpa pindah halaman penuh (detail item cart, quick edit stok).
- **In-app Notification Center** (ikon lonceng, sesuai referensi desain BrightPOS): daftar notifikasi sistem (stok rendah, pesanan baru, approval pending) dengan badge counter unread, terhubung ke tabel `notifications` backend + realtime update (polling TanStack Query interval pendek, atau Laravel Echo+Pusher/Reverb untuk true real-time jika dibutuhkan di fase lanjutan).

---

## 10. Chart & Dashboard

- Library chart: `recharts` (ringan, komponen React native, cukup untuk kebutuhan dashboard bisnis — line chart Daily Orders, bar chart Top Selling Products, donut chart Payment Methods — sesuai referensi desain BrightPOS yang dilampirkan).
- Semua chart harus punya **loading skeleton** dan **empty state** ("Belum ada data transaksi bulan ini") — jangan tampilkan chart kosong tanpa penjelasan.

---

## 11. Accessibility (a11y)

- Semua komponen interaktif keyboard-navigable (`shadcn/ui`/Radix sudah accessible by default — pertahankan, jangan override dengan `div onClick` polos).
- Kontras warna minimal WCAG AA (detail token warna di `07`).
- Form wajib punya `<label>` terasosiasi (bukan hanya placeholder).
- Alt text wajib untuk semua gambar produk (fallback ke nama produk jika admin tidak isi).
- Fokus visible (outline) tidak boleh dihilangkan (`focus:outline-none` tanpa pengganti dilarang) — krusial untuk kasir yang banyak pakai keyboard shortcut.

---

## 12. Responsive Strategy

- **Bukan "desktop lalu di-responsive-kan"** — POS & Storefront didesain **mobile-first** dari awal (Tailwind breakpoint `sm/md/lg` dipakai untuk *menambah* elemen di layar besar, bukan menyembunyikan elemen mobile).
- Back-office boleh **desktop-first** (karena pekerjaan admin/owner analitik lebih nyaman di layar besar) TAPI tetap wajib fungsional penuh di mobile (owner sering cek dashboard dari HP) — breakpoint utama: `<768px` = layout 1 kolom + bottom nav, `≥768px` = sidebar + multi kolom.
