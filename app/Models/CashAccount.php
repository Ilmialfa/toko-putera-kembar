<?php

namespace App\Models;

use App\Support\Traits\BelongsToStore;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/** @property string|int|float $current_balance */
class CashAccount extends Model
{
    use BelongsToStore, HasFactory;

    protected $fillable = ['store_id', 'name', 'type', 'current_balance', 'is_active'];

    protected $guarded = ['id'];

    /** @return array<string, string> */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'current_balance' => 'decimal:2',
        ];
    }
}
