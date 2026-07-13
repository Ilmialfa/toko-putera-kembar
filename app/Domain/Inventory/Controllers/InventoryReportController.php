<?php

namespace App\Domain\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class InventoryReportController extends Controller
{
    public function index(Request $request)
    {
        $storeId = $request->user()->store_id;

        $products = Product::with(['category', 'baseUnit'])
            ->where('store_id', $storeId)
            ->when($request->category_id, fn ($query, $categoryId) => $query->where('category_id', $categoryId))
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('inventory/reports/Index', [
            'products' => $products,
            'categories' => Category::all(['id', 'name']),
            'warehouses' => Warehouse::where('store_location_id', $storeId)->get(['id', 'name']),
            'filters' => $request->only(['category_id', 'warehouse_id']),
        ]);
    }
}
