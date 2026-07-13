<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

class Payable extends Model
{
    protected $fillable = [
        'supplier_id',
        'stock_in_id',
        'amount',
        'paid_amount',
        'due_date',
        'status',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'paid_amount' => 'decimal:2',
        'due_date' => 'date',
    ];

    /** @return BelongsTo<Supplier, $this> */
    public function supplier(): BelongsTo
    {
        return $this->belongsTo(Supplier::class);
    }

    /** @return BelongsTo<StockIn, $this> */
    public function stockIn(): BelongsTo
    {
        return $this->belongsTo(StockIn::class);
    }

    /** @return MorphMany<PaymentRecord, $this> */
    public function payments(): MorphMany
    {
        return $this->morphMany(PaymentRecord::class, 'payable');
    }
}
