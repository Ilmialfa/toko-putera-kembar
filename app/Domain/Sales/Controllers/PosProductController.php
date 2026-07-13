<?php

namespace App\Domain\Sales\Controllers;

use App\Domain\Catalog\Services\PriceResolutionService;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PosProductController extends Controller
{
    public function search(Request $request, PriceResolutionService $priceResolutionService): JsonResponse
    {
        $query = Product::where('store_id', $request->user()->store_id)
            ->where('is_active', true)
            ->where('sellable_pos', true)
            ->with(['baseUnit', 'barcodes', 'productUnits.unit']);

        if ($request->filled('q')) {
            $searchTerm = $request->q;
            $query->where(function ($q) use ($searchTerm) {
                $q->where('name', 'like', "%{$searchTerm}%")
                    ->orWhere('sku', 'like', "%{$searchTerm}%")
                    ->orWhere('barcode_primary', 'like', "%{$searchTerm}%")
                    ->orWhereHas('barcodes', function ($qb) use ($searchTerm) {
                        $qb->where('barcode', 'like', "%{$searchTerm}%");
                    });
            });
        }

        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }

        $products = $query->paginate(20);
        $products->getCollection()->transform(function (Product $product) use ($priceResolutionService, $request): array {
            $storeId = (int) $request->user()->store_id;
            $salesUnits = collect([
                [
                    'id' => (int) $product->base_unit_id,
                    'name' => $product->baseUnit->name,
                    'symbol' => $product->baseUnit->symbol,
                    'conversion_qty' => 1,
                ],
                ...$product->productUnits
                    ->where('is_sales_unit', true)
                    ->where('unit_id', '!=', $product->base_unit_id)
                    ->map(fn ($productUnit): array => [
                        'id' => (int) $productUnit->unit_id,
                        'name' => $productUnit->unit->name,
                        'symbol' => $productUnit->unit->symbol,
                        'conversion_qty' => (float) $productUnit->conversion_qty,
                    ])
                    ->values()
                    ->all(),
            ])->map(function (array $unit) use ($priceResolutionService, $product, $storeId): array {
                $price = $priceResolutionService->resolve($product, $storeId, $unit['id'], 1);

                return [...$unit, 'price' => $price === null ? null : (float) $price->price];
            })->filter(fn (array $unit): bool => $unit['price'] !== null)->values();

            $basePrice = $salesUnits->firstWhere('id', (int) $product->base_unit_id);

            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'category_id' => (int) $product->category_id,
                'image_url' => $product->image_primary_path ? Storage::url($product->image_primary_path) : null,
                'stock' => $product->stok_saat_ini,
                'price_retail' => $basePrice['price'] ?? null,
                'base_unit_id' => $product->base_unit_id,
                'base_unit' => $product->baseUnit,
                'default_warehouse_id' => $product->default_warehouse_id,
                'sales_units' => $salesUnits,
            ];
        });

        return response()->json(['data' => $products]);
    }
}
