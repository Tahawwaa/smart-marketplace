<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ProductStatus;
use App\Enums\UserRole;
use App\Enums\VendorStatus;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\SubOrder;
use App\Models\User;
use App\Models\Vendor;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminApiTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => UserRole::Admin]);
    }

    public function test_admin_routes_reject_guests_and_non_admins(): void
    {
        $this->getJson('/api/v1/admin/dashboard')->assertUnauthorized();

        $customer = User::factory()->create(['role' => UserRole::Customer]);
        $this->actingAs($customer, 'sanctum')->getJson('/api/v1/admin/dashboard')->assertForbidden();

        $vendorUser = User::factory()->create(['role' => UserRole::Vendor]);
        $this->actingAs($vendorUser, 'sanctum')->getJson('/api/v1/admin/users')->assertForbidden();
    }

    public function test_dashboard_reports_revenue_from_paid_orders_only(): void
    {
        Order::factory()->create(['payment_status' => PaymentStatus::Paid, 'grand_total' => 500000]);
        Order::factory()->create(['payment_status' => PaymentStatus::Pending, 'grand_total' => 900000]);
        Order::factory()->create(['payment_status' => PaymentStatus::Failed, 'grand_total' => 700000]);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/v1/admin/dashboard')
            ->assertOk()
            ->assertJsonPath('data.cards.revenue_total', 500000)
            ->assertJsonPath('data.cards.orders_total', 3);
    }

    public function test_dashboard_trend_has_one_bucket_per_day(): void
    {
        $response = $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/v1/admin/dashboard?trend_days=7')
            ->assertOk();

        $this->assertCount(7, $response->json('data.revenue_trend'));
    }

    public function test_dashboard_counts_pending_queues(): void
    {
        Vendor::factory()->create(['status' => VendorStatus::Pending]);
        Product::factory()->create(['status' => ProductStatus::Pending]);

        $response = $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/v1/admin/dashboard')
            ->assertOk();

        $this->assertSame(1, $response->json('data.pending_queues.vendors'));
        $this->assertSame(1, $response->json('data.pending_queues.products'));
    }

    public function test_admin_can_approve_a_pending_vendor(): void
    {
        $vendor = Vendor::factory()->create(['status' => VendorStatus::Pending, 'approved_at' => null]);

        $this->actingAs($this->admin(), 'sanctum')
            ->patchJson("/api/v1/admin/vendors/{$vendor->id}/status", ['status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertNotNull($vendor->fresh()->approved_at);
    }

    public function test_admin_can_suspend_a_vendor(): void
    {
        $vendor = Vendor::factory()->create(['status' => VendorStatus::Approved]);

        $this->actingAs($this->admin(), 'sanctum')
            ->patchJson("/api/v1/admin/vendors/{$vendor->id}/status", ['status' => 'suspended'])
            ->assertOk()
            ->assertJsonPath('data.status', 'suspended');
    }

    public function test_admin_can_filter_vendors_by_status(): void
    {
        Vendor::factory()->create(['status' => VendorStatus::Pending]);
        Vendor::factory()->create(['status' => VendorStatus::Approved]);

        $this->actingAs($this->admin(), 'sanctum')
            ->getJson('/api/v1/admin/vendors?status=pending')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_approving_a_product_publishes_it(): void
    {
        $product = Product::factory()->create([
            'status' => ProductStatus::Pending,
            'is_active' => false,
        ]);

        $this->actingAs($this->admin(), 'sanctum')
            ->patchJson("/api/v1/admin/products/{$product->id}/status", ['status' => 'approved'])
            ->assertOk()
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.is_active', true);
    }

    public function test_rejecting_a_product_hides_it(): void
    {
        $product = Product::factory()->create([
            'status' => ProductStatus::Pending,
            'is_active' => true,
        ]);

        $this->actingAs($this->admin(), 'sanctum')
            ->patchJson("/api/v1/admin/products/{$product->id}/status", ['status' => 'rejected'])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);
    }

    public function test_admin_can_cancel_an_order_and_its_sub_orders(): void
    {
        $order = Order::factory()->create(['status' => OrderStatus::Confirmed]);
        $subOrder = SubOrder::factory()->create([
            'order_id' => $order->id,
            'status' => OrderStatus::Confirmed,
        ]);

        $this->actingAs($this->admin(), 'sanctum')
            ->patchJson("/api/v1/admin/orders/{$order->id}/status", [
                'status' => 'cancelled',
                'note' => 'درخواست مشتری',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'cancelled');

        $this->assertSame(OrderStatus::Cancelled, $subOrder->fresh()->status);
        $this->assertDatabaseHas('order_status_histories', [
            'sub_order_id' => $subOrder->id,
            'to_status' => 'cancelled',
        ]);
    }

    public function test_admin_order_status_must_be_a_known_value(): void
    {
        $order = Order::factory()->create();

        $this->actingAs($this->admin(), 'sanctum')
            ->patchJson("/api/v1/admin/orders/{$order->id}/status", ['status' => 'teleported'])
            ->assertStatus(422);
    }

    public function test_admin_can_deactivate_a_user(): void
    {
        $user = User::factory()->create(['is_active' => true]);

        $this->actingAs($this->admin(), 'sanctum')
            ->putJson("/api/v1/admin/users/{$user->id}", ['is_active' => false])
            ->assertOk()
            ->assertJsonPath('data.is_active', false);
    }

    public function test_admin_cannot_delete_their_own_account(): void
    {
        $admin = $this->admin();

        $this->actingAs($admin, 'sanctum')
            ->deleteJson("/api/v1/admin/users/{$admin->id}")
            ->assertStatus(422);
    }

    public function test_admin_cannot_delete_the_last_admin(): void
    {
        $actor = $this->admin();
        $other = $this->admin();

        // Two admins exist, so removing one is fine.
        $this->actingAs($actor, 'sanctum')
            ->deleteJson("/api/v1/admin/users/{$actor->id}")
            ->assertStatus(422);

        $this->actingAs($other, 'sanctum')
            ->deleteJson("/api/v1/admin/users/{$actor->id}")
            ->assertNoContent();

        $this->actingAs($other, 'sanctum')
            ->deleteJson("/api/v1/admin/users/{$other->id}")
            ->assertStatus(422);
    }

    public function test_admin_can_manage_categories_and_brands(): void
    {
        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/v1/admin/categories', ['name' => 'لوازم خانگی'])
            ->assertCreated()
            ->assertJsonPath('data.name', 'لوازم خانگی')
            ->assertJsonPath('data.slug', 'لوازم-خانگی');

        $this->actingAs($this->admin(), 'sanctum')
            ->postJson('/api/v1/admin/brands', ['name' => 'Bosch'])
            ->assertCreated()
            ->assertJsonPath('data.slug', 'bosch');
    }

    public function test_a_category_with_products_cannot_be_deleted(): void
    {
        $category = Category::factory()->create();
        Product::factory()->create(['category_id' => $category->id]);

        $this->actingAs($this->admin(), 'sanctum')
            ->deleteJson("/api/v1/admin/categories/{$category->id}")
            ->assertStatus(422);
    }

    public function test_a_brand_with_products_cannot_be_deleted(): void
    {
        $brand = Brand::create(['name' => 'Sony', 'slug' => 'sony']);
        Product::factory()->create(['brand_id' => $brand->id]);

        $this->actingAs($this->admin(), 'sanctum')
            ->deleteJson("/api/v1/admin/brands/{$brand->id}")
            ->assertStatus(422);
    }

    public function test_admin_can_change_a_vendor_commission_rate(): void
    {
        $vendor = Vendor::factory()->create(['commission_rate' => 10]);

        $this->actingAs($this->admin(), 'sanctum')
            ->putJson("/api/v1/admin/vendors/{$vendor->id}", ['commission_rate' => 12.5])
            ->assertOk()
            ->assertJsonPath('data.commission_rate', 12.5);
    }

    public function test_commission_rate_above_one_hundred_is_rejected(): void
    {
        $vendor = Vendor::factory()->create();

        $this->actingAs($this->admin(), 'sanctum')
            ->putJson("/api/v1/admin/vendors/{$vendor->id}", ['commission_rate' => 140])
            ->assertStatus(422);
    }
}
