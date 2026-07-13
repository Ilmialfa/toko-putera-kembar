<?php

namespace Database\Factories;

use App\Models\StoreLocation;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Warehouse>
 */
class WarehouseFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'store_location_id' => StoreLocation::factory(),
            'name' => 'Gudang '.fake()->unique()->word(),
            'code' => fake()->unique()->bothify('WH-###'),
            'is_default' => false,
            'is_active' => true,
        ];
    }
}
