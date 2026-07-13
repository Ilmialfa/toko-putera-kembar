<?php

namespace App\Domain\Catalog\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\CmsPage;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class StorefrontController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $categorySlug = $request->input('category');

        $query = Product::query()
            ->where('is_active', true)
            ->where('sellable_online', true)
            ->with(['category', 'baseUnit', 'prices', 'images' => function ($q) {
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

        $products = $query->latest()->paginate(24)->withQueryString();

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
            'filters' => $request->only(['search', 'category']),
            'homePage' => $homePage,
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
                'prices',
                'images' => function ($q) {
                    $q->orderBy('display_order');
                },
                'tags',
            ])
            ->firstOrFail();

        return Inertia::render('storefront/ProductDetail', [
            'product' => $product,
        ]);
    }
}
