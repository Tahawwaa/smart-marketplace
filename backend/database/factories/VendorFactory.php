<?php

namespace Database\Factories;

use App\Models\Vendor;
use App\Enums\VendorStatus;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Vendor>
 */
class VendorFactory extends Factory
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
            'store_name' => fake()->company(),
            'slug' => fake()->unique()->slug(),
            'commission_rate' => 10,
            'status' => VendorStatus::Approved,
        ];
    }
}
