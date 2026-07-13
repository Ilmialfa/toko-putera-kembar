<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('stock_ledgers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('store_locations')->cascadeOnDelete();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('warehouse_id')->constrained('warehouses')->cascadeOnDelete();
            $table->foreignId('batch_id')->nullable()->constrained('product_batches')->nullOnDelete();

            $table->string('movement_type', 20); // in, out
            $table->decimal('qty', 15, 3); // always positive
            $table->decimal('qty_running_balance', 15, 3);
            $table->decimal('hpp_at_time', 15, 4);

            $table->string('reference_type', 50);
            $table->unsignedBigInteger('reference_id');

            $table->string('notes', 255)->nullable();
            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();

            // Only created_at, immutable
            $table->timestamp('created_at')->useCurrent();

            // Indexes
            $table->index(['product_id', 'warehouse_id', 'created_at']);
            $table->index(['reference_type', 'reference_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_ledgers');
    }
};
