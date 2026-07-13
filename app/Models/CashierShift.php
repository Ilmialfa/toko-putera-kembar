<?php

namespace App\Models;

use App\Support\Traits\Auditable;
use App\Support\Traits\BelongsToStore;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CashierShift extends Model
{
    use Auditable, BelongsToStore, HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'opening_at' => 'datetime',
            'closing_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function movements(): HasMany
    {
        return $this->hasMany(CashMovement::class);
    }
}
