<?php

namespace App\Support\Traits;

use App\Models\StoreLocation;
use App\Support\CurrentStoreResolver;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToStore
{
    /**
     * Boot the trait to automatically apply the store scope.
     */
    protected static function bootBelongsToStore(): void
    {
        static::addGlobalScope('store', function (Builder $builder) {
            if ($storeId = app(CurrentStoreResolver::class)->getStoreId()) {
                $builder->where($builder->getModel()->getTable().'.store_id', $storeId);
            }
        });

        static::creating(function ($model) {
            if (! $model->store_id) {
                $model->store_id = app(CurrentStoreResolver::class)->getStoreId();
            }
        });
    }

    /**
     * Relation to StoreLocation
     */
    public function store(): BelongsTo
    {
        return $this->belongsTo(StoreLocation::class, 'store_id');
    }
}
