<?php

namespace Database\Factories;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\StoreLocation;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Order>
 */
class OrderFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'store_id' => StoreLocation::factory(),
            'order_number' => 'ORD-'.fake()->unique()->numerify('########'),
            'recipient_name' => fake()->name(),
            'recipient_phone' => fake()->numerify('08##########'),
            'delivery_address' => fake()->address(),
            'delivery_latitude' => 0.5071,
            'delivery_longitude' => 101.4478,
            'distance_km' => 2.5,
            'delivery_fee' => 5000,
            'subtotal' => 20000,
            'discount_total' => 0,
            'total_amount' => 25000,
            'payment_method' => 'bank_transfer',
            'status' => OrderStatus::PENDING_PAYMENT,
            'qr_tracking_code' => fake()->unique()->uuid(),
        ];
    }
}
