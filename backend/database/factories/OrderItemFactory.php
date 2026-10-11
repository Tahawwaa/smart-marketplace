<?php

namespace Database\Factories;

use App\Models\OrderItem;
use App\Models\SubOrder;
use App\Models\VendorInventory;
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
            'sub_order_id' => SubOrder::factory(),
            'vendor_inventory_id' => VendorInventory::factory(),
            'product_name_snapshot' => fake()->words(3, true),
            'variant_sku_snapshot' => fake()->unique()->bothify('SKU-####'),
            'unit_price' => 100000,
            'quantity' => 1,
            'total_price' => 100000,
        ];
    }
}
