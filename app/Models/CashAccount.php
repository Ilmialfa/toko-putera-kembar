<?php

namespace App\Models;

use App\Support\Traits\BelongsToStore;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CashAccount extends Model
{
    use BelongsToStore, HasFactory;

    protected $fillable = ['store_id', 'name', 'type', 'current_balance', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
        'current_balance' => 'decimal:2',
    ];

    protected $guarded = ['id'];
}
