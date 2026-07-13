<?php

namespace App\Domain\Catalog\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\SaveProductRequest;
use App\Models\Brand;
use App\Models\Category;
use App\Models\CustomerGroup;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\Warehouse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    public function index(Request $request): Response
    {
        $search = $request->input('search');
        $categoryId = $request->input('category_id');

        $products = Product::query()
            ->with(['category', 'brand', 'baseUnit'])
            ->where('store_id', $request->user()->store_id)
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

    public function create(): Response
    {
        return Inertia::render('admin/catalog/products/Form', [
            'categories' => Category::where('is_active', true)->get(['id', 'name']),
            'brands' => Brand::where('is_active', true)->get(['id', 'name']),
            'units' => Unit::where('is_active', true)->get(['id', 'name']),
            'suppliers' => Supplier::where('is_active', true)->get(['id', 'name']),
            'warehouses' => Warehouse::where('is_active', true)->get(['id', 'name']),
            'customerGroups' => CustomerGroup::where('is_active', true)->get(['id', 'name']),
        ]);
    }

    public function store(SaveProductRequest $request): RedirectResponse
    {
        DB::transaction(function () use ($request): void {
            $validated = $request->validated();
            $product = Product::query()->create($this->productAttributes($validated, $request));
            $this->syncRelations($product, $validated, $request);
        });

        return redirect()->route('admin.master.products.index')->with('success', 'Produk berhasil dibuat.');
    }

    public function edit(Product $product): Response
    {
        $this->ensureProductBelongsToCurrentStore($product, request());
        $product->load(['barcodes', 'productUnits.unit', 'images', 'prices.unit', 'prices.customerGroup']);

        return Inertia::render('admin/catalog/products/Form', [
            'product' => $product,
            'categories' => Category::where('is_active', true)->get(['id', 'name']),
            'brands' => Brand::where('is_active', true)->get(['id', 'name']),
            'units' => Unit::where('is_active', true)->get(['id', 'name']),
            'suppliers' => Supplier::where('is_active', true)->get(['id', 'name']),
            'warehouses' => Warehouse::where('is_active', true)->get(['id', 'name']),
            'customerGroups' => CustomerGroup::where('is_active', true)->get(['id', 'name']),
        ]);
    }

    public function update(SaveProductRequest $request, Product $product): RedirectResponse
    {
        $this->ensureProductBelongsToCurrentStore($product, $request);

        DB::transaction(function () use ($request, $product): void {
            $validated = $request->validated();
            $product->update($this->productAttributes($validated, $request, $product));
            $this->syncRelations($product, $validated, $request);
        });

        return redirect()->route('admin.master.products.index')->with('success', 'Produk berhasil diperbarui.');
    }

    public function destroy(Product $product): RedirectResponse
    {
        $this->ensureProductBelongsToCurrentStore($product, request());
        $product->delete();

        return redirect()->back()->with('success', 'Produk berhasil dinonaktifkan.');
    }

    /**
     * @param  array<string, mixed>  $validated
     * @return array<string, mixed>
     */
    private function productAttributes(array $validated, Request $request, ?Product $product = null): array
    {
        $storeId = $product instanceof Product ? $product->store_id : $request->user()->store_id;
        $createdBy = $product instanceof Product ? $product->created_by : $request->user()->id;

        return collect($validated)
            ->except(['barcodes', 'units', 'prices', 'images', 'remove_image_ids'])
            ->merge([
                'store_id' => $storeId,
                'online_display_unit_id' => $validated['online_display_unit_id'] ?? $validated['base_unit_id'],
                'created_by' => $createdBy,
                'updated_by' => $request->user()->id,
            ])
            ->all();
    }

    private function ensureProductBelongsToCurrentStore(Product $product, Request $request): void
    {
        abort_unless(
            (int) $product->store_id === (int) $request->user()->store_id,
            404,
        );
    }

    /** @param array<string, mixed> $validated */
    private function syncRelations(Product $product, array $validated, Request $request): void
    {
        $product->barcodes()->delete();
        foreach ($validated['barcodes'] ?? [] as $barcode) {
            $product->barcodes()->create($barcode);
        }

        $product->productUnits()->delete();
        foreach ($validated['units'] ?? [] as $unit) {
            $product->productUnits()->create($unit);
        }

        $product->prices()->delete();
        foreach ($validated['prices'] as $price) {
            $product->prices()->create([
                ...$price,
                'store_id' => $product->store_id,
                'discount_amount' => 0,
                'discount_percent' => 0,
            ]);
        }

        $imagesToRemove = $product->images()->whereIn('id', $validated['remove_image_ids'] ?? [])->get();
        foreach ($imagesToRemove as $image) {
            Storage::disk('public')->delete($image->path);
            $image->delete();
        }

        $nextOrder = (int) $product->images()->max('display_order') + 1;
        foreach ($request->file('images', []) as $uploadedImage) {
            $product->images()->create([
                'path' => $uploadedImage->store("products/{$product->id}", 'public'),
                'display_order' => $nextOrder++,
                'is_primary' => $product->images()->doesntExist(),
            ]);
        }

        /** @var ProductImage|null $primaryImage */
        $primaryImage = $product->images()->orderByDesc('is_primary')->orderBy('display_order')->first();
        $product->updateQuietly(['image_primary_path' => $primaryImage?->path]);
    }
}
