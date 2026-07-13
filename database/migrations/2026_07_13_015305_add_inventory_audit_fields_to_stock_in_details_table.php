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
        Schema::table('stock_in_details', function (Blueprint $table) {
            $table->decimal('qty_base_unit', 15, 3)->nullable()->after('qty');
            $table->decimal('subtotal', 15, 2)->nullable()->after('purchase_price_per_unit');
            $table->decimal('hpp_before', 15, 4)->nullable()->after('expiry_date');
            $table->decimal('hpp_after', 15, 4)->nullable()->after('hpp_before');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_in_details', function (Blueprint $table) {
            $table->dropColumn(['qty_base_unit', 'subtotal', 'hpp_before', 'hpp_after']);
        });
    }
};
