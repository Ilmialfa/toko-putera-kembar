<?php

namespace App\Domain\Sales\Controllers;

use App\Domain\Catalog\Services\PriceResolutionService;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

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
            $price = $priceResolutionService->resolve($product, (int) $request->user()->store_id, (int) $product->base_unit_id, 1);

            return [
                'id' => $product->id,
                'name' => $product->name,
                'sku' => $product->sku,
                'image_primary_path' => $product->image_primary_path,
                'stock' => $product->stok_saat_ini,
                'price_retail' => $price?->price,
                'base_unit_id' => $product->base_unit_id,
                'base_unit' => $product->baseUnit,
                'default_warehouse_id' => $product->default_warehouse_id,
            ];
        });

        return response()->json(['data' => $products]);
    }
}
