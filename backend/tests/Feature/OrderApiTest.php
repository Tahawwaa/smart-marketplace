<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SubOrder;
use App\Models\User;
use App\Models\Vendor;
use App\Models\VendorInventory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderApiTest extends TestCase
{
    use RefreshDatabase;

    /**
     * @return array{0: VendorInventory, 1: string}
     */
    private function line(
        User $user,
        float $price = 200000,
        int $quantity = 2,
        int $stock = 10,
        ?int $vendorId = null,
    ): array {
        $product = Product::factory()->create(['is_active' => true]);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $inventory = VendorInventory::factory()->create([
            'variant_id' => $variant->id,
            'price' => $price,
            'quantity' => $stock,
            'reserved_quantity' => 0,
            ...($vendorId === null ? [] : ['vendor_id' => $vendorId]),
        ]);

        $cart = Cart::query()->where('user_id', $user->id)->first()
            ?? Cart::factory()->create(['user_id' => $user->id]);
        CartItem::factory()->create([
            'cart_id' => $cart->id,
            'vendor_inventory_id' => $inventory->id,
            'quantity' => $quantity,
            'unit_price_snapshot' => $price,
        ]);

        return [$inventory, $product->name];
    }

    private function addressPayload(): array
    {
        return [
            'address' => [
                'province' => 'تهران',
                'city' => 'تهران',
                'address_line' => 'خیابان آزادی، پلاک ۱',
                'recipient_name' => 'سارا محمدی',
                'recipient_phone' => '09120000000',
            ],
        ];
    }

    public function test_orders_require_authentication(): void
    {
        $this->getJson('/api/v1/orders')->assertUnauthorized();
        $this->postJson('/api/v1/orders', $this->addressPayload())->assertUnauthorized();
    }

    public function test_placing_an_order_creates_the_order_sub_order_and_items(): void
    {
        $user = User::factory()->create();
        [$inventory, $name] = $this->line($user, price: 200000, quantity: 2);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/orders', $this->addressPayload());

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.payment_status', 'pending')
            ->assertJsonPath('data.total_items_price', 400000)
            ->assertJsonPath('data.grand_total', 400000)
            ->assertJsonPath('data.sub_orders.0.items.0.product_name_snapshot', $name)
            ->assertJsonPath('data.shipping_address_snapshot.city', 'تهران');

        $this->assertDatabaseHas('orders', ['user_id' => $user->id, 'grand_total' => 400000]);
        $this->assertSame(1, SubOrder::query()->count());
        $this->assertSame(1, OrderItem::query()->count());
    }

    public function test_stock_is_deducted_and_the_cart_is_emptied(): void
    {
        $user = User::factory()->create();
        [$inventory] = $this->line($user, quantity: 2, stock: 10);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/orders', $this->addressPayload())
            ->assertCreated();

        $inventory->refresh();

        $this->assertSame(8, $inventory->quantity);
        $this->assertSame(0, $inventory->reserved_quantity);
        $this->assertSame(0, CartItem::query()->count());
        $this->assertDatabaseHas('inventory_logs', [
            'vendor_inventory_id' => $inventory->id,
            'change_quantity' => -2,
            'type' => 'order_placed',
        ]);
    }

    public function test_each_vendor_gets_its_own_sub_order(): void
    {
        $user = User::factory()->create();
        $first = Vendor::factory()->create();
        $second = Vendor::factory()->create();

        $this->line($user, price: 100000, quantity: 1, vendorId: $first->id);
        $this->line($user, price: 50000, quantity: 3, vendorId: $second->id);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/orders', $this->addressPayload())
            ->assertCreated();

        $this->assertSame(2, SubOrder::query()->count());
        $this->assertSame(250000, (int) $response->json('data.total_items_price'));
        $this->assertEqualsCanonicalizing(
            [$first->id, $second->id],
            SubOrder::query()->pluck('vendor_id')->all(),
        );
    }

    public function test_an_order_cannot_be_placed_with_an_empty_cart(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/orders', $this->addressPayload())
            ->assertStatus(422)
            ->assertJsonValidationErrors('cart');
    }

    public function test_out_of_stock_lines_are_rejected_and_nothing_is_written(): void
    {
        $user = User::factory()->create();
        [$inventory] = $this->line($user, quantity: 5, stock: 5);

        $inventory->update(['reserved_quantity' => 4]);

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/orders', $this->addressPayload())
            ->assertStatus(422)
            ->assertJsonValidationErrors('cart');

        $this->assertSame(0, Order::query()->count());
        $this->assertSame(0, OrderItem::query()->count());
        $this->assertSame(4, $inventory->refresh()->reserved_quantity);
    }

    public function test_a_saved_address_can_be_used_and_is_snapshotted(): void
    {
        $user = User::factory()->create();
        $this->line($user);

        $addressId = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/addresses', [
                'title' => 'محل کار',
                'province' => 'تهران',
                'city' => 'تهران',
                'address_line' => 'میدان ونک',
                'recipient_name' => 'علی رضایی',
                'recipient_phone' => '09121111111',
                'is_default' => true,
            ])
            ->assertCreated()
            ->json('data.id');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/orders', ['address_id' => $addressId])
            ->assertCreated()
            ->assertJsonPath('data.shipping_address_snapshot.recipient_name', 'علی رضایی');
    }

    public function test_an_address_belonging_to_someone_else_cannot_be_used(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $this->line($user);

        $addressId = $this->actingAs($other, 'sanctum')
            ->postJson('/api/v1/addresses', [
                'province' => 'تهران',
                'city' => 'تهران',
                'address_line' => 'نشانی دیگری',
                'recipient_name' => 'کاربر دیگر',
                'recipient_phone' => '09123333333',
            ])->json('data.id');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/orders', ['address_id' => $addressId])
            ->assertStatus(422)
            ->assertJsonValidationErrors('address_id');
    }

    public function test_the_index_lists_only_the_callers_orders(): void
    {
        $user = User::factory()->create();
        Order::factory()->create(['user_id' => $user->id]);
        Order::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/orders')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonStructure(['data', 'links', 'meta']);
    }

    public function test_another_users_order_is_not_readable(): void
    {
        $user = User::factory()->create();
        $order = Order::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->getJson("/api/v1/orders/{$order->id}")
            ->assertNotFound();
    }
}
