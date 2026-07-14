<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('sale_returns', function (Blueprint $table) {
            $table->foreignId('store_id')
                ->nullable()
                ->after('id')
                ->constrained('store_locations')
                ->nullOnDelete();
            $table->index(['store_id', 'created_at']);
        });

        DB::statement(
            'UPDATE sale_returns SET store_id = (SELECT store_id FROM sales WHERE sales.id = sale_returns.sale_id) WHERE store_id IS NULL'
        );
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sale_returns', function (Blueprint $table) {
            $table->dropIndex(['store_id', 'created_at']);
            $table->dropConstrainedForeignId('store_id');
        });
    }
};
