<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Models\Order;
use App\Models\SubOrder;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendorAnalyticsTest extends TestCase
{
    use RefreshDatabase;

    public function test_analytics_requires_authentication(): void
    {
        $this->getJson('/api/v1/vendors/me/analytics')->assertUnauthorized();
    }

    public function test_analytics_sums_only_the_callers_sold_orders(): void
    {
        $user = User::factory()->create(['role' => UserRole::Vendor]);
        $vendor = Vendor::factory()->create(['user_id' => $user->id]);
        $other = Vendor::factory()->create();

        SubOrder::factory()->create([
            'vendor_id' => $vendor->id,
            'status' => OrderStatus::Delivered,
            'order_id' => Order::factory()->create(['payment_status' => 'paid'])->id,
            'subtotal_price' => 1000,
            'commission_amount' => 100,
            'vendor_net_amount' => 900,
        ]);
        SubOrder::factory()->create([
            'vendor_id' => $vendor->id,
            'status' => OrderStatus::Cancelled,
            'subtotal_price' => 5000,
        ]);
        SubOrder::factory()->create([
            'vendor_id' => $other->id,
            'status' => OrderStatus::Delivered,
            'order_id' => Order::factory()->create(['payment_status' => 'paid'])->id,
            'subtotal_price' => 7000,
        ]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/vendors/me/analytics?days=7')
            ->assertOk()
            ->assertJsonPath('data.totals.orders', 1)
            ->assertJsonPath('data.totals.revenue', 1000)
            ->assertJsonPath('data.totals.net', 900)
            ->assertJsonCount(7, 'data.daily');
    }

    public function test_analytics_rejects_an_unsupported_period(): void
    {
        $user = User::factory()->create(['role' => UserRole::Vendor]);
        Vendor::factory()->create(['user_id' => $user->id]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/vendors/me/analytics?days=5')
            ->assertUnprocessable();
    }

    public function test_orders_can_be_exported_as_csv(): void
    {
        $user = User::factory()->create(['role' => UserRole::Vendor]);
        $vendor = Vendor::factory()->create(['user_id' => $user->id]);
        $sub = SubOrder::factory()->create(['vendor_id' => $vendor->id]);

        $response = $this->actingAs($user, 'sanctum')->get('/api/v1/vendors/me/orders-export');

        $response->assertOk();
        $this->assertStringContainsString($sub->sub_order_number, $response->streamedContent());
    }
}
