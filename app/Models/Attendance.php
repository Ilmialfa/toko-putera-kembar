<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use RuntimeException;

class Attendance extends Model
{
    use HasFactory;

    public const UPDATED_AT = null;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'captured_at_server' => 'datetime',
            'captured_at_device' => 'datetime',
            'is_within_radius' => 'boolean',
            'latitude' => 'decimal:7',
            'longitude' => 'decimal:7',
            'accuracy_meters' => 'decimal:2',
            'distance_from_store_meters' => 'decimal:2',
        ];
    }

    protected static function booted(): void
    {
        static::updating(fn (): never => throw new RuntimeException('Data absensi bersifat immutable.'));
        static::deleting(fn (): never => throw new RuntimeException('Data absensi bersifat immutable.'));
    }

    public function employee(): BelongsTo
    {
        return $this->belongsTo(Employee::class);
    }

    public function storeLocation(): BelongsTo
    {
        return $this->belongsTo(StoreLocation::class);
    }

    public function matchedStoreLocation(): BelongsTo
    {
        return $this->belongsTo(StoreLocation::class, 'matched_store_location_id');
    }
}
