<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }

    public function stockIn()
    {
        return $this->belongsTo(StockIn::class);
    }

    public function payments()
    {
        return $this->morphMany(PaymentRecord::class, 'payable');
    }
}
