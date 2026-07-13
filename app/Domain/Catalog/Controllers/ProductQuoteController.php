<?php

namespace App\Domain\Catalog\Controllers;

use App\Domain\Catalog\Services\PriceResolutionService;
use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductQuoteController extends Controller
{
    public function __invoke(Request $request, PriceResolutionService $priceResolutionService): JsonResponse
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', Rule::exists('products', 'id')->where('is_active', true)],
            'unit_id' => ['required', 'integer', 'exists:units,id'],
            'quantity' => ['required', 'numeric', 'min:0.001'],
            'channel' => ['required', Rule::in(['pos', 'online'])],
        ]);

        $product = Product::query()->findOrFail($data['product_id']);

        if (($data['channel'] === 'online' && ! $product->sellable_online)
            || ($data['channel'] === 'pos' && ! $product->sellable_pos)) {
            abort(404);
        }

        $customerGroupId = auth('customer')->user()?->customer_group_id;
        $quote = $priceResolutionService->quote(
            $product,
            (int) $product->store_id,
            (int) $data['unit_id'],
            (float) $data['quantity'],
            $customerGroupId,
            $data['channel'],
        );

        return response()->json(['data' => $quote]);
    }
}
