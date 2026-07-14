<?php

namespace App\Domain\Promotion\Services;

use App\Models\StoreLocation;

class LoyaltySettingsService
{
    /** @var array<string, int|bool> */
    private const DEFAULTS = [
        'enabled' => true,
        'earn_spend_amount' => 10000,
        'earn_points' => 1,
        'redeem_value' => 100,
        'redeem_min_points' => 50,
        'redeem_max_points' => 500,
        'redeem_max_percentage' => 50,
        'expiry_months' => 12,
    ];

    /** @return array<string, int|bool> */
    public function forStore(StoreLocation $store): array
    {
        $settings = $store->settings;
        $loyalty = is_array($settings) && is_array($settings['loyalty'] ?? null)
            ? $settings['loyalty']
            : [];

        return [...self::DEFAULTS, ...$loyalty];
    }

    /** @param array<string, int|bool> $settings */
    public function update(StoreLocation $store, array $settings): void
    {
        $storeSettings = is_array($store->settings) ? $store->settings : [];
        $storeSettings['loyalty'] = [...self::DEFAULTS, ...$settings];

        $store->update(['settings' => $storeSettings]);
    }
}
