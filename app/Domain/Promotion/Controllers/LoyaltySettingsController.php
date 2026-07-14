<?php

namespace App\Domain\Promotion\Controllers;

use App\Domain\Promotion\Services\LoyaltySettingsService;
use App\Http\Controllers\Controller;
use App\Http\Requests\Promotion\SaveLoyaltySettingsRequest;
use App\Models\StoreLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LoyaltySettingsController extends Controller
{
    public function edit(Request $request, LoyaltySettingsService $loyaltySettings): Response
    {
        $store = $this->storeFor($request);

        return Inertia::render('promotions/LoyaltySettings', [
            'settings' => $loyaltySettings->forStore($store),
        ]);
    }

    public function update(SaveLoyaltySettingsRequest $request, LoyaltySettingsService $loyaltySettings): RedirectResponse
    {
        $loyaltySettings->update($this->storeFor($request), $request->validated());

        return back()->with('success', 'Aturan poin pelanggan berhasil disimpan.');
    }

    private function storeFor(Request $request): StoreLocation
    {
        return StoreLocation::query()
            ->whereKey($request->user()?->store_id)
            ->firstOrFail();
    }
}
