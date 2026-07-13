<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class CmsPage extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    public function sections(): HasMany
    {
        return $this->hasMany(CmsSection::class);
    }
}
