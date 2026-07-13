<?php

namespace App\Domain\Storefront\Controllers;

use App\Domain\Storefront\Actions\CheckoutOnlineAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\StoreCheckoutRequest;
use App\Models\Cart;
use App\Models\StoreLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;

class CheckoutController extends Controller
{
    private function resolveCart(Request $request): ?Cart
    {
        if (auth('customer')->check()) {
            return Cart::with('items.product.prices')->where('customer_id', auth('customer')->id())->first();
        } elseif ($request->cookie('cart_session')) {
            return Cart::with('items.product.prices')->where('session_id', $request->cookie('cart_session'))->first();
        }

        return null;
    }

    public function index(Request $request): Response|RedirectResponse
    {
        $cart = $this->resolveCart($request);
        if (! $cart || $cart->items->isEmpty()) {
            return redirect()->route('cart.index')->with('error', 'Keranjang belanja kosong.');
        }

        $store = StoreLocation::first();
        $addresses = [];
        if (auth('customer')->check()) {
            $addresses = auth('customer')->user()->addresses;
        }

        return Inertia::render('storefront/Checkout', [
            'cart' => $cart,
            'store' => $store,
            'addresses' => $addresses,
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

        return redirect()->route('storefront.index')->with('success', "Pesanan {$order->order_number} berhasil dibuat. Silakan selesaikan pembayaran.");
    }
}
