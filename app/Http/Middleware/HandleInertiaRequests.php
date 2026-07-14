<?php

namespace App\Http\Middleware;

use App\Models\Cart;
use App\Models\StoreLocation;
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
        $user = $request->user('web');
        $userPayload = null;
        if ($user !== null) {
            $user->loadMissing('roles:id,name');
            $userPayload = [
                ...$user->only(['id', 'name', 'email', 'avatar_path', 'is_active', 'must_change_password']),
                'roles' => $user->roles->pluck('name')->values(),
                'permissions' => $user->getAllPermissions()->pluck('name')->values(),
            ];
        }

        $cartCount = 0;
        $customer = auth('customer')->user();
        if ($request->isMethod('GET')) {
            if ($customer !== null) {
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
                'user' => $userPayload,
                'customer' => $customer?->only(['id', 'name', 'loyalty_point_balance']),
            ],
            'cart_count' => $cartCount,
            'storefront_delivery' => fn (): ?array => StoreLocation::query()
                ->where('is_main', true)
                ->where('is_active', true)
                ->first(['name', 'latitude', 'longitude', 'delivery_radius_km'])
                ?->only(['name', 'latitude', 'longitude', 'delivery_radius_km']),
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ];
    }
}
