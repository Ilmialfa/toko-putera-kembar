<?php

namespace App\Domain\Catalog\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\StorefrontProductResource;
use App\Models\BlogPost;
use App\Models\Brand;
use App\Models\Cart;
use App\Models\Category;
use App\Models\CmsPage;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\SaleItem;
use App\Models\StoreLocation;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class StorefrontController extends Controller
{
    public function index(Request $request): Response
    {
        return Inertia::render('storefront/Home', [
            'popularProducts' => $this->popularProducts($request),
            'categories' => $this->categories(),
            'articles' => BlogPost::query()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->latest('published_at')
                ->limit(3)
                ->get(['id', 'title', 'slug', 'excerpt', 'cover_image_path', 'published_at']),
            'homePage' => $this->cmsPage('home'),
            'store' => $this->mainStore(),
        ]);
    }

    public function catalog(Request $request): Response
    {
        $filters = $request->only(['search', 'category', 'brand', 'availability', 'sort']);
        $products = $this->productQuery($filters)->paginate(24)->withQueryString();
        $searchSuggestions = collect();

        if (($filters['search'] ?? false) && $products->isEmpty()) {
            $matches = $this->fuzzyMatches($filters, (string) $filters['search']);
            $searchSuggestions = $matches
                ->take(3)
                ->map(fn (Product $product): array => ['name' => $product->name, 'slug' => $product->slug])
                ->values();

            $products = $this->paginateCollection($matches, $request);
        }

        $products->through(fn (Product $product): array => (new StorefrontProductResource($product))->toArray($request));

        return Inertia::render('storefront/Index', [
            'products' => $products,
            'categories' => $this->categories(),
            'brands' => Brand::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'filters' => $filters,
            'searchSuggestions' => $searchSuggestions,
            'cartQuantities' => $this->cartQuantities($request),
        ]);
    }

    public function promotions(): Response
    {
        return Inertia::render('storefront/Promotions', [
            'promotions' => $this->activeOnlinePromotions(),
            'articles' => BlogPost::query()
                ->where('status', 'published')
                ->where('published_at', '<=', now())
                ->latest('published_at')
                ->paginate(9),
        ]);
    }

    public function companyProfile(): Response
    {
        return Inertia::render('storefront/CompanyProfile', [
            'cmsPage' => $this->cmsPage('about'),
            'store' => $this->mainStore(),
        ]);
    }

    public function show(string $slug): Response
    {
        $product = $this->productQuery([])
            ->where('slug', $slug)
            ->with('tags')
            ->firstOrFail();

        return Inertia::render('storefront/ProductDetail', [
            'product' => (new StorefrontProductResource($product))->toArray(request()),
        ]);
    }

    /** @param array<string, mixed> $filters */
    private function productQuery(array $filters): Builder
    {
        $query = Product::query()
            ->where('is_active', true)
            ->where('sellable_online', true)
            ->with([
                'category',
                'brand',
                'baseUnit',
                'productUnits.unit',
                'prices.unit',
                'barcodes',
                'images' => fn ($imageQuery) => $imageQuery->orderBy('display_order'),
            ]);

        if ($filters['search'] ?? false) {
            $search = (string) $filters['search'];
            $query->where(fn (Builder $builder): Builder => $builder
                ->where('name', 'like', "%{$search}%")
                ->orWhere('sku', 'like', "%{$search}%")
                ->orWhere('barcode_primary', 'like', "%{$search}%")
                ->orWhere('description_short', 'like', "%{$search}%")
                ->orWhere('description_long', 'like', "%{$search}%")
                ->orWhereHas('brand', fn (Builder $brandQuery): Builder => $brandQuery->where('name', 'like', "%{$search}%"))
                ->orWhereHas('category', fn (Builder $categoryQuery): Builder => $categoryQuery->where('name', 'like', "%{$search}%"))
                ->orWhereHas('barcodes', fn (Builder $barcodeQuery): Builder => $barcodeQuery->where('barcode', 'like', "%{$search}%")));
        }

        if ($filters['category'] ?? false) {
            $category = (string) $filters['category'];
            $query->whereHas('category', fn (Builder $builder): Builder => $builder->where('slug', $category));
        }

        $query->when($filters['brand'] ?? null, fn (Builder $builder, $brand): Builder => $builder->where('brand_id', $brand));
        $query->when(($filters['availability'] ?? null) === 'available', fn (Builder $builder): Builder => $builder->where('stok_saat_ini', '>', 0));
        $query->when(($filters['availability'] ?? null) === 'preorder', fn (Builder $builder): Builder => $builder->where('is_preorder', true));

        return match ($filters['sort'] ?? 'newest') {
            'name' => $query->orderBy('name'),
            'oldest' => $query->oldest(),
            default => $query->latest(),
        };
    }

    /** @param array<string, mixed> $filters */
    private function fuzzyMatches(array $filters, string $search): Collection
    {
        $normalizedSearch = $this->normalizeSearch($search);

        if ($normalizedSearch === '') {
            return collect();
        }

        $baseFilters = array_merge($filters, ['search' => null]);

        return $this->productQuery($baseFilters)
            ->limit(250)
            ->get()
            ->map(function (Product $product) use ($normalizedSearch): array {
                return [
                    'product' => $product,
                    'score' => $this->searchScore($product, $normalizedSearch),
                ];
            })
            ->filter(fn (array $match): bool => $match['score'] >= 0.36)
            ->sortByDesc('score')
            ->pluck('product')
            ->values();
    }

    private function normalizeSearch(string $value): string
    {
        return trim((string) preg_replace('/\s+/', ' ', preg_replace('/[^a-z0-9]+/', ' ', Str::lower(Str::ascii($value))) ?? ''));
    }

    private function searchScore(Product $product, string $search): float
    {
        $fields = [
            $product->name,
            $product->sku,
            $product->barcode_primary,
            $product->description_short,
            $product->description_long,
            $product->brand?->name,
            $product->category?->name,
            ...$product->barcodes->pluck('barcode')->all(),
        ];

        return collect($fields)
            ->filter(fn (?string $field): bool => filled($field))
            ->map(function (string $field) use ($search): float {
                $normalizedField = $this->normalizeSearch($field);

                if (str_contains($normalizedField, $search)) {
                    return 1.0;
                }

                similar_text($search, $normalizedField, $similarity);
                $wordSimilarity = collect(explode(' ', $normalizedField))
                    ->filter()
                    ->map(function (string $word) use ($search): float {
                        similar_text($search, $word, $percentage);

                        return $percentage / 100;
                    })
                    ->max() ?? 0;

                return max($similarity / 100, $wordSimilarity);
            })
            ->max() ?? 0;
    }

    /** @param Collection<int, Product> $items */
    private function paginateCollection(Collection $items, Request $request): LengthAwarePaginator
    {
        $perPage = 24;
        $page = LengthAwarePaginator::resolveCurrentPage();

        return new LengthAwarePaginator(
            $items->forPage($page, $perPage)->values(),
            $items->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()],
        );
    }

    /** @return Collection<int, array<string, mixed>> */
    private function popularProducts(Request $request): Collection
    {
        $productIds = SaleItem::query()
            ->selectRaw('product_id, SUM(qty) as total_sold')
            ->whereHas('sale', fn (Builder $query): Builder => $query
                ->where('status', 'completed')
                ->where('created_at', '>=', now()->subDays(7)))
            ->groupBy('product_id')
            ->orderByDesc('total_sold')
            ->limit(8)
            ->pluck('product_id');

        $products = $productIds->isEmpty()
            ? $this->productQuery([])->limit(8)->get()
            : $this->productQuery([])->whereIn('id', $productIds)->get()
                ->sortBy(fn (Product $product): int => (int) $productIds->search($product->id));

        return $products
            ->map(fn (Product $product): array => (new StorefrontProductResource($product))->toArray($request))
            ->values();
    }

    /** @return Collection<int, Category> */
    private function categories(): Collection
    {
        return Category::query()
            ->where('is_active', true)
            ->whereNull('parent_id')
            ->with('children')
            ->orderBy('name')
            ->get();
    }

    /** @return Collection<int, Promotion> */
    private function activeOnlinePromotions(?int $limit = null): Collection
    {
        $query = Promotion::query()
            ->where('status', 'active')
            ->where('is_active', true)
            ->where('storefront_visible', true)
            ->whereIn('channel', ['online', 'both'])
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->with('rewards')
            ->orderByDesc('priority');

        if ($limit !== null) {
            $query->limit($limit);
        }

        return $query->get();
    }

    private function cmsPage(string $slug): ?CmsPage
    {
        return CmsPage::query()
            ->with(['sections' => fn ($query) => $query->where('is_active', true)->orderBy('display_order')])
            ->where('slug', $slug)
            ->where('is_active', true)
            ->first();
    }

    private function mainStore(): ?StoreLocation
    {
        return StoreLocation::query()
            ->where('is_main', true)
            ->where('is_active', true)
            ->first(['name', 'address', 'phone', 'latitude', 'longitude', 'delivery_radius_km', 'operating_hours_json']);
    }

    /** @return array<string, float> */
    private function cartQuantities(Request $request): array
    {
        $cart = auth('customer')->check()
            ? Cart::query()->where('customer_id', auth('customer')->id())->first()
            : ($request->cookie('cart_session')
                ? Cart::query()->where('session_id', $request->cookie('cart_session'))->first()
                : null);

        if ($cart === null) {
            return [];
        }

        return $cart->items()
            ->get(['product_id', 'unit_id', 'qty'])
            ->mapWithKeys(fn ($item): array => ["{$item->product_id}:{$item->unit_id}" => (float) $item->qty])
            ->all();
    }
}
