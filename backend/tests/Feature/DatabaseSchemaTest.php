<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\UserRole;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorInventory;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class DatabaseSchemaTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_default_to_customer_role(): void
    {
        $user = User::factory()->create()->refresh();

        $this->assertSame(UserRole::Customer, $user->role);
    }

    public function test_order_graph_relations_and_casts_work(): void
    {
        $item = OrderItem::factory()->create();
        $subOrder = $item->subOrder;

        $this->assertInstanceOf(Order::class, $subOrder->order);
        $this->assertSame(OrderStatus::Pending, $subOrder->refresh()->status);
        $this->assertTrue($subOrder->items->contains($item));
        $this->assertInstanceOf(VendorInventory::class, $item->inventory);
        $this->assertIsArray($subOrder->order->shipping_address_snapshot);
    }

    public function test_soft_deleted_vendor_is_hidden_but_kept(): void
    {
        $vendor = Vendor::factory()->create();
        $vendor->delete();

        $this->assertNull(Vendor::find($vendor->id));
        $this->assertNotNull(Vendor::withTrashed()->find($vendor->id));
    }

    public function test_variant_cannot_have_two_values_of_the_same_attribute(): void
    {
        $attributeId = DB::table('attributes')->insertGetId(['name' => 'Color']);
        $red = DB::table('attribute_values')->insertGetId(['attribute_id' => $attributeId, 'value' => 'Red']);
        $blue = DB::table('attribute_values')->insertGetId(['attribute_id' => $attributeId, 'value' => 'Blue']);
        $variant = ProductVariant::factory()->create();

        DB::table('variant_attribute_values')->insert([
            'variant_id' => $variant->id, 'attribute_id' => $attributeId, 'attribute_value_id' => $red,
        ]);

        $this->expectException(QueryException::class);

        DB::table('variant_attribute_values')->insert([
            'variant_id' => $variant->id, 'attribute_id' => $attributeId, 'attribute_value_id' => $blue,
        ]);
    }

    public function test_financial_rows_cannot_be_removed_with_their_parent(): void
    {
        $item = OrderItem::factory()->create();

        $this->expectException(QueryException::class);

        DB::table('sub_orders')->where('id', $item->sub_order_id)->delete();
    }

    public function test_product_factory_creates_approved_product(): void
    {
        $product = Product::factory()->create()->refresh();

        $this->assertSame('approved', $product->status->value);
    }

    public function test_category_depth_is_derived_from_the_parent_chain(): void
    {
        $root = Category::factory()->create(['parent_id' => null]);
        $child = Category::factory()->create(['parent_id' => $root->id]);
        $grandchild = Category::factory()->create(['parent_id' => $child->id]);

        $this->assertSame(0, $root->refresh()->depth);
        $this->assertSame(1, $child->refresh()->depth);
        $this->assertSame(2, $grandchild->refresh()->depth);
    }
}
