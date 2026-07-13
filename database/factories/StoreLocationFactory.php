<?php

namespace Database\Factories;

use App\Models\StoreLocation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StoreLocation>
 */
class StoreLocationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'address' => fake()->address(),
            'latitude' => fake()->latitude(-0.6, 0.6),
            'longitude' => fake()->longitude(100.5, 102.5),
            'delivery_radius_km' => 10,
            'phone' => fake()->numerify('08##########'),
            'is_main' => false,
            'is_active' => true,
        ];
    }
}
