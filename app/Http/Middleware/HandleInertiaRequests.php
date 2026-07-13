<?php

namespace App\Http\Middleware;

use App\Models\Cart;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $cartCount = 0;
        if ($request->isMethod('GET')) {
            if (auth('customer')->check()) {
                $cartCount = (int) (Cart::query()
                    ->where('customer_id', auth('customer')->id())
                    ->withCount('items')
                    ->value('items_count') ?? 0);
            } elseif ($request->cookie('cart_session')) {
                $cartCount = (int) (Cart::query()
                    ->where('session_id', $request->cookie('cart_session'))
                    ->withCount('items')
                    ->value('items_count') ?? 0);
            }
        }

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $request->user(),
                'customer' => auth('customer')->user(),
            ],
            'cart_count' => $cartCount,
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
