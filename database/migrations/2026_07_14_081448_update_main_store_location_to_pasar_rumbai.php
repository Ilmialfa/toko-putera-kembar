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
            ->update([
                'latitude' => 0.5600695,
                'longitude' => 101.4419508,
                'delivery_radius_km' => 7,
            ]);
    }

    public function down(): void
    {
        if (! Schema::hasTable('store_locations')) {
            return;
        }

        DB::table('store_locations')
            ->where('is_main', true)
            ->update([
                'latitude' => 0.5071000,
                'longitude' => 101.4478000,
                'delivery_radius_km' => 7,
            ]);
    }
};
