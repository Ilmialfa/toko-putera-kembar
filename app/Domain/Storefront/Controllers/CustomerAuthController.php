<?php

namespace App\Domain\Storefront\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\CustomerLoginRequest;
use App\Http\Requests\Storefront\CustomerRegisterRequest;
use App\Http\Requests\Storefront\SaveCustomerAddressRequest;
use App\Http\Requests\Storefront\UpdateCustomerProfileRequest;
use App\Models\Customer;
use App\Models\CustomerAddress;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CustomerAuthController extends Controller
{
    public function showLogin(): Response
    {
        return Inertia::render('storefront/auth/Login');
    }

    public function login(CustomerLoginRequest $request): RedirectResponse
    {
        $request->authenticate();
        $request->session()->regenerate();

        return redirect()->intended(route('customer.account'));
    }

    public function showRegister(): Response
    {
        return Inertia::render('storefront/auth/Register');
    }

    public function register(CustomerRegisterRequest $request): RedirectResponse
    {
        $customer = Customer::create($request->validated());
        Auth::guard('customer')->login($customer);
        $request->session()->regenerate();

        return redirect()->route('customer.account')->with('success', 'Akun pelanggan berhasil dibuat.');
    }

    public function account(Request $request): Response
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');

        $orders = $customer->orders()
            ->withCount('items')
            ->latest()
            ->paginate(10);

        $points = $customer->points()->latest()->limit(10)->get();

        return Inertia::render('storefront/Account', [
            'customer' => $customer->load('group:id,name'),
            'orders' => $orders,
            'addresses' => $customer->addresses()->latest('is_default')->latest()->get(),
            'points' => $points,
            'pointBalance' => (int) $customer->loyalty_point_balance,
        ]);
    }

    public function updateProfile(UpdateCustomerProfileRequest $request): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');
        $customer->update($request->validated());

        return back()->with('success', 'Profil akun berhasil diperbarui.');
    }

    public function storeAddress(SaveCustomerAddressRequest $request): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');
        $validated = $request->validated();

        DB::transaction(function () use ($customer, $validated): void {
            $shouldBeDefault = ($validated['is_default'] ?? false) || ! $customer->addresses()->exists();

            if ($shouldBeDefault) {
                $customer->addresses()->update(['is_default' => false]);
            }

            $customer->addresses()->create([
                ...$validated,
                'is_default' => $shouldBeDefault,
            ]);
        });

        return back()->with('success', 'Alamat berhasil ditambahkan.');
    }

    public function updateAddress(SaveCustomerAddressRequest $request, CustomerAddress $address): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');
        abort_unless($address->customer_id === $customer->id, 404);

        $validated = $request->validated();
        DB::transaction(function () use ($customer, $address, $validated): void {
            if ($validated['is_default'] ?? false) {
                $customer->addresses()->where('id', '!=', $address->id)->update(['is_default' => false]);
            }

            $address->update($validated);
        });

        return back()->with('success', 'Alamat berhasil diperbarui.');
    }

    public function destroyAddress(Request $request, CustomerAddress $address): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');
        abort_unless($address->customer_id === $customer->id, 404);

        $wasDefault = $address->is_default;
        $address->delete();

        if ($wasDefault) {
            $customer->addresses()->oldest()->first()?->update(['is_default' => true]);
        }

        return back()->with('success', 'Alamat berhasil dihapus.');
    }

    public function makeDefaultAddress(Request $request, CustomerAddress $address): RedirectResponse
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');
        abort_unless($address->customer_id === $customer->id, 404);

        DB::transaction(function () use ($customer, $address): void {
            $customer->addresses()->update(['is_default' => false]);
            $address->update(['is_default' => true]);
        });

        return back()->with('success', 'Alamat utama diperbarui.');
    }

    public function showOrder(Request $request, Order $order): Response
    {
        /** @var Customer $customer */
        $customer = $request->user('customer');
        abort_unless($order->customer_id === $customer->id, 404);

        return Inertia::render('storefront/OrderDetail', [
            'order' => $order->load(['address', 'items.product', 'items.unit', 'statusHistories']),
        ]);
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('customer')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('storefront.index');
    }
}
