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
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('online_display_unit_id')
                ->nullable()
                ->after('base_unit_id')
                ->constrained('units')
                ->nullOnDelete();
            $table->string('display_price_prefix', 10)->default('exact')->after('online_display_unit_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('online_display_unit_id');
            $table->dropColumn('display_price_prefix');
        });
    }
};
