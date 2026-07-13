<?php

namespace App\Models;

use App\Support\Traits\Auditable;
use App\Support\Traits\BelongsToStore;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Supplier extends Model
{
    use Auditable, BelongsToStore, HasFactory, SoftDeletes;

    protected $guarded = ['id'];
}
