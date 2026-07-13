<?php

namespace App\Models;

use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Unit extends Model
{
    use Auditable, HasFactory, SoftDeletes;

    protected $guarded = ['id'];
}
