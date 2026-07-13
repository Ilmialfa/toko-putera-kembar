<?php

namespace App\Jobs;

use App\Models\StockReservation;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;
use Throwable;

class ReleaseExpiredReservationsJob implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [10, 60, 300];

    /**
     * Create a new job instance.
     */
    public function __construct()
    {
        //
    }

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        StockReservation::query()
            ->where('status', 'active')
            ->where('expires_at', '<=', now())
            ->chunkById(200, function ($reservations): void {
                foreach ($reservations as $reservation) {
                    $reservation->update(['status' => 'released']);
                }
            });
    }

    public function failed(?Throwable $exception): void
    {
        Log::error('Gagal melepas reservasi stok kedaluwarsa.', ['error' => $exception?->getMessage()]);
    }
}
