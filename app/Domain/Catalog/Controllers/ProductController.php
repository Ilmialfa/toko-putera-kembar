<?php

namespace App\Domain\Catalog\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $categoryId = $request->input('category_id');

        $products = Product::query()
            ->with(['category', 'brand', 'baseUnit'])
            ->when($search, function ($query, $search) {
                // If using FULLTEXT:
                // $query->whereRaw('MATCH(name, description_short) AGAINST(? IN BOOLEAN MODE)', [$search]);
                // Since we use standard indexing for SQLite/dev:
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                        ->orWhere('sku', 'like', "%{$search}%");
                });
            })
            ->when($categoryId, function ($query, $categoryId) {
                $query->where('category_id', $categoryId);
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $categories = Category::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('admin/catalog/products/Index', [
            'products' => $products,
            'categories' => $categories,
            'filters' => $request->only(['search', 'category_id']),
        ]);
    }

    public function create()
    {
        return Inertia::render('admin/catalog/products/Form', [
            'categories' => Category::where('is_active', true)->get(['id', 'name']),
            'brands' => Brand::where('is_active', true)->get(['id', 'name']),
            'units' => Unit::where('is_active', true)->get(['id', 'name']),
            'suppliers' => Supplier::where('is_active', true)->get(['id', 'name']),
            'warehouses' => Warehouse::where('is_active', true)->get(['id', 'name']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100|unique:products,sku',
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'default_warehouse_id' => 'required|exists:warehouses,id',
            'primary_supplier_id' => 'nullable|exists:suppliers,id',
            'base_unit_id' => 'required|exists:units,id',
            'product_type' => 'required|string|in:physical,digital,service',
            'costing_method' => 'required|string|in:WAC,FIFO',
            'is_active' => 'boolean',
            'is_sellable' => 'boolean',
            'sellable_pos' => 'boolean',
            'sellable_online' => 'boolean',
            'is_preorder' => 'boolean',
            'preorder_eta_days' => 'nullable|integer',
            'weight_grams' => 'nullable|numeric',
            'min_stock' => 'nullable|numeric',
            'description_short' => 'nullable|string',
            'barcodes' => 'nullable|array',
            'barcodes.*.barcode' => 'required|string',
            'barcodes.*.is_primary' => 'boolean',
            'units' => 'nullable|array',
            'units.*.unit_id' => 'required|exists:units,id',
            'units.*.conversion_qty' => 'required|numeric',
        ]);

        DB::transaction(function () use ($validated) {
            $productData = collect($validated)->except(['barcodes', 'units'])->toArray();

            $product = Product::create($productData);

            if (! empty($validated['barcodes'])) {
                foreach ($validated['barcodes'] as $barcode) {
                    $product->barcodes()->create($barcode);
                }
            }

            if (! empty($validated['units'])) {
                foreach ($validated['units'] as $unit) {
                    $product->productUnits()->create($unit);
                }
            }
        });

        return redirect()->route('admin.catalog.products.index')->with('success', 'Product created successfully');
    }

    public function edit(Product $product)
    {
        $product->load(['barcodes', 'productUnits.unit', 'images']);

        return Inertia::render('admin/catalog/products/Form', [
            'product' => $product,
            'categories' => Category::where('is_active', true)->get(['id', 'name']),
            'brands' => Brand::where('is_active', true)->get(['id', 'name']),
            'units' => Unit::where('is_active', true)->get(['id', 'name']),
            'suppliers' => Supplier::where('is_active', true)->get(['id', 'name']),
            'warehouses' => Warehouse::where('is_active', true)->get(['id', 'name']),
        ]);
    }

    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'sku' => 'nullable|string|max:100|unique:products,sku,'.$product->id,
            'category_id' => 'required|exists:categories,id',
            'brand_id' => 'nullable|exists:brands,id',
            'default_warehouse_id' => 'required|exists:warehouses,id',
            'primary_supplier_id' => 'nullable|exists:suppliers,id',
            'base_unit_id' => 'required|exists:units,id',
            'product_type' => 'required|string|in:physical,digital,service',
            'costing_method' => 'required|string|in:WAC,FIFO',
            'is_active' => 'boolean',
            'is_sellable' => 'boolean',
            'sellable_pos' => 'boolean',
            'sellable_online' => 'boolean',
            'is_preorder' => 'boolean',
            'preorder_eta_days' => 'nullable|integer',
            'weight_grams' => 'nullable|numeric',
            'min_stock' => 'nullable|numeric',
            'description_short' => 'nullable|string',
            'barcodes' => 'nullable|array',
            'barcodes.*.barcode' => 'required|string',
            'barcodes.*.is_primary' => 'boolean',
            'units' => 'nullable|array',
            'units.*.unit_id' => 'required|exists:units,id',
            'units.*.conversion_qty' => 'required|numeric',
        ]);

        DB::transaction(function () use ($validated, $product) {
            $productData = collect($validated)->except(['barcodes', 'units'])->toArray();

            $product->update($productData);

            if (isset($validated['barcodes'])) {
                $product->barcodes()->delete();
                foreach ($validated['barcodes'] as $barcode) {
                    $product->barcodes()->create($barcode);
                }
            }

            if (isset($validated['units'])) {
                $product->productUnits()->delete();
                foreach ($validated['units'] as $unit) {
                    $product->productUnits()->create($unit);
                }
            }
        });

        return redirect()->route('admin.catalog.products.index')->with('success', 'Product updated successfully');
    }

    public function destroy(Product $product)
    {
        $product->delete();

        return redirect()->back()->with('success', 'Product deleted successfully');
    }
}
