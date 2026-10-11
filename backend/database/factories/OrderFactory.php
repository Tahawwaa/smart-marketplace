<?php

namespace Database\Factories;

use App\Models\Order;
use App\Models\User;
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
            'user_id' => User::factory(),
            'order_number' => fake()->unique()->numerify('ORD-########'),
            'shipping_address_snapshot' => ['city' => fake()->city()],
            'total_items_price' => 100000,
            'total_shipping_fee' => 0,
            'grand_total' => 100000,
        ];
    }
}
