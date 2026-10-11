<?php

namespace Database\Factories;

use App\Models\SubOrder;
use App\Models\Order;
use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SubOrder>
 */
class SubOrderFactory extends Factory
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
            'vendor_id' => Vendor::factory(),
            'sub_order_number' => fake()->unique()->numerify('SUB-########'),
            'subtotal_price' => 100000,
            'commission_rate' => 10,
            'commission_amount' => 10000,
            'vendor_net_amount' => 90000,
        ];
    }
}
