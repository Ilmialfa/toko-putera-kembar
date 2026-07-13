# 05. Backend (Laravel 13 / PHP 8.4+)

> Ditulis oleh Senior Laravel Developer & Software Architect. Ini adalah **konvensi wajib** yang harus diikuti AI agent saat menulis kode backend — bukan saran, tapi standar tim.

---

## 1. Struktur Folder

Menggunakan pendekatan **domain-oriented** (bukan default Laravel yang semua controller/model dicampur rata), diselaraskan dengan domain di `03-solution-architecture.md` §3.

```
app/
├── Domain/
│   ├── Catalog/
│   │   ├── Models/           (Product, Category, Brand, Unit, ProductPrice, ...)
│   │   ├── Services/         (ProductService, PriceResolutionService)
│   │   ├── Actions/          (CreateProductAction, UpdateProductPriceAction)
│   │   ├── Policies/         (ProductPolicy)
│   │   ├── Observers/        (ProductObserver — auto-generate SKU/slug)
│   │   ├── DTOs/             (ProductData, ProductPriceData)
│   │   └── Events/           (ProductCreated, ProductPriceChanged)
│   ├── Inventory/
│   │   ├── Models/           (StockLedger, Warehouse, StockIn, StockOpname, ...)
│   │   ├── Services/         (StockService, WacCalculationService, FifoAllocationService)
│   │   ├── Actions/          (ReceiveStockAction, TransferStockAction, AdjustStockAction)
│   │   └── ...
│   ├── Sales/                (Sale, CashierShift, SaleService, CheckoutAction, ...)
│   ├── Promotion/            (Promotion, PromotionEngine (Service), Voucher, ...)
│   ├── Ecommerce/            (Cart, Order, OrderService, CheckoutOnlineAction, ...)
│   ├── CMS/                  (CmsPage, BlogPost, Faq, ...)
│   ├── HR/                   (Employee, Attendance, AttendanceService, ...)
│   ├── Finance/              (CashAccount, Receivable, Payable, JournalService, ...)
│   ├── Identity/             (User, Customer, roles/permissions wrapper services)
│   └── Reporting/            (DashboardService, SalesReportService — tidak punya Model sendiri)
├── Http/
│   ├── Controllers/
│   │   ├── Admin/            (Controller untuk back-office, per domain: ProductController, dst)
│   │   ├── Pos/              (Controller khusus POS)
│   │   ├── Storefront/       (Controller publik e-commerce)
│   │   └── Api/              (REST API controllers, versioned: Api/V1/...)
│   ├── Requests/              (Form Request per domain, mengikuti nama domain: Catalog/StoreProductRequest)
│   ├── Resources/             (API Resource per domain)
│   └── Middleware/            (EnsureStoreContext, CheckPermission, dll)
├── Enums/                     (semua PHP backed enum, lihat 04-database-schema.md §4)
├── Support/                   (helper lintas domain: CurrentStoreResolver, Money value object)
└── Providers/
```

**Aturan lintas domain**: Domain A tidak boleh `use App\Domain\B\Models\X` langsung untuk *menulis* data — harus lewat `App\Domain\B\Services\XService` atau `App\Domain\B\Actions\...`. Membaca (read-only query) via Model relasi diperbolehkan jika memang relasi Eloquent didefinisikan (mis. `Sale::with('customer')`).

---

## 2. Pola Layer: Controller → Action/Service → Repository (opsional) → Model

### 2.1 Controller
- **Tipis (thin controller)**. Hanya: terima Form Request tervalidasi → panggil 1 Action/Service → return Inertia response / API Resource.
- Tidak ada business logic di controller.

```php
class ProductController extends Controller
{
    public function store(StoreProductRequest $request, CreateProductAction $action)
    {
        $product = $action->execute(ProductData::fromRequest($request));
        return redirect()->route('admin.products.show', $product)
            ->with('success', 'Produk berhasil dibuat.');
    }
}
```

### 2.2 Action (single-purpose business operation)
- 1 class = 1 operasi bisnis spesifik dengan 1 method `execute()`. Dipakai untuk operasi yang **menulis/mengubah state** dan punya efek samping jelas (kirim event, dsb).
- Contoh wajib pakai Action (bukan langsung di controller/service umum): `CheckoutPosAction`, `CheckoutOnlineAction`, `ReceiveStockAction`, `RecordAttendanceAction`, `CloseCashierShiftAction`.

```php
class ReceiveStockAction
{
    public function __construct(
        private WacCalculationService $wac,
        private DatabaseManager $db,
    ) {}

    public function execute(ReceiveStockData $data): StockIn
    {
        return $this->db->transaction(function () use ($data) {
            $stockIn = StockIn::create([...]);
            foreach ($data->items as $item) {
                $newHpp = $this->wac->calculate($item->product, $item->qtyBaseUnit, $item->subtotal);
                $item->product->update(['hpp_current' => $newHpp]);
                StockLedger::create([...'hpp_at_time' => $newHpp]);
            }
            event(new StockInReceived($stockIn));
            return $stockIn;
        });
    }
}
```

### 2.3 Service (logic yang reusable, sering dipanggil banyak Action/Controller)
- Untuk logic yang **dipakai berulang** lintas Action, misal `PriceResolutionService::resolve($product, $qty, $unit, $customer, $channel)` dipanggil dari POS checkout, storefront cart, dan preview harga admin.

### 2.4 Repository (opsional, hanya untuk query kompleks)
- **Tidak wajib untuk semua model.** Gunakan Repository hanya jika query benar-benar kompleks & reused (misal `ProductSearchRepository` untuk full-text search dengan banyak filter). Untuk CRUD sederhana, langsung pakai Eloquent Model di Service/Action (menghindari over-abstraction).

### 2.5 Policy
- 1 Policy per Model utama yang butuh authorization granular (`ProductPolicy`, `SalePolicy`, `SaleReturnPolicy`). Method mengikuti aksi bisnis, bukan hanya CRUD generik: `viewProfitReport()`, `approveReturn()`, `overrideDiscountLimit()`, `voidTransaction()`.
- Dipanggil via `$this->authorize()` di Controller/Form Request, ATAU via middleware permission untuk kasus generik.

### 2.6 Observer
- Untuk efek samping otomatis level Model (bukan business action eksplisit): `ProductObserver::creating()` — auto-generate `sku`/`slug`/`qr_code` jika kosong. `StockLedger` model **tidak boleh punya Observer yang melakukan re-write** (harus immutable, ditulis eksplisit hanya dari Action terkait).

### 2.7 Queue & Jobs
- Job async untuk: kirim notifikasi (WA/email/push), generate laporan besar (export Excel/PDF), `CheckExpiringProductsJob` (scheduled), `ReleaseExpiredReservationsJob` (scheduled), resize/optimize gambar produk setelah upload.
- **Tidak boleh** menjalankan proses yang mengubah stok/keuangan secara async tanpa idempotency key — jika job gagal & di-retry, tidak boleh double-write. Gunakan `unique job` (`ShouldBeUnique`) untuk job yang menyentuh data finansial/stok.

### 2.8 Events & Listeners
Lihat `03-solution-architecture.md` §4 untuk daftar event. Konvensi: Event class di `app/Domain/{Domain}/Events/`, Listener didaftarkan di `EventServiceProvider` per domain (atau auto-discovery Laravel 13).

### 2.9 Cache (Redis)
- Cache hasil query berat yang jarang berubah: kategori tree, unit list, dashboard aggregate (TTL pendek 60-300 detik dengan cache tag invalidation saat data terkait berubah — bukan TTL panjang tanpa invalidation, karena stok/harga harus real-time).
- Gunakan **cache tags** (`Cache::tags(['products'])->remember(...)`) agar invalidation presisi per entitas, bukan flush seluruh cache.
- **Dilarang cache** data yang butuh strong consistency: saldo stok real-time saat checkout, saldo kas shift aktif.

---

## 3. Validasi (Form Request + DTO)

- Setiap input wajib divalidasi via **Form Request class** (`StoreProductRequest`, `CheckoutRequest`), tidak ada validasi inline di controller.
- Setelah tervalidasi, data diubah jadi **DTO (Data Transfer Object)** — gunakan `readonly class` PHP 8.2+/`spatie/laravel-data` — sebelum diteruskan ke Action/Service. Ini memisahkan "bentuk HTTP request" dari "bentuk data domain", sehingga Action bisa dipanggil juga dari Job/Command/Test tanpa perlu mock Request HTTP.

```php
final readonly class ReceiveStockData
{
    public function __construct(
        public int $warehouseId,
        public int $supplierId,
        public string $invoiceNumber,
        /** @var ReceiveStockItemData[] */
        public array $items,
    ) {}

    public static function fromRequest(ReceiveStockRequest $request): self { ... }
}
```

- Validasi bisnis kompleks (bukan sekadar tipe data) — misal "qty opname tidak boleh negatif", "harga jual tidak boleh di bawah HPP tanpa permission override" — divalidasi di **Action/Service**, bukan Form Request (Form Request hanya validasi shape/format input).

---

## 4. Enum, Value Object, dan Konvensi Penamaan

- Semua enum (`04-database-schema.md` §4) sebagai PHP backed enum: `app/Enums/ProductType.php`, dst. Di-cast di Model via `protected $casts = ['product_type' => ProductType::class];`.
- **Money Value Object**: Gunakan class `Money` (wrap integer/decimal + currency) untuk operasi aritmatika uang, hindari operasi float manual tersebar (`$a->add($b)`, bukan `$a + $b` pada raw decimal string) — mencegah bug rounding. Bisa pakai package `brick/money` atau custom value object ringan.
- **Naming convention**:
  - Model: singular, PascalCase (`Product`, `StockLedger`).
  - Table: plural, snake_case (`products`, `stock_ledger` — pengecualian: `stock_ledger` tetap singular-ish karena representasi log, ikuti daftar di `04`).
  - Controller: `{Model}Controller` per konteks (`Admin\ProductController`, `Pos\CheckoutController`).
  - Action: VerbNoun + `Action` (`CreateProductAction`, `CheckoutPosAction`).
  - Service: Noun + `Service` (`PriceResolutionService`).
  - Event: past tense (`SaleCompleted`, `StockInReceived`).
  - Job: VerbNoun + `Job` (`CheckExpiringProductsJob`).

---

## 5. API Resource, Pagination, Filtering, Sorting, Search

### 5.1 API Resource
- Setiap response data (baik Inertia props maupun REST API) melalui **API Resource class** (`ProductResource`, `SaleResource`), tidak pernah `return $model` mentah — mencegah over-exposure kolom sensitif (`hpp_current` misalnya, tidak boleh muncul di response yang diakses kasir biasa; gunakan `$this->when($request->user()->can('finance.view'), ...)`).

### 5.2 Pagination
- Default **cursor pagination** (`cursorPaginate()`) untuk listing besar (produk, transaksi) demi performa konsisten di data besar; **offset pagination** (`paginate()`) hanya untuk listing kecil dengan kebutuhan "lompat ke halaman N" (misal admin table dengan total data < 10rb baris).
- Format response pagination konsisten:
```json
{
  "data": [...],
  "meta": { "current_page": 1, "per_page": 20, "total": 340 },
  "links": { "next": "...", "prev": null }
}
```

### 5.3 Filtering & Sorting
- Gunakan package `spatie/laravel-query-builder` untuk standar filter/sort/include via query string: `GET /api/v1/products?filter[category_id]=3&filter[search]=indomie&sort=-created_at&include=category,brand`.
- Whitelist filter/sort per endpoint (jangan izinkan filter kolom sensitif seperti `hpp_current` untuk role non-finance).

### 5.4 Search
- Full-text search MySQL (`FULLTEXT` index, §5 `04-database-schema.md`) untuk pencarian produk sederhana & cepat tanpa dependency tambahan. Jika kebutuhan search berkembang (typo-tolerance, relevance scoring lanjutan), arsitektur siap ditambah Laravel Scout + Meilisearch/Typesense sebagai search driver terpisah tanpa mengubah domain layer (Scout adalah adapter di Model, bukan mengubah Service).

---

## 6. Konvensi REST API (untuk Kebutuhan Eksternal/Mobile Native di Masa Depan)

- Base path: `/api/v1/...` (**versioning wajib di path**, bukan header, untuk kejelasan).
- Autentikasi: Laravel Sanctum (token personal access untuk kasus API murni, session cookie untuk Inertia).
- Response sukses: `{ "data": ..., "meta": ... }`. 
- Response error konsisten:
```json
{
  "message": "Data yang diberikan tidak valid.",
  "errors": { "field_name": ["Pesan error spesifik"] }
}
```
- HTTP status code standar: `200` OK, `201` Created, `204` No Content, `422` Validation Error, `403` Forbidden (authenticated tapi tidak punya permission), `401` Unauthenticated, `404` Not Found, `409` Conflict (mis. stok berubah saat checkout race condition), `429` Too Many Requests (rate limit).
- Idempotency: endpoint yang mengubah state finansial (checkout, payment) menerima header `Idempotency-Key` opsional untuk mencegah double-submit dari client (terutama penting di mobile dengan koneksi tidak stabil).

---

## 7. Reporting Service Pattern

- Setiap laporan (`02-features-business-rules.md` §8) punya class `{Nama}ReportService` di `app/Domain/Reporting/Services/`, dengan method `generate(ReportFilterData $filter): ReportResultData`.
- Query laporan berat (agregasi ribuan baris) menggunakan **query builder langsung** (bukan load Eloquent collection lalu `array_sum` di PHP) — gunakan `SUM()`, `GROUP BY` di level SQL untuk performa.
- Dashboard real-time (§8 di `02`) di-cache pendek (60 detik) dengan invalidation manual saat event `SaleCompleted`/`StockInReceived` terpicu (bukan hanya TTL).

---

## 8. Error Handling & Logging

- Custom Exception per domain untuk business rule violation, bukan generic `Exception`: `InsufficientStockException`, `PriceBelowHppException`, `AttendanceOutOfRadiusException`, `DiscountLimitExceededException`. Setiap custom exception punya `render()` method sendiri untuk format response konsisten (§6).
- Logging terstruktur (JSON) via Laravel default channel, level sesuai: `info` untuk aksi normal penting (checkout selesai), `warning` untuk anomali non-kritis (selisih kas kecil), `error` untuk kegagalan sistem, `critical` untuk kegagalan yang butuh notifikasi langsung ke developer (kegagalan job WAC calculation, dsb).
- Detail keamanan error handling (jangan expose stack trace ke production) → `08-security.md` §10.

---

## 9. Testing (Pest)

- Setiap Action/Service wajib punya **Feature test** (Pest) yang menguji business rule, bukan hanya "berhasil create record". Contoh wajib: test WAC calculation dengan angka presisi, test price resolution engine dengan berbagai kombinasi tier, test stock deduction race condition (2 checkout bersamaan untuk stok terbatas), test attendance ditolak jika di luar radius.
- Detail strategi testing lengkap → `09-devops-infra-qa.md` §4.
