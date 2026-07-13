<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ChartOfAccount extends Model
{
    protected $fillable = ['code', 'name', 'type', 'is_active'];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
