<?php

namespace Database\Seeders;

use App\Enums\UserRole;
use App\Models\Category;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorInventory;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'role' => UserRole::Admin,
        ]);

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

        // حساب مدیر شخصی؛ در محیط توسعه با ایمیل teenhuntero0o0@gmail.com و رمز taha1242
        // وارد شوید. این اعتبارنامه فقط برای کار محلی است و در محیط عملیاتی نباید seed شود.
        User::factory()->create([
            'name' => 'Taha',
            'email' => 'teenhuntero0o0@gmail.com',
            'password' => 'taha1242',
            'role' => UserRole::Admin,
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
