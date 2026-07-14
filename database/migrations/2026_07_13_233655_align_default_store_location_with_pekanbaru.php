<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('store_locations')
            ->where('is_main', true)
            ->where('address', 'Jl. Grosir No. 1, Jakarta')
            ->update([
                'address' => 'Jl. Grosir No. 1, Pekanbaru, Riau',
                'latitude' => 0.5071000,
                'longitude' => 101.4478000,
                'delivery_radius_km' => 7,
            ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('store_locations')
            ->where('is_main', true)
            ->where('address', 'Jl. Grosir No. 1, Pekanbaru, Riau')
            ->update([
                'address' => 'Jl. Grosir No. 1, Jakarta',
                'latitude' => -6.2000000,
                'longitude' => 106.8166660,
                'delivery_radius_km' => 15,
            ]);
    }
};
