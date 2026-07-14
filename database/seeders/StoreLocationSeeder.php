<?php

namespace Database\Seeders;

use App\Models\StoreLocation;
use Illuminate\Database\Seeder;

class StoreLocationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        StoreLocation::firstOrCreate(
            ['is_main' => true],
            [
                'name' => 'Toko Putera Kembar Utama',
                'address' => 'Jl. Grosir No. 1, Pekanbaru, Riau',
                'latitude' => 0.5600695,
                'longitude' => 101.4419508,
                'delivery_radius_km' => 3.00,
                'phone' => '081234567890',
                'operating_hours_json' => [
                    'monday' => ['08:00', '20:00'],
                    'tuesday' => ['08:00', '20:00'],
                    'wednesday' => ['08:00', '20:00'],
                    'thursday' => ['08:00', '20:00'],
                    'friday' => ['08:00', '20:00'],
                    'saturday' => ['08:00', '20:00'],
                    'sunday' => ['09:00', '17:00'],
                ],
                'is_active' => true,
            ]
        );
    }
}
