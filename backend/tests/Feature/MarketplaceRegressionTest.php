<?php

namespace Tests\Feature;

use App\Enums\OrderStatus;
use App\Enums\ProductStatus;
use App\Enums\UserRole;
use App\Exceptions\OutOfStockException;
use App\Models\Attribute;
use App\Models\Brand;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SubOrder;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorInventory;
use App\Services\CartService;
use App\Services\InventoryService;
use App\Services\PaymentService;
use App\Services\VendorCatalogService;
use Database\Seeders\DatabaseSeeder;
use Database\Seeders\DemoProductSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class MarketplaceRegressionTest extends TestCase
{
    use RefreshDatabase;

    public function test_registration_normalizes_email_before_checking_uniqueness(): void
    {
        User::factory()->create(['email' => 'shopper@example.com']);
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Shopper', 'email' => 'SHOPPER@example.com',
            'password' => 'password123', 'password_confirmation' => 'password123',
        ])->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_null_registration_role_defaults_to_customer(): void
    {
        $this->postJson('/api/v1/auth/register', [
            'name' => 'Shopper', 'email' => 'new@example.com', 'role' => null,
            'password' => 'password123', 'password_confirmation' => 'password123',
        ])->assertCreated()->assertJsonPath('user.role', 'customer');
    }

    public function test_deactivated_users_cannot_use_existing_tokens(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('existing')->plainTextToken;
        $user->update(['is_active' => false]);

        $this->withToken($token)->getJson('/api/v1/auth/me')->assertForbidden();
        $this->withToken($token)->getJson('/api/v1/cart')->assertForbidden();
    }

    public function test_expired_tokens_cannot_access_the_public_cart(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('expired', ['*'], now()->subMinute())->plainTextToken;
        $this->withToken($token)->getJson('/api/v1/cart')->assertUnauthorized();
    }

    public function test_configured_token_lifetime_applies_to_the_public_cart(): void
    {
        config(['sanctum.expiration' => 60]);
        app('auth')->forgetGuards();
        $token = User::factory()->create()->createToken('expired');
        $token->accessToken->forceFill(['created_at' => now()->subHours(2)])->save();
        $this->withToken($token->plainTextToken)->getJson('/api/v1/cart')->assertUnauthorized();
    }

    public function test_unapproved_products_are_hidden_everywhere(): void
    {
        $product = Product::factory()->create(['name' => 'Hidden Phone', 'status' => ProductStatus::Pending, 'is_active' => true]);
        $this->getJson('/api/v1/products')->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/products/popular')->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/products/suggest?q=Hidden')->assertJsonCount(0, 'data.products');
        $this->getJson('/api/v1/products/'.$product->slug)->assertNotFound();
        $this->getJson('/api/v1/products/'.$product->slug.'/recommendations')->assertNotFound();
    }

    public function test_suggestions_do_not_keep_showing_a_rejected_product(): void
    {
        $product = Product::factory()->create(['name' => 'Hidden Phone']);
        $this->getJson('/api/v1/products/suggest?q=Hidden')->assertJsonCount(1, 'data.products');
        $product->update(['status' => ProductStatus::Rejected]);
        $this->getJson('/api/v1/products/suggest?q=Hidden')->assertJsonCount(0, 'data.products');
    }

    public function test_default_catalog_includes_actual_prices_and_images(): void
    {
        $stock = VendorInventory::factory()->create(['price' => 150000, 'sale_price' => 120000]);
        $stock->variant->product->images()->create(['path' => '/products/phone.webp', 'is_primary' => true]);
        $this->getJson('/api/v1/products')->assertOk()
            ->assertJsonPath('data.0.price_from', 120000)
            ->assertJsonPath('data.0.images.0.path', '/products/phone.webp');
    }

    public function test_suspended_seller_stock_cannot_be_added_to_a_cart(): void
    {
        $stock = VendorInventory::factory()->create();
        $stock->vendor->update(['status' => 'suspended']);
        $this->withHeader('X-Cart-Session', 'regression-guest-session')
            ->postJson('/api/v1/cart/items', ['vendor_inventory_id' => $stock->id])
            ->assertUnprocessable();
    }

    public function test_rejected_products_already_in_the_cart_cannot_be_checked_out(): void
    {
        $user = User::factory()->create();
        $stock = VendorInventory::factory()->create();
        $cart = Cart::factory()->create(['user_id' => $user->id]);
        CartItem::factory()->create(['cart_id' => $cart->id, 'vendor_inventory_id' => $stock->id, 'quantity' => 1]);
        $stock->variant->product->update(['status' => ProductStatus::Rejected]);

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/orders', ['address' => [
            'province' => 'تهران', 'city' => 'تهران', 'address_line' => 'آزادی',
            'recipient_name' => 'خریدار', 'recipient_phone' => '09120000000',
        ]])->assertUnprocessable();
        $this->assertDatabaseCount('orders', 0);
        $this->assertDatabaseCount('cart_items', 1);
    }

    public function test_updating_a_cart_with_deleted_inventory_returns_validation_error(): void
    {
        $user = User::factory()->create();
        $item = CartItem::factory()->create(['cart_id' => Cart::factory()->create(['user_id' => $user->id])->id]);
        $item->inventory->delete();
        $this->actingAs($user, 'sanctum')->patchJson('/api/v1/cart/items/'.$item->id, ['quantity' => 2])
            ->assertUnprocessable();
    }

    public function test_cancelled_order_cannot_be_confirmed_by_an_existing_payment(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id]);
        $service = app(PaymentService::class);
        $payment = $service->start($user, $order)['payment'];
        $order->update(['status' => OrderStatus::Cancelled]);
        $this->actingAs($user, 'sanctum')->postJson('/api/v1/payments/'.$payment->id.'/verify')
            ->assertUnprocessable();
        $this->assertSame('pending', $order->fresh()->payment_status->value);
    }

    public function test_stale_payment_model_cannot_be_settled_twice(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create(['user_id' => $user->id]);
        $service = app(PaymentService::class);
        $payment = $service->start($user, $order)['payment'];
        $stale = $payment->fresh();
        $service->confirm($user, $payment);
        $this->expectException(ValidationException::class);
        $service->confirm($user, $stale);
    }

    public function test_stale_reservation_cannot_be_released_twice(): void
    {
        $stock = VendorInventory::factory()->create(['quantity' => 5]);
        $service = app(InventoryService::class);
        $reservation = $service->reserve($stock->id, 2);
        $stale = $reservation->fresh();
        $service->release($reservation);
        $service->release($stale);
        $this->assertSame(0, $stock->fresh()->reserved_quantity);
    }

    public function test_consuming_the_same_reservation_is_idempotent(): void
    {
        $stock = VendorInventory::factory()->create(['quantity' => 5]);
        $service = app(InventoryService::class);
        $reservation = $service->reserve($stock->id, 2);
        $stale = $reservation->fresh();
        $service->consume($reservation);
        $service->consume($stale);
        $this->assertSame(3, $stock->fresh()->quantity);
        $this->assertSame(0, $stock->fresh()->reserved_quantity);
        $this->assertDatabaseCount('inventory_logs', 1);
    }

    public function test_nonpositive_stock_reservations_are_rejected(): void
    {
        $stock = VendorInventory::factory()->create();
        $this->expectException(\InvalidArgumentException::class);
        app(InventoryService::class)->reserve($stock->id, -1);
    }

    public function test_category_cannot_be_moved_under_its_descendant(): void
    {
        $root = Category::factory()->create();
        $child = Category::factory()->create(['parent_id' => $root->id]);
        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]), 'sanctum')
            ->putJson('/api/v1/admin/categories/'.$root->id, ['parent_id' => $child->id])
            ->assertUnprocessable()->assertJsonValidationErrors('parent_id');
    }

    public function test_category_metadata_update_preserves_slug_and_updates_descendant_depths(): void
    {
        $root = Category::factory()->create();
        $parent = Category::factory()->create(['slug' => 'stable-url']);
        $child = Category::factory()->create(['parent_id' => $parent->id]);
        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]), 'sanctum')
            ->putJson('/api/v1/admin/categories/'.$parent->id, ['parent_id' => $root->id])
            ->assertOk()->assertJsonPath('data.slug', 'stable-url');
        $this->assertSame(2, $child->fresh()->depth);
    }

    public function test_last_active_admin_cannot_demote_or_deactivate_themself(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $this->actingAs($admin, 'sanctum')->putJson('/api/v1/admin/users/'.$admin->id, ['role' => 'customer'])
            ->assertUnprocessable();
        $this->actingAs($admin, 'sanctum')->putJson('/api/v1/admin/users/'.$admin->id, ['is_active' => false])
            ->assertUnprocessable();
    }

    public function test_vendor_can_fetch_a_product_outside_the_first_page(): void
    {
        $vendor = Vendor::factory()->create();
        $product = Product::factory()->create(['vendor_id' => $vendor->id]);
        Product::factory(16)->create(['vendor_id' => $vendor->id]);
        $this->actingAs($vendor->user, 'sanctum')->getJson('/api/v1/vendors/me/products/'.$product->id)
            ->assertOk()->assertJsonPath('data.id', $product->id);
    }

    public function test_vendor_variant_update_preserves_flags_and_accepts_stock_without_price(): void
    {
        $vendor = Vendor::factory()->create();
        $product = Product::factory()->create(['vendor_id' => $vendor->id]);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id, 'barcode' => 'OLD', 'is_active' => false]);
        $stock = VendorInventory::factory()->create(['vendor_id' => $vendor->id, 'variant_id' => $variant->id, 'quantity' => 5]);
        $this->actingAs($vendor->user, 'sanctum')->putJson('/api/v1/vendors/me/products/'.$product->id, [
            'variants' => [['id' => $variant->id, 'barcode' => null, 'quantity' => 9]],
        ])->assertOk();
        $this->assertNull($variant->fresh()->barcode);
        $this->assertFalse($variant->fresh()->is_active);
        $this->assertSame(9, $stock->fresh()->quantity);
    }

    public function test_duplicate_variant_skus_return_validation_errors(): void
    {
        $vendor = Vendor::factory()->create();
        $product = Product::factory()->create(['vendor_id' => $vendor->id]);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $other = ProductVariant::factory()->create();
        $this->actingAs($vendor->user, 'sanctum')->putJson('/api/v1/vendors/me/products/'.$product->id, [
            'variants' => [['id' => $variant->id, 'sku' => $other->sku]],
        ])->assertUnprocessable()->assertJsonValidationErrors('variants.0.sku');
    }

    public function test_vendor_cannot_reopen_a_cancelled_sub_order(): void
    {
        $vendor = Vendor::factory()->create();
        $sub = SubOrder::factory()->create(['vendor_id' => $vendor->id, 'status' => OrderStatus::Cancelled]);
        $this->actingAs($vendor->user, 'sanctum')->patchJson('/api/v1/vendors/me/orders/'.$sub->id.'/status', ['status' => 'shipped'])
            ->assertUnprocessable();
    }

    public function test_fulfilling_all_sub_orders_advances_the_parent_order(): void
    {
        $vendor = Vendor::factory()->create();
        $order = Order::factory()->create(['status' => OrderStatus::Shipped, 'payment_status' => 'paid']);
        $sub = SubOrder::factory()->create(['vendor_id' => $vendor->id, 'order_id' => $order->id, 'status' => OrderStatus::Shipped]);
        $this->actingAs($vendor->user, 'sanctum')->patchJson('/api/v1/vendors/me/orders/'.$sub->id.'/status', ['status' => 'delivered'])
            ->assertOk();
        $this->assertSame(OrderStatus::Delivered, $order->fresh()->status);
    }

    public function test_inactive_category_detail_is_hidden(): void
    {
        $category = Category::factory()->create(['is_active' => false]);
        $this->getJson('/api/v1/categories/'.$category->slug)->assertNotFound();
    }

    public function test_null_cart_quantity_defaults_to_one_and_repeated_adds_respect_the_limit(): void
    {
        $stock = VendorInventory::factory()->create(['quantity' => 500]);
        $this->withHeader('X-Cart-Session', 'regression-guest-session')
            ->postJson('/api/v1/cart/items', ['vendor_inventory_id' => $stock->id, 'quantity' => null])
            ->assertOk()->assertJsonPath('data.total_quantity', 1);
        $this->postJson('/api/v1/cart/items', ['vendor_inventory_id' => $stock->id, 'quantity' => 100])
            ->assertUnprocessable();
    }

    public function test_cancelling_an_order_restores_stock_once_and_records_both_histories(): void
    {
        $admin = User::factory()->create(['role' => UserRole::Admin]);
        $order = Order::factory()->create();
        $sub = SubOrder::factory()->create(['order_id' => $order->id]);
        $stock = VendorInventory::factory()->create(['quantity' => 8]);
        OrderItem::factory()->create(['sub_order_id' => $sub->id, 'vendor_inventory_id' => $stock->id, 'quantity' => 2]);
        $this->actingAs($admin, 'sanctum')->patchJson('/api/v1/admin/orders/'.$order->id.'/status', ['status' => 'cancelled'])->assertOk();
        $this->patchJson('/api/v1/admin/orders/'.$order->id.'/status', ['status' => 'cancelled'])->assertOk();
        $this->assertSame(10, $stock->fresh()->quantity);
        $this->assertDatabaseCount('inventory_logs', 1);
        $this->assertDatabaseHas('order_histories', ['order_id' => $order->id, 'to_status' => 'cancelled']);
        $this->assertDatabaseHas('order_status_histories', ['sub_order_id' => $sub->id, 'to_status' => 'cancelled']);
    }

    public function test_unpaid_orders_cannot_be_shipped_by_vendors(): void
    {
        $vendor = Vendor::factory()->create();
        $sub = SubOrder::factory()->create(['vendor_id' => $vendor->id]);
        $this->actingAs($vendor->user, 'sanctum')->patchJson('/api/v1/vendors/me/orders/'.$sub->id.'/status', ['status' => 'shipped'])
            ->assertUnprocessable();
    }

    public function test_expired_reservations_cannot_be_consumed(): void
    {
        $stock = VendorInventory::factory()->create();
        $service = app(InventoryService::class);
        $reservation = $service->reserve($stock->id, 1);
        $reservation->update(['expires_at' => now()->subMinute()]);
        $this->expectException(OutOfStockException::class);
        $service->consume($reservation);
    }

    public function test_updating_stock_does_not_restore_an_old_quantity_or_lose_reservations(): void
    {
        $stock = VendorInventory::factory()->create(['quantity' => 10]);
        $stale = $stock->fresh();
        $stock->update(['quantity' => 8]);
        app(InventoryService::class)->reserve($stock->id, 3);
        $service = app(VendorCatalogService::class);
        $service->updateStock($stale, ['price' => 900]);
        $this->assertSame(8, $stock->fresh()->quantity);
        $service->updateStock($stale, ['quantity' => 0]);
        $this->assertSame(3, $stock->fresh()->quantity);
    }

    public function test_vendor_product_detail_rejects_another_store(): void
    {
        $vendor = Vendor::factory()->create();
        $product = Product::factory()->create(['vendor_id' => Vendor::factory()->create()->id]);
        $this->actingAs($vendor->user, 'sanctum')->getJson('/api/v1/vendors/me/products/'.$product->id)->assertNotFound();
    }

    public function test_deleting_a_customer_with_order_history_returns_a_validation_error(): void
    {
        $user = User::factory()->create();
        Order::factory()->create(['user_id' => $user->id]);
        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]), 'sanctum')
            ->deleteJson('/api/v1/admin/users/'.$user->id)->assertUnprocessable();
        $this->assertDatabaseHas('users', ['id' => $user->id]);
    }

    public function test_brand_edits_keep_the_slug_and_refresh_product_search(): void
    {
        $brand = Brand::query()->create(['name' => 'Oldbrand', 'slug' => 'stable-brand']);
        Product::factory()->create(['brand_id' => $brand->id]);
        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]), 'sanctum')
            ->putJson('/api/v1/admin/brands/'.$brand->id, ['name' => 'Newbrand'])->assertOk()
            ->assertJsonPath('data.slug', 'stable-brand');
        $this->getJson('/api/v1/products?search=Newbrand')->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/products?search=Oldbrand')->assertJsonCount(0, 'data');
    }

    public function test_analytics_excludes_unpaid_orders_and_products_outside_the_selected_period(): void
    {
        $vendor = Vendor::factory()->create();
        $unpaid = SubOrder::factory()->create(['vendor_id' => $vendor->id, 'status' => 'delivered']);
        $old = SubOrder::factory()->create([
            'vendor_id' => $vendor->id, 'status' => 'delivered', 'created_at' => now()->subDays(40),
            'order_id' => Order::factory()->create(['payment_status' => 'paid'])->id,
        ]);
        foreach ([$old, $unpaid] as $sub) {
            OrderItem::factory()->create(['sub_order_id' => $sub->id]);
        }
        $this->actingAs($vendor->user, 'sanctum')->getJson('/api/v1/vendors/me/analytics?days=7')->assertOk()
            ->assertJsonPath('data.totals.orders', 0)->assertJsonCount(0, 'data.top_products');
    }

    public function test_demo_product_seeding_keeps_existing_products_and_carts_and_is_repeatable(): void
    {
        $item = CartItem::factory()->create();
        $productId = $item->inventory->variant->product_id;
        $this->seed(DemoProductSeeder::class);
        $count = Product::query()->count();
        $this->seed(DemoProductSeeder::class);
        $this->assertDatabaseHas('cart_items', ['id' => $item->id]);
        $this->assertDatabaseHas('products', ['id' => $productId]);
        $this->assertSame($count, Product::query()->count());
    }

    public function test_demo_seeder_creates_linen_coat_color_images(): void
    {
        Vendor::factory()->create();
        $this->seed(DemoProductSeeder::class);

        $product = Product::query()->where('slug', 'linen-coat')->firstOrFail();
        $this->assertSame('کت لینن آزاد', $product->name);
        $this->assertCount(3, $product->variants);
        $this->assertCount(3, $product->images);
        $this->assertTrue($product->images->every(fn ($image) => $image->variant_id !== null));
    }

    public function test_demo_accounts_cannot_be_seeded_in_production(): void
    {
        $this->app->instance('env', 'production');
        $this->expectException(\RuntimeException::class);
        app(DatabaseSeeder::class)->run();
    }

    public function test_legacy_order_currency_is_corrected_without_changing_amounts(): void
    {
        $order = Order::factory()->create(['currency' => 'IRR', 'grand_total' => 125000]);
        $migration = require database_path('migrations/2026_10_24_182929_normalize_order_currency_to_toman.php');
        $migration->up();
        $this->assertSame('IRT', $order->fresh()->currency);
        $this->assertSame('125000.00', $order->fresh()->grand_total);
        $this->assertSame('IRT', Order::factory()->create()->fresh()->currency);
    }

    public function test_reading_an_empty_guest_cart_does_not_create_a_database_row(): void
    {
        $this->withHeader('X-Cart-Session', 'empty-guest-session')
            ->getJson('/api/v1/cart')->assertOk()
            ->assertJsonCount(0, 'data.items')->assertJsonPath('data.currency', 'IRT');
        $this->assertDatabaseCount('carts', 0);
    }

    public function test_expired_guest_carts_are_neither_returned_nor_merged(): void
    {
        $guest = Cart::factory()->create([
            'user_id' => null, 'session_id' => 'expired-guest-session', 'expires_at' => now()->subMinute(),
        ]);
        CartItem::factory()->create(['cart_id' => $guest->id]);
        $this->withHeader('X-Cart-Session', $guest->session_id)
            ->getJson('/api/v1/cart')->assertOk()->assertJsonCount(0, 'data.items');
        $this->assertDatabaseCount('cart_items', 0);

        $guest = Cart::factory()->create([
            'user_id' => null, 'session_id' => 'expired-merge-session', 'expires_at' => now()->subMinute(),
        ]);
        CartItem::factory()->create(['cart_id' => $guest->id]);
        app(CartService::class)->mergeGuestCart(User::factory()->create(), $guest->session_id);
        $this->assertDatabaseCount('cart_items', 0);
        $this->assertDatabaseCount('carts', 0);
    }

    public function test_order_item_count_counts_lines_instead_of_vendors(): void
    {
        $order = Order::factory()->create();
        $sub = SubOrder::factory()->create(['order_id' => $order->id]);
        OrderItem::factory(2)->create(['sub_order_id' => $sub->id]);
        $this->actingAs($order->user, 'sanctum')->getJson('/api/v1/orders')
            ->assertOk()->assertJsonPath('data.0.items_count', 2);
        $this->getJson('/api/v1/orders/'.$order->id)->assertOk()->assertJsonPath('data.items_count', 2);
        $this->actingAs(User::factory()->create(['role' => UserRole::Admin]), 'sanctum')
            ->getJson('/api/v1/admin/orders')->assertOk()->assertJsonPath('data.0.items_count', 2);
    }

    public function test_attribute_filters_must_match_the_same_variant(): void
    {
        $product = Product::factory()->create();
        $color = Attribute::create(['name' => 'Color', 'slug' => 'color']);
        $size = Attribute::create(['name' => 'Size', 'slug' => 'size']);
        $red = $color->values()->create(['value' => 'red']);
        $large = $size->values()->create(['value' => 'large']);
        $first = ProductVariant::factory()->create(['product_id' => $product->id]);
        $second = ProductVariant::factory()->create(['product_id' => $product->id]);
        $first->attributeValues()->attach($red->id, ['attribute_id' => $color->id]);
        $second->attributeValues()->attach($large->id, ['attribute_id' => $size->id]);
        $this->getJson('/api/v1/products?attrs[color]=red&attrs[size]=large')->assertOk()->assertJsonCount(0, 'data');
        $first->attributeValues()->attach($large->id, ['attribute_id' => $size->id]);
        $this->getJson('/api/v1/products?attrs[color]=red&attrs[size]=large')->assertOk()->assertJsonCount(1, 'data');
    }

    public function test_zero_is_a_valid_attribute_filter_value(): void
    {
        Product::factory()->create();
        $variant = ProductVariant::factory()->create();
        $attribute = Attribute::create(['name' => 'Count', 'slug' => 'count']);
        $value = $attribute->values()->create(['value' => '0']);
        $variant->attributeValues()->attach($value->id, ['attribute_id' => $attribute->id]);
        $this->getJson('/api/v1/products?attrs[count]=0')->assertOk()
            ->assertJsonCount(1, 'data')->assertJsonPath('data.0.id', $variant->product_id);
    }

    public function test_duplicate_barcodes_in_one_update_are_rejected_without_partial_writes(): void
    {
        $vendor = Vendor::factory()->create();
        $product = Product::factory()->create(['vendor_id' => $vendor->id]);
        $variants = ProductVariant::factory(2)->create(['product_id' => $product->id]);
        $this->actingAs($vendor->user, 'sanctum')->putJson('/api/v1/vendors/me/products/'.$product->id, [
            'variants' => $variants->map(fn ($variant) => ['id' => $variant->id, 'barcode' => 'DUPLICATE-BARCODE'])->all(),
        ])->assertUnprocessable()->assertJsonValidationErrors('variants.0.barcode');
        $this->assertDatabaseMissing('product_variants', ['barcode' => 'DUPLICATE-BARCODE']);
    }
}
