<?php

namespace App\Models;

use App\Support\Traits\Auditable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tag extends Model
{
    use Auditable, HasFactory;

    protected $guarded = ['id'];
}
