<?php

namespace App\Models;

use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Promotion extends Model
{
    use Auditable, HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'start_date' => 'datetime',
            'end_date' => 'datetime',
            'is_active' => 'boolean',
            'is_stackable' => 'boolean',
            'storefront_visible' => 'boolean',
            'min_purchase_amount' => 'decimal:2',
            'max_discount_amount' => 'decimal:2',
        ];
    }

    /** @return HasMany<PromotionCondition, $this> */
    public function conditions(): HasMany
    {
        return $this->hasMany(PromotionCondition::class);
    }

    /** @return HasMany<PromotionReward, $this> */
    public function rewards(): HasMany
    {
        return $this->hasMany(PromotionReward::class);
    }

    public function vouchers(): HasMany
    {
        return $this->hasMany(Voucher::class);
    }

    public function usages(): HasMany
    {
        return $this->hasMany(PromotionUsage::class);
    }
}
