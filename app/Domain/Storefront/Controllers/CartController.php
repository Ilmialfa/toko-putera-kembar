<?php

namespace App\Domain\Storefront\Controllers;

use App\Domain\Catalog\Services\PriceResolutionService;
use App\Http\Controllers\Controller;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CartController extends Controller
{
    private function resolveCart(Request $request)
    {
        $cart = null;
        if (auth('customer')->check()) {
            $cart = Cart::firstOrCreate(['customer_id' => auth('customer')->id()]);
        } else {
            $sessionId = $request->cookie('cart_session') ?? Str::uuid()->toString();
            $cart = Cart::firstOrCreate(['session_id' => $sessionId]);
            // Ensure cookie is set in middleware or via response if it's new
            if (! $request->cookie('cart_session')) {
                cookie()->queue(cookie()->forever('cart_session', $sessionId));
            }
        }

        return $cart;
    }

    public function index(Request $request, PriceResolutionService $priceResolutionService)
    {
        $cart = $this->resolveCart($request);
        $cart->load(['items.product.images', 'items.product.baseUnit', 'items.product.productUnits', 'items.unit']);

        $customerGroupId = auth('customer')->user()?->customer_group_id;
        $items = $cart->items->map(function (CartItem $item) use ($priceResolutionService, $customerGroupId): array {
            $quote = $priceResolutionService->quote($item->product, (int) $item->product->store_id, (int) $item->unit_id, (float) $item->qty, $customerGroupId, 'online');
            $image = $item->product->images->sortBy('display_order')->first();

            return [
                'id' => $item->id,
                'qty' => (float) $item->qty,
                'unit' => $item->unit?->only(['id', 'name', 'symbol']),
                'product' => $item->product->only(['id', 'name', 'slug', 'sku', 'stock_status']),
                'image_url' => $image ? Storage::disk('public')->url($image->path) : null,
                'quote' => $quote,
            ];
        });

        return inertia('storefront/Cart', ['cart' => ['id' => $cart->id, 'items' => $items]]);
    }

    public function store(Request $request, PriceResolutionService $priceResolutionService): RedirectResponse|JsonResponse
    {
        $validated = $request->validate([
            'product_id' => 'required|exists:products,id',
            'unit_id' => 'required|exists:units,id',
            'qty' => 'required|numeric|min:0.001',
        ]);

        $cart = $this->resolveCart($request);
        $product = Product::query()->where('is_active', true)->where('sellable_online', true)->findOrFail($validated['product_id']);
        try {
            $priceResolutionService->quote($product, (int) $product->store_id, (int) $validated['unit_id'], (float) $validated['qty'], auth('customer')->user()?->customer_group_id, 'online');
        } catch (\InvalidArgumentException $exception) {
            throw ValidationException::withMessages(['unit_id' => $exception->getMessage()]);
        }

        $item = $cart->items()->where('product_id', $validated['product_id'])
            ->where('unit_id', $validated['unit_id'])
            ->first();

        if ($item) {
            $item->increment('qty', $validated['qty']);
        } else {
            $cart->items()->create($validated);
        }

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Ditambahkan ke keranjang.',
                'cart_count' => $cart->items()->count(),
            ]);
        }

        return redirect()->back()->with('success', 'Ditambahkan ke keranjang.');
    }

    public function update(Request $request, CartItem $cartItem)
    {
        $validated = $request->validate(['qty' => 'required|numeric|min:0.001']);

        // simple validation to ensure item belongs to resolved cart
        $cart = $this->resolveCart($request);
        if ($cartItem->cart_id !== $cart->id) {
            abort(403);
        }

        $cartItem->update(['qty' => $validated['qty']]);

        return redirect()->back();
    }

    public function destroy(Request $request, CartItem $cartItem)
    {
        $cart = $this->resolveCart($request);
        if ($cartItem->cart_id === $cart->id) {
            $cartItem->delete();
        }

        return redirect()->back();
    }
}
