<?php

namespace App\Jobs;

use App\Models\Product;
use App\Models\ProductBatch;
use Carbon\CarbonImmutable;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class CheckExpiringProductsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

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
        $thresholdDate = now()->addDays(30);

        $expiringBatches = ProductBatch::with('product')
            ->where('qty_available', '>', 0)
            ->whereNotNull('expiry_date')
            ->where('expiry_date', '<=', $thresholdDate)
            ->get();

        foreach ($expiringBatches as $batch) {
            $productName = Product::query()->whereKey($batch->product_id)->value('name') ?? 'Unknown';

            Log::warning('Product batch expiring soon', [
                'batch_id' => $batch->id,
                'batch_number' => $batch->batch_number,
                'product_id' => $batch->product_id,
                'product_name' => $productName,
                'expiry_date' => CarbonImmutable::parse($batch->expiry_date)->toDateString(),
                'qty_available' => $batch->qty_available,
                'store_id' => $batch->store_id,
            ]);

            // In a real application, you would typically dispatch an email
            // or a database notification to store managers here.
        }
    }
}
