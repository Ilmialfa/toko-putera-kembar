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
        Schema::create('product_prices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained('products')->cascadeOnDelete();
            $table->foreignId('store_id')->constrained('store_locations')->cascadeOnDelete();

            $table->foreignId('customer_group_id')->nullable()->constrained('customer_groups')->nullOnDelete();
            $table->foreignId('unit_id')->nullable()->constrained('units')->nullOnDelete();

            $table->decimal('min_qty', 15, 3)->default(1);
            $table->decimal('price', 15, 2);

            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('discount_percent', 5, 2)->default(0);

            $table->dateTime('active_from')->nullable();
            $table->dateTime('active_until')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // Priority lookup index
            $table->index(['product_id', 'store_id', 'customer_group_id', 'unit_id', 'is_active'], 'idx_price_lookup');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_prices');
    }
};
