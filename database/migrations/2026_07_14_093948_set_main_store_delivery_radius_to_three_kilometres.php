<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasTable('store_locations')) {
            return;
        }

        DB::table('store_locations')
            ->where('is_main', true)
            ->update(['delivery_radius_km' => 3]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('store_locations')) {
            return;
        }

        DB::table('store_locations')
            ->where('is_main', true)
            ->update(['delivery_radius_km' => 7]);
    }
};
