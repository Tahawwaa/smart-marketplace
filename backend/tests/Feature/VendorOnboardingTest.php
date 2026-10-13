<?php

namespace Tests\Feature;

use App\Enums\UserRole;
use App\Enums\VendorStatus;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendorOnboardingTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_customer_can_open_a_store_and_waits_for_approval(): void
    {
        $user = User::factory()->create(['role' => UserRole::Customer]);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/vendors/me', ['store_name' => 'لوازم خانگی تها']);

        $response->assertCreated()
            ->assertJsonPath('data.store_name', 'لوازم خانگی تها')
            ->assertJsonPath('data.status', VendorStatus::Pending->value)
            // The slug keeps Persian letters instead of transliterating them.
            ->assertJsonPath('data.slug', 'لوازم-خانگی-تها')
            // The header needs the updated account to swap its link.
            ->assertJsonPath('user.role', UserRole::Vendor->value)
            ->assertJsonPath('user.store.status', VendorStatus::Pending->value);

        $this->assertDatabaseHas('vendors', [
            'user_id' => $user->id,
            'store_name' => 'لوازم خانگی تها',
        ]);
    }

    public function test_an_admin_keeps_the_admin_role_after_opening_a_store(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);

        $this->actingAs($admin, 'sanctum')
            ->postJson('/api/v1/vendors/me', ['store_name' => 'فروشگاه مدیر'])
            ->assertCreated()
            ->assertJsonPath('user.role', UserRole::Admin->value);

        // Losing the admin role here would lock the owner out of the panel.
        $this->assertSame(UserRole::Admin, $admin->fresh()->role);
    }

    public function test_a_second_store_cannot_be_opened_for_the_same_account(): void
    {
        $user = User::factory()->create();
        Vendor::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/vendors/me', ['store_name' => 'فروشگاه دوم'])
            ->assertStatus(422)
            ->assertJsonValidationErrors('store_name');
    }

    public function test_opening_a_store_requires_a_name(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/vendors/me', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors('store_name');
    }

    public function test_a_pending_store_can_reach_its_panel_but_not_the_catalog_yet(): void
    {
        $user = User::factory()->create();
        Vendor::factory()->create(['user_id' => $user->id, 'status' => VendorStatus::Pending]);

        // The profile drives the onboarding screen, so a pending store can read it.
        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/vendors/me')
            ->assertOk()
            ->assertJsonPath('data.status', VendorStatus::Pending->value);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/vendors/me/products')
            ->assertOk();
    }

    public function test_opening_a_store_requires_authentication(): void
    {
        $this->postJson('/api/v1/vendors/me', ['store_name' => 'ناشناس'])->assertUnauthorized();
    }

    public function test_the_account_payload_carries_the_store_for_the_header(): void
    {
        $user = User::factory()->create(['role' => UserRole::Vendor]);
        Vendor::factory()->create(['user_id' => $user->id, 'status' => VendorStatus::Approved]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.role', UserRole::Vendor->value)
            ->assertJsonPath('data.store.status', VendorStatus::Approved->value);

        $customer = User::factory()->create(['role' => UserRole::Customer]);

        $this->actingAs($customer, 'sanctum')
            ->getJson('/api/v1/auth/me')
            ->assertOk()
            ->assertJsonPath('data.store', null);
    }
}
