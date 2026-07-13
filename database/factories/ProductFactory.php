<?php

namespace Database\Factories;

use App\Models\Category;
use App\Models\Product;
use App\Models\StoreLocation;
use App\Models\Unit;
use App\Models\Warehouse;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Product>
 */
class ProductFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);

        return [
            'store_id' => StoreLocation::factory(),
            'name' => Str::title($name),
            'slug' => Str::slug($name).'-'.fake()->unique()->numberBetween(100, 99999),
            'sku' => fake()->unique()->bothify('PRD-######'),
            'qr_code' => (string) Str::uuid(),
            'category_id' => Category::factory(),
            'default_warehouse_id' => Warehouse::factory(),
            'base_unit_id' => Unit::factory(),
            'product_type' => 'physical',
            'costing_method' => 'WAC',
            'is_active' => true,
            'is_sellable' => true,
            'sellable_pos' => true,
            'sellable_online' => true,
            'is_preorder' => false,
            'stok_saat_ini' => fake()->randomFloat(3, 0, 500),
            'hpp_current' => fake()->randomFloat(4, 1000, 100000),
        ];
    }
}
