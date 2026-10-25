<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Enums\VendorStatus;
use App\Models\Category;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SubOrder;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorInventory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendorApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: User, 1: Vendor}
     */
    private function vendor(): array
    {
        $user = User::factory()->create(['role' => UserRole::Vendor]);
        $vendor = Vendor::factory()->create(['user_id' => $user->id]);

        return [$user, $vendor];
    }

    /**
     * @return array<string, mixed>
     */
    private function productPayload(): array
    {
        return [
            'category_id' => Category::factory()->create()->id,
            'name' => 'هدفون آزمایشی',
            'description' => 'توضیح کوتاه',
            'variants' => [
                [
                    'price' => 250000,
                    'sale_price' => 210000,
                    'quantity' => 7,
                    'lead_time_days' => 2,
                ],
            ],
        ];
    }

    public function test_vendor_routes_require_authentication(): void
    {
        $this->getJson('/api/v1/vendors/me')->assertUnauthorized();
        $this->getJson('/api/v1/vendors/me/products')->assertUnauthorized();
        $this->getJson('/api/v1/vendors/me/inventory')->assertUnauthorized();
        $this->getJson('/api/v1/vendors/me/orders')->assertUnauthorized();
    }

    public function test_an_account_without_a_store_gets_an_empty_profile_and_403_elsewhere(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/vendors/me')
            ->assertOk()
            ->assertJsonPath('data', null);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/vendors/me/products')
            ->assertForbidden();
    }

    public function test_a_suspended_store_is_locked_out(): void
    {
        [$user, $vendor] = $this->vendor();
        $vendor->update(['status' => VendorStatus::Suspended]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/vendors/me/orders')
            ->assertForbidden();
    }

    public function test_the_profile_returns_the_callers_store(): void
    {
        [$user, $vendor] = $this->vendor();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/vendors/me')
            ->assertOk()
            ->assertJsonPath('data.id', $vendor->id)
            ->assertJsonPath('data.store_name', $vendor->store_name)
            ->assertJsonPath('data.status', 'approved');
    }

    public function test_a_product_is_created_with_its_variant_and_stock_row(): void
    {
        [$user, $vendor] = $this->vendor();

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/vendors/me/products', $this->productPayload());

        $response->assertCreated()
            ->assertJsonPath('data.name', 'هدفون آزمایشی')
            // New listings always wait for review, whatever the client asked for.
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.variants.0.inventories.0.price', 250000)
            ->assertJsonPath('data.variants.0.inventories.0.quantity', 7)
            ->assertJsonPath('data.variants.0.inventories.0.reserved_quantity', 0)
            ->assertJsonPath('data.variants.0.inventories.0.available_quantity', 7);

        $this->assertDatabaseHas('products', [
            'vendor_id' => $vendor->id,
            'name' => 'هدفون آزمایشی',
        ]);
        $this->assertDatabaseHas('vendor_inventories', [
            'vendor_id' => $vendor->id,
            'price' => 250000,
            'quantity' => 7,
        ]);
    }

    public function test_the_index_only_lists_the_callers_products(): void
    {
        [$user, $vendor] = $this->vendor();
        $otherVendor = Vendor::factory()->create();

        Product::factory()->create(['vendor_id' => $vendor->id, 'name' => 'کالای من']);
        Product::factory()->create(['vendor_id' => $otherVendor->id, 'name' => 'کالای دیگری']);
        // Seeded catalog rows have no vendor at all; they must stay hidden too.
        Product::factory()->create(['vendor_id' => null, 'name' => 'کالای بدون فروشنده']);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/vendors/me/products')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'کالای من');
    }

    public function test_a_product_belonging_to_another_store_cannot_be_touched(): void
    {
        [$user] = $this->vendor();
        $foreign = Product::factory()->create(['vendor_id' => Vendor::factory()->create()->id]);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/vendors/me/products/'.$foreign->id, ['name' => 'دستکاری'])
            ->assertNotFound();

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/v1/vendors/me/products/'.$foreign->id)
            ->assertNotFound();

        $this->assertNotSame('دستکاری', $foreign->fresh()->name);
        $this->assertNull($foreign->fresh()->deleted_at);
    }

    public function test_archiving_a_product_hides_its_stock(): void
    {
        [$user, $vendor] = $this->vendor();
        $product = Product::factory()->create(['vendor_id' => $vendor->id, 'is_active' => true]);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $inventory = VendorInventory::factory()->create([
            'vendor_id' => $vendor->id,
            'variant_id' => $variant->id,
            'is_available' => true,
        ]);

        $this->actingAs($user, 'sanctum')
            ->deleteJson('/api/v1/vendors/me/products/'.$product->id)
            ->assertNoContent();

        $this->assertNotNull($product->fresh()->deleted_at);
        $this->assertFalse($product->fresh()->is_active);
        $this->assertFalse((bool) $inventory->fresh()->is_available);
    }

    public function test_stock_can_be_updated_but_not_below_reserved_units(): void
    {
        [$user, $vendor] = $this->vendor();
        [$inventory] = $this->stockRow($vendor);
        $inventory->update(['quantity' => 10, 'reserved_quantity' => 4]);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/vendors/me/inventory/'.$inventory->id, [
                'quantity' => 2,
                'price' => 120000,
            ])
            ->assertOk()
            ->assertJsonPath('data.quantity', 4)
            ->assertJsonPath('data.price', 120000)
            ->assertJsonPath('data.available_quantity', 0);

        $this->assertSame(4, $inventory->fresh()->quantity);
    }

    public function test_a_sale_price_above_the_price_is_rejected(): void
    {
        [$user, $vendor] = $this->vendor();
        [$inventory] = $this->stockRow($vendor);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/vendors/me/inventory/'.$inventory->id, [
                'price' => 100000,
                'sale_price' => 150000,
            ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors('sale_price');
    }

    public function test_stock_of_another_store_cannot_be_updated(): void
    {
        [$user] = $this->vendor();
        [, $other] = $this->vendor();
        [$inventory] = $this->stockRow($other);

        $this->actingAs($user, 'sanctum')
            ->putJson('/api/v1/vendors/me/inventory/'.$inventory->id, ['quantity' => 99])
            ->assertNotFound();
    }

    public function test_the_order_list_only_shows_the_callers_sub_orders(): void
    {
        [$user, $vendor] = $this->vendor();
        [, $otherVendor] = $this->vendor();

        $order = Order::factory()->create();
        SubOrder::factory()->create(['order_id' => $order->id, 'vendor_id' => $vendor->id]);
        SubOrder::factory()->create(['order_id' => $order->id, 'vendor_id' => $otherVendor->id]);

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/vendors/me/orders')
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_a_sub_order_can_be_moved_along_with_an_audit_trail(): void
    {
        [$user, $vendor] = $this->vendor();
        $subOrder = SubOrder::factory()->create([
            'vendor_id' => $vendor->id,
            'order_id' => Order::factory()->create(['payment_status' => 'paid'])->id,
            'status' => OrderStatus::Pending,
        ]);

        $this->actingAs($user, 'sanctum')
            ->patchJson('/api/v1/vendors/me/orders/'.$subOrder->id.'/status', [
                'status' => 'confirmed',
                'note' => 'تأیید شد',
            ])
            ->assertOk()
            ->assertJsonPath('data.status', 'confirmed');

        $this->assertDatabaseHas('order_status_histories', [
            'sub_order_id' => $subOrder->id,
            'from_status' => 'pending',
            'to_status' => 'confirmed',
            'changed_by_user_id' => $user->id,
            'note' => 'تأیید شد',
        ]);
    }

    public function test_the_shopper_side_can_never_be_used_to_cancel(): void
    {
        [$user, $vendor] = $this->vendor();
        $subOrder = SubOrder::factory()->create(['vendor_id' => $vendor->id]);

        $this->actingAs($user, 'sanctum')
            ->patchJson('/api/v1/vendors/me/orders/'.$subOrder->id.'/status', ['status' => 'cancelled'])
            ->assertJsonValidationErrors('status');
    }

    public function test_another_stores_sub_order_cannot_be_moved(): void
    {
        [$user] = $this->vendor();
        $foreign = SubOrder::factory()->create(['vendor_id' => Vendor::factory()->create()->id]);

        $this->actingAs($user, 'sanctum')
            ->patchJson('/api/v1/vendors/me/orders/'.$foreign->id.'/status', ['status' => 'shipped'])
            ->assertNotFound();
    }

    /**
     * @return array{0: VendorInventory, 1: ProductVariant}
     */
    private function stockRow(Vendor $vendor): array
    {
        $product = Product::factory()->create(['vendor_id' => $vendor->id]);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $inventory = VendorInventory::factory()->create([
            'vendor_id' => $vendor->id,
            'variant_id' => $variant->id,
            'quantity' => 10,
            'reserved_quantity' => 0,
        ]);

        return [$inventory, $variant];
    }
}
