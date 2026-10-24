<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorInventory;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        if (! app()->environment(['local', 'testing'])) {
            throw new \RuntimeException('Demo accounts may only be seeded in local or testing environments.');
        }

        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'role' => UserRole::Admin,
        ]);

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        Category::factory(3)->create();

        $vendor = Vendor::factory()->create([
            'user_id' => User::factory()->create([
                'name' => 'Vendor User',
                'email' => 'vendor@example.com',
                'role' => UserRole::Vendor,
            ])->id,
        ]);

        VendorInventory::factory(5)->create(['vendor_id' => $vendor->id]);
    }
}
