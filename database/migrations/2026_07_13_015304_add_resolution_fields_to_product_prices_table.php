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
        Schema::table('product_prices', function (Blueprint $table) {
            $table->string('price_type', 30)->default('retail')->after('unit_id')->index();
            $table->decimal('max_qty', 15, 3)->nullable()->after('min_qty');
            $table->string('channel', 10)->default('both')->after('price')->index();

            $table->index(['product_id', 'unit_id', 'price_type', 'is_active'], 'product_price_resolution_index');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_prices', function (Blueprint $table) {
            $table->dropIndex('product_price_resolution_index');
            $table->dropColumn(['price_type', 'max_qty', 'channel']);
        });
    }
};
