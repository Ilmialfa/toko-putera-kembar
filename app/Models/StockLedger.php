<?php

namespace App\Models;

use App\Support\Traits\BelongsToStore;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class StockLedger extends Model
{
    use BelongsToStore, HasFactory;

    // Stock Ledger is append-only. We don't use updated_at.
    const UPDATED_AT = null;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'qty' => 'decimal:3',
            'qty_running_balance' => 'decimal:3',
            'hpp_at_time' => 'decimal:4',
        ];
    }

    protected static function booted(): void
    {
        parent::booted();

        // Enforce immutability
        static::updating(function ($model) {
            throw new \RuntimeException('Stock Ledger is append-only and cannot be updated.');
        });

        static::deleting(function ($model) {
            throw new \RuntimeException('Stock Ledger is append-only and cannot be deleted.');
        });
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class);
    }

    public function batch(): BelongsTo
    {
        return $this->belongsTo(ProductBatch::class, 'batch_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reference(): MorphTo
    {
        return $this->morphTo('reference');
    }
}
