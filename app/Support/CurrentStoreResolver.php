<?php

namespace App\Support;

use App\Models\StoreLocation;

class CurrentStoreResolver
{
    protected ?int $storeId = null;

    /**
     * Resolve and get the current store ID.
     */
    public function getStoreId(): ?int
    {
        if ($this->storeId !== null) {
            return $this->storeId;
        }

        try {
            $mainStore = StoreLocation::where('is_main', true)->first();
            $this->storeId = $mainStore?->id;
        } catch (\Throwable) {
            // Table may not exist yet (e.g., during testing before migration)
            $this->storeId = null;
        }

        return $this->storeId;
    }

    /**
     * Manually set the current store ID.
     */
    public function setStoreId(int $storeId): void
    {
        $this->storeId = $storeId;
    }
}
