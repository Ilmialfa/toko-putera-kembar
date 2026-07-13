<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class ReconcileStockCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'inventory:reconcile {--product= : Specific product ID to reconcile} {--fix : Actually fix the discrepancies}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Reconcile stock_ledger against product stok_saat_ini';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $productId = $this->option('product');
        $fix = $this->option('fix');

        $query = Product::query();

        if ($productId) {
            $query->where('id', $productId);
        }

        $this->info('Starting stock reconciliation...');

        $discrepancies = 0;

        $query->chunkById(100, function ($products) use (&$discrepancies, $fix) {
            foreach ($products as $product) {
                // Sum qty in ledger. In = positive, Out = negative
                $ledgerQty = DB::table('stock_ledgers')
                    ->where('product_id', $product->id)
                    ->sum(DB::raw("CASE WHEN movement_type = 'in' THEN qty ELSE -qty END"));

                $ledgerQty = (float) $ledgerQty;
                $currentQty = (float) $product->stok_saat_ini;

                if (abs($ledgerQty - $currentQty) > 0.0001) {
                    $discrepancies++;
                    $this->warn("Discrepancy found for Product ID {$product->id}: Ledger = {$ledgerQty}, Current = {$currentQty}");

                    if ($fix) {
                        $product->stok_saat_ini = $ledgerQty;
                        $product->save();
                        $this->info("Fixed Product ID {$product->id} to {$ledgerQty}");
                    }
                }
            }
        });

        $this->info("Reconciliation complete. Total discrepancies found: {$discrepancies}");
    }
}
