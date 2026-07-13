<?php

namespace Database\Factories;

use App\Models\ProductPrice;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ProductPrice>
 */
class ProductPriceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'price_type' => 'retail',
            'min_qty' => 1,
            'price' => fake()->numberBetween(5000, 250000),
            'channel' => 'both',
            'is_active' => true,
        ];
    }
}
