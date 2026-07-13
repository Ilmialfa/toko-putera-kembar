<?php

namespace Database\Factories;

use App\Models\Supplier;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Supplier>
 */
class SupplierFactory extends Factory
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
            'code' => fake()->unique()->bothify('SUP-####'),
            'contact_person' => fake()->name(),
            'phone' => fake()->numerify('08##########'),
            'email' => fake()->companyEmail(),
            'address' => fake()->address(),
            'payment_terms_days' => 30,
            'is_active' => true,
        ];
    }
}
