<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property string $conditionable_type
 * @property int $conditionable_id
 * @property string|int|float|null $min_qty
 */
class PromotionCondition extends Model
{
    use HasFactory;

    protected $guarded = ['id'];
}
