<?php

namespace App\Domain\Storefront\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\CustomerLoginRequest;
use App\Http\Requests\Storefront\CustomerRegisterRequest;
use App\Models\Customer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
        $orders = Auth::guard('customer')->user()?->orders()->latest()->limit(20)->get();

        return Inertia::render('storefront/Account', ['orders' => $orders]);
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::guard('customer')->logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('storefront.index');
    }
}
