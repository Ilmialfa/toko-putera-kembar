<?php

namespace Database\Factories;

use App\Models\StockReservation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<StockReservation>
 */
class StockReservationFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'session_id' => fake()->uuid(),
            'qty' => fake()->randomFloat(3, 1, 20),
            'status' => 'active',
            'expires_at' => now()->addMinutes(15),
        ];
    }
}
