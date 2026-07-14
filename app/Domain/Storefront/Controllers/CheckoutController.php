<?php

namespace App\Domain\Storefront\Controllers;

use App\Domain\Catalog\Services\PriceResolutionService;
use App\Domain\Promotion\Services\PromotionEngine;
use App\Domain\Storefront\Actions\CheckoutOnlineAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\StoreCheckoutRequest;
use App\Models\Cart;
use App\Models\Order;
use App\Models\StoreLocation;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class CheckoutController extends Controller
{
    private function resolveCart(Request $request): ?Cart
    {
        if (auth('customer')->check()) {
            return Cart::with(['items.product', 'items.unit'])->where('customer_id', auth('customer')->id())->first();
        } elseif ($request->cookie('cart_session')) {
            return Cart::with(['items.product', 'items.unit'])->where('session_id', $request->cookie('cart_session'))->first();
        }

        return null;
    }

    public function index(Request $request, PriceResolutionService $priceResolutionService): Response|RedirectResponse
    {
        $cart = $this->resolveCart($request);
        if (! $cart || $cart->items->isEmpty()) {
            return redirect()->route('cart.index')->with('error', 'Keranjang belanja kosong.');
        }

        $store = StoreLocation::query()
            ->where('is_main', true)
            ->where('is_active', true)
            ->firstOrFail();
        $addresses = [];
        if (auth('customer')->check()) {
            $addresses = auth('customer')->user()->addresses;
        }

        $customerGroupId = auth('customer')->user()?->customer_group_id;
        $items = $cart->items->map(function ($item) use ($priceResolutionService, $customerGroupId): array {
            $quote = $priceResolutionService->quote($item->product, (int) $item->product->store_id, (int) $item->unit_id, (float) $item->qty, $customerGroupId, 'online');

            return [
                'id' => $item->id,
                'product' => $item->product->only(['id', 'name', 'slug']),
                'unit' => $item->unit?->only(['id', 'name', 'symbol']),
                'qty' => (float) $item->qty,
                'quote' => $quote,
            ];
        });

        return Inertia::render('storefront/Checkout', [
            'cart' => $cart,
            'store' => $store,
            'addresses' => $addresses,
            'items' => $items,
            'subtotal' => round((float) $items->sum(fn (array $item): float => $item['quote']['subtotal']), 2),
        ]);
    }

    public function store(StoreCheckoutRequest $request, CheckoutOnlineAction $action): RedirectResponse
    {
        $cart = $this->resolveCart($request);
        if (! $cart || $cart->items->isEmpty()) {
            return redirect()->route('cart.index');
        }

        $store = StoreLocation::query()->where('is_main', true)->firstOrFail();

        try {
            $order = $action->execute(
                $cart,
                $store,
                $request->validated(),
                auth('customer')->id(),
                (string) ($request->cookie('cart_session') ?? $cart->session_id ?? auth('customer')->id()),
                $request->file('payment_proof'),
            );
        } catch (RuntimeException $exception) {
            return back()->withInput()->with('error', $exception->getMessage());
        }

        return redirect()->route('checkout.success', ['order' => $order->id])->with('success', "Pesanan {$order->order_number} berhasil dibuat. Silakan selesaikan pembayaran.");
    }

    public function previewVoucher(Request $request, PriceResolutionService $priceResolutionService, PromotionEngine $promotionEngine): JsonResponse
    {
        $data = $request->validate([
            'voucher_code' => ['required', 'string', 'max:50'],
        ]);
        $cart = $this->resolveCart($request);
        if ($cart === null || $cart->items->isEmpty()) {
            return response()->json([
                'message' => 'Keranjang belanja kosong. Tambahkan produk terlebih dahulu.',
            ], 422);
        }

        $store = StoreLocation::query()
            ->where('is_main', true)
            ->where('is_active', true)
            ->firstOrFail();
        $customerId = auth('customer')->id();
        $customerGroupId = auth('customer')->user()?->customer_group_id;
        $items = $this->quotedItems($cart, $priceResolutionService, $customerGroupId);
        $subtotal = round((float) collect($items)->sum(fn (array $item): float => $item['quote']['subtotal']), 2);

        try {
            $promotionResult = $promotionEngine->calculate(
                $store->id,
                'online',
                collect($items)->map(fn (array $item): array => [
                    'product_id' => $item['product']['id'],
                    'category_id' => $item['product']['category_id'],
                    'brand_id' => $item['product']['brand_id'],
                    'qty' => $item['qty'],
                    'price_per_unit' => $item['quote']['unit_price'],
                    'subtotal' => $item['quote']['subtotal'],
                ])->all(),
                $subtotal,
                $data['voucher_code'],
                $customerId,
            );
        } catch (ValidationException $exception) {
            return response()->json([
                'message' => collect($exception->errors())->flatten()->first() ?? 'Voucher tidak dapat digunakan.',
            ], 422);
        }

        $voucherApplied = collect($promotionResult['applied_promotions'])
            ->contains(fn (array $promotion): bool => $promotion['voucher_id'] !== null);
        if (! $voucherApplied) {
            return response()->json([
                'message' => 'Voucher belum memenuhi syarat transaksi ini.',
            ], 422);
        }

        return response()->json([
            'voucher_code' => mb_strtoupper(trim($data['voucher_code'])),
            'subtotal' => $subtotal,
            'discount_total' => $promotionResult['discount_total'],
            'total' => round($subtotal - $promotionResult['discount_total'], 2),
            'applied_promotions' => collect($promotionResult['applied_promotions'])
                ->map(fn (array $promotion): array => [
                    'name' => $promotion['name'],
                    'amount' => $promotion['amount'],
                    'cashback' => $promotion['cashback'] ?? 0,
                    'voucher_id' => $promotion['voucher_id'],
                ])->values()->all(),
        ]);
    }

    public function success(Order $order): Response
    {
        return Inertia::render('storefront/CheckoutSuccess', [
            'order' => $order->only(['id', 'order_number', 'total_amount', 'customer_id']),
        ]);
    }

    /**
     * @return array<int, array{id:int,product:array{id:int,name:string,slug:string,category_id:int|null,brand_id:int|null},unit:array{id:int,name:string,symbol:string}|null,qty:float,quote:array<string,mixed>}>
     */
    private function quotedItems(Cart $cart, PriceResolutionService $priceResolutionService, ?int $customerGroupId): array
    {
        return $cart->items->map(function ($item) use ($priceResolutionService, $customerGroupId): array {
            $quote = $priceResolutionService->quote(
                $item->product,
                (int) $item->product->store_id,
                (int) $item->unit_id,
                (float) $item->qty,
                $customerGroupId,
                'online',
            );

            return [
                'id' => $item->id,
                'product' => $item->product->only(['id', 'name', 'slug', 'category_id', 'brand_id']),
                'unit' => $item->unit?->only(['id', 'name', 'symbol']),
                'qty' => (float) $item->qty,
                'quote' => $quote,
            ];
        })->values()->all();
    }
}
