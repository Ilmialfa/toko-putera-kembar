<?php

namespace App\Domain\Catalog\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Resources\StorefrontProductResource;
use App\Models\Brand;
use App\Models\Category;
use App\Models\CmsPage;
use App\Models\Product;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StorefrontController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $categorySlug = $request->input('category');
        $brandId = $request->integer('brand') ?: null;
        $availability = $request->input('availability');
        $sort = $request->input('sort', 'newest');

        $query = Product::query()
            ->where('is_active', true)
            ->where('sellable_online', true)
            ->with(['category', 'brand', 'baseUnit', 'productUnits.unit', 'prices.unit', 'images' => function ($q) {
                $q->orderBy('display_order');
            }]);

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('description_short', 'like', "%{$search}%");
            });
        }

        if ($categorySlug) {
            $query->whereHas('category', function ($q) use ($categorySlug) {
                $q->where('slug', $categorySlug);
            });
        }

        $query->when($brandId, fn ($builder) => $builder->where('brand_id', $brandId));
        $query->when($availability === 'available', fn ($builder) => $builder->where('stok_saat_ini', '>', 0));
        $query->when($availability === 'preorder', fn ($builder) => $builder->where('is_preorder', true));
        match ($sort) {
            'name' => $query->orderBy('name'),
            'oldest' => $query->oldest(),
            default => $query->latest(),
        };

        $products = $query->paginate(24)->withQueryString();
        $products->through(fn (Product $product): array => (new StorefrontProductResource($product))->toArray($request));

        $categories = Category::where('is_active', true)
            ->whereNull('parent_id')
            ->with('children')
            ->orderBy('name')
            ->get();

        $homePage = CmsPage::with(['sections' => function ($q) {
            $q->where('is_active', true)->orderBy('display_order');
        }])->where('slug', 'home')->where('is_active', true)->first();

        return Inertia::render('storefront/Index', [
            'products' => $products,
            'categories' => $categories,
            'brands' => Brand::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'filters' => $request->only(['search', 'category', 'brand', 'availability', 'sort']),
            'homePage' => $homePage,
            'activePromotions' => Promotion::query()->where('status', 'active')->where('is_active', true)->whereIn('channel', ['online', 'both'])->where('start_date', '<=', now())->where('end_date', '>=', now())->with('rewards')->orderByDesc('priority')->limit(6)->get(),
        ]);
    }

    public function page()
    {
        $aboutPage = CmsPage::with(['sections' => function ($q) {
            $q->where('is_active', true)->orderBy('display_order');
        }])->where('slug', 'about')->where('is_active', true)->firstOrFail();

        return Inertia::render('storefront/Page', ['cmsPage' => $aboutPage]);
    }

    public function show($slug)
    {
        $product = Product::where('slug', $slug)
            ->where('is_active', true)
            ->where('sellable_online', true)
            ->with([
                'category',
                'brand',
                'baseUnit',
                'productUnits.unit',
                'prices.unit',
                'images' => function ($q) {
                    $q->orderBy('display_order');
                },
                'tags',
            ])
            ->firstOrFail();

        return Inertia::render('storefront/ProductDetail', [
            'product' => (new StorefrontProductResource($product))->toArray(request()),
        ]);
    }
}
