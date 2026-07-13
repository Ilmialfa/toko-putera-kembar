<?php

namespace App\Domain\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class InventoryReportController extends Controller
{
    public function index(Request $request): Response
    {
        $storeId = $request->user()->store_id;
        $categoryId = $request->integer('category_id') ?: null;

        $products = Product::with(['category', 'baseUnit'])
            ->where('store_id', $storeId)
            ->when($categoryId, fn ($query, $selectedCategoryId) => $query->where('category_id', $selectedCategoryId))
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/reports/Index', [
            'products' => $products,
            'categories' => Category::query()->where('is_active', true)->orderBy('display_order')->orderBy('name')->get(['id', 'name']),
            'warehouses' => Warehouse::where('store_location_id', $storeId)->get(['id', 'name']),
            'filters' => ['category_id' => $categoryId],
        ]);
    }
}
