<?php

namespace Database\Factories;

use App\Models\ProductVariant;
use App\Models\Vendor;
use App\Models\VendorInventory;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<VendorInventory>
 */
class VendorInventoryFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'vendor_id' => Vendor::factory(),
            'variant_id' => ProductVariant::factory(),
            'price' => 100000,
            'quantity' => 20,
            'reserved_quantity' => 0,
        ];
    }
}
