<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Unit;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OrderItem>
 */
class OrderItemFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'order_id' => Order::factory(),
            'product_id' => Product::factory(),
            'unit_id' => Unit::factory(),
            'qty' => 2,
            'qty_base_unit' => 2,
            'price_per_unit' => 10000,
            'discount_amount' => 0,
            'subtotal' => 20000,
        ];
    }
}
