<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SubOrder;
use App\Models\Vendor;
use App\Models\VendorInventory;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class VendorWorkspaceTest extends TestCase
{
    use RefreshDatabase;

    public function test_settings_update_only_owned_public_fields_and_preserve_slug(): void
    {
        $vendor = Vendor::factory()->create(['commission_rate' => 12, 'status' => 'pending', 'slug' => 'stable-store']);
        $other = Vendor::factory()->create(['store_name' => 'Other']);
        $this->actingAs($vendor->user, 'sanctum')->putJson('/api/v1/vendors/me', [
            'store_name' => 'New Name', 'bank_sheba' => 'ir'.str_repeat('1', 24),
            'status' => 'approved', 'commission_rate' => 0, 'user_id' => $other->user_id, 'slug' => 'changed',
        ])->assertOk()->assertJsonPath('data.store_name', 'New Name')
            ->assertJsonPath('data.slug', 'stable-store')->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.commission_rate', 12)->assertJsonPath('data.bank_sheba', 'IR'.str_repeat('1', 24));
        $this->assertSame('Other', $other->fresh()->store_name);
        $this->putJson('/api/v1/vendors/me', ['store_name' => 'Name', 'bank_sheba' => 'IR123'])
            ->assertUnprocessable()->assertJsonValidationErrors('bank_sheba');
    }

    public function test_suspended_store_cannot_change_settings(): void
    {
        $vendor = Vendor::factory()->create(['status' => 'suspended']);
        $this->actingAs($vendor->user, 'sanctum')->putJson('/api/v1/vendors/me', ['store_name' => 'Changed'])->assertForbidden();
    }

    public function test_product_search_and_status_filters_are_scoped_and_paginated(): void
    {
        $vendor = Vendor::factory()->create();
        $product = Product::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Needle', 'status' => 'pending']);
        Product::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Needle approved', 'status' => 'approved']);
        Product::factory()->create(['name' => 'Needle', 'status' => 'pending', 'vendor_id' => Vendor::factory()->create()->id]);
        $this->actingAs($vendor->user, 'sanctum')->getJson('/api/v1/vendors/me/products?search=Needle&status=pending&per_page=1')
            ->assertOk()->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.id', $product->id);
        $this->getJson('/api/v1/vendors/me/products?per_page=500')->assertUnprocessable();
    }

    public function test_low_stock_filter_uses_available_stock_and_omits_archived_products(): void
    {
        $vendor = Vendor::factory()->create();
        $low = VendorInventory::factory()->create(['vendor_id' => $vendor->id, 'quantity' => 10, 'reserved_quantity' => 7]);
        VendorInventory::factory()->create(['vendor_id' => $vendor->id, 'quantity' => 0]);
        VendorInventory::factory()->create(['vendor_id' => $vendor->id, 'quantity' => 9]);
        $archived = VendorInventory::factory()->create(['vendor_id' => $vendor->id, 'quantity' => 2]);
        $archived->variant->product->delete();
        VendorInventory::factory()->create(['quantity' => 2]);
        $this->actingAs($vendor->user, 'sanctum')->getJson('/api/v1/vendors/me/inventory?stock=low')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $low->id);
    }

    public function test_stale_inventory_edits_return_conflict_without_overwriting_stock(): void
    {
        $stock = VendorInventory::factory()->create(['quantity' => 10, 'lock_version' => 0]);
        $this->actingAs($stock->vendor->user, 'sanctum');
        $this->putJson('/api/v1/vendors/me/inventory/'.$stock->id, ['quantity' => 12, 'lock_version' => 0])
            ->assertOk()->assertJsonPath('data.lock_version', 1);
        $this->putJson('/api/v1/vendors/me/inventory/'.$stock->id, ['quantity' => 50, 'lock_version' => 0])->assertConflict();
        $this->assertSame(12, $stock->fresh()->quantity);
        $this->assertDatabaseHas('inventory_logs', ['vendor_inventory_id' => $stock->id, 'type' => 'vendor_adjustment', 'change_quantity' => 2]);
        $this->assertDatabaseCount('inventory_logs', 1);
    }

    public function test_customer_reservation_invalidates_an_open_inventory_editor(): void
    {
        $stock = VendorInventory::factory()->create(['quantity' => 10, 'lock_version' => 0]);
        app(InventoryService::class)->reserve($stock->id, 1);
        $this->actingAs($stock->vendor->user, 'sanctum')
            ->putJson('/api/v1/vendors/me/inventory/'.$stock->id, ['quantity' => 20, 'lock_version' => 0])->assertConflict();
        $this->assertSame(10, $stock->fresh()->quantity);
    }

    public function test_stale_product_editor_rolls_back_product_and_stock_changes(): void
    {
        $vendor = Vendor::factory()->create();
        $product = Product::factory()->create(['vendor_id' => $vendor->id, 'name' => 'Original']);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $stock = VendorInventory::factory()->create(['vendor_id' => $vendor->id, 'variant_id' => $variant->id, 'quantity' => 8, 'lock_version' => 2]);
        $this->actingAs($vendor->user, 'sanctum')->getJson('/api/v1/vendors/me/products/'.$product->id)
            ->assertOk()->assertJsonPath('data.variants.0.inventories.0.lock_version', 2);
        $this->putJson('/api/v1/vendors/me/products/'.$product->id, [
            'name' => 'Stale update', 'variants' => [['id' => $variant->id, 'quantity' => 20, 'lock_version' => 1]],
        ])->assertConflict();
        $this->assertSame('Original', $product->fresh()->name);
        $this->assertSame(8, $stock->fresh()->quantity);
    }

    public function test_order_search_payment_filter_and_detail_respect_store_ownership(): void
    {
        $vendor = Vendor::factory()->create();
        $sub = SubOrder::factory()->create(['vendor_id' => $vendor->id, 'sub_order_number' => 'FIND-123',
            'order_id' => Order::factory()->create(['payment_status' => 'paid'])->id]);
        SubOrder::factory()->create(['vendor_id' => $vendor->id, 'sub_order_number' => 'FIND-UNPAID']);
        $other = SubOrder::factory()->create(['sub_order_number' => 'FIND-OTHER']);
        $this->actingAs($vendor->user, 'sanctum')->getJson('/api/v1/vendors/me/orders?search=FIND&payment_status=paid')
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $sub->id);
        $this->getJson('/api/v1/vendors/me/orders/'.$other->id)->assertNotFound();
        $this->patchJson('/api/v1/vendors/me/orders/'.$sub->id.'/status', ['status' => 'processing', 'note' => 'Ready for packing'])
            ->assertOk()->assertJsonPath('data.history.0.note', 'Ready for packing');
    }

    public function test_order_details_include_recorded_status_history(): void
    {
        $sub = SubOrder::factory()->create(['status' => OrderStatus::Confirmed,
            'order_id' => Order::factory()->create(['payment_status' => 'paid', 'status' => 'confirmed'])->id]);
        $this->actingAs($sub->vendor->user, 'sanctum')->patchJson('/api/v1/vendors/me/orders/'.$sub->id.'/status', [
            'status' => 'processing', 'note' => 'Packing',
        ])->assertOk();
        $this->getJson('/api/v1/vendors/me/orders/'.$sub->id)->assertOk()
            ->assertJsonPath('data.history.0.to_status', 'processing')->assertJsonPath('data.history.0.note', 'Packing');
    }

    public function test_analytics_compares_equal_periods_and_fulfillment_excludes_unpaid_orders(): void
    {
        $this->travelTo(now()->startOfDay()->addHours(12));
        $vendor = Vendor::factory()->create();
        foreach ([[now(), 200], [now()->subDays(7), 100], [now()->subDays(15), 900]] as [$date, $amount]) {
            SubOrder::factory()->create(['vendor_id' => $vendor->id, 'status' => 'confirmed',
                'order_id' => Order::factory()->create(['payment_status' => 'paid'])->id,
                'subtotal_price' => $amount, 'created_at' => $date]);
        }
        SubOrder::factory()->create(['vendor_id' => $vendor->id, 'status' => 'confirmed']);
        $this->actingAs($vendor->user, 'sanctum')->getJson('/api/v1/vendors/me/analytics?days=7')
            ->assertOk()->assertJsonPath('data.totals.revenue', 200)
            ->assertJsonPath('data.previous_totals.revenue', 100)
            ->assertJsonPath('data.revenue_change_percent', 100)
            ->assertJsonPath('data.fulfillment.to_prepare', 3)->assertJsonCount(7, 'data.daily');
    }

    public function test_csv_export_respects_selected_period_and_escapes_formula_cells(): void
    {
        $vendor = Vendor::factory()->create();
        SubOrder::factory()->create(['vendor_id' => $vendor->id, 'sub_order_number' => '=DANGER']);
        SubOrder::factory()->create(['vendor_id' => $vendor->id, 'sub_order_number' => 'OLD-ORDER', 'created_at' => now()->subDays(10)]);
        SubOrder::factory()->create(['sub_order_number' => 'OTHER-STORE']);
        $response = $this->actingAs($vendor->user, 'sanctum')->get('/api/v1/vendors/me/orders-export?days=7')->assertOk();
        $csv = $response->streamedContent();
        $this->assertStringContainsString("'=DANGER", $csv);
        $this->assertStringNotContainsString('OLD-ORDER', $csv);
        $this->assertStringNotContainsString('OTHER-STORE', $csv);
        $this->assertStringContainsString('payment_status', $csv);
    }
}
