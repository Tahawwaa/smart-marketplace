<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\User;
use App\Models\VendorInventory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CartApiTest extends TestCase
{
    use RefreshDatabase;

    private const SESSION = 'guest-session-0123456789';

    private function inventory(float $price = 100000, int $quantity = 10, array $attributes = []): VendorInventory
    {
        $product = Product::factory()->create(['is_active' => true]);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);

        return VendorInventory::factory()->create([
            'variant_id' => $variant->id,
            'price' => $price,
            'quantity' => $quantity,
            'reserved_quantity' => 0,
            ...$attributes,
        ]);
    }

    private function guest(): static
    {
        return $this->withHeader('X-Cart-Session', self::SESSION);
    }

    public function test_guests_without_a_session_id_get_an_error(): void
    {
        $this->getJson('/api/v1/cart')->assertOk()->assertJsonPath('data.total_quantity', 0);

        $inventory = $this->inventory();

        $this->postJson('/api/v1/cart/items', [
            'vendor_inventory_id' => $inventory->id,
            'quantity' => 1,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('X-Cart-Session');
    }

    public function test_a_guest_can_add_and_read_back_a_cart_line(): void
    {
        $inventory = $this->inventory(price: 250000);

        $this->guest()->postJson('/api/v1/cart/items', [
            'vendor_inventory_id' => $inventory->id,
            'quantity' => 2,
        ])
            ->assertOk()
            ->assertJsonPath('data.total_quantity', 2)
            ->assertJsonPath('data.subtotal', 500000);

        $this->guest()->getJson('/api/v1/cart')
            ->assertOk()
            ->assertJsonCount(1, 'data.items')
            ->assertJsonPath('data.items.0.product.name', $inventory->variant->product->name)
            ->assertJsonPath('data.items.0.unit_price', 250000);
    }

    public function test_adding_the_same_line_twice_merges_the_quantity(): void
    {
        $inventory = $this->inventory();

        $this->guest()->postJson('/api/v1/cart/items', [
            'vendor_inventory_id' => $inventory->id,
            'quantity' => 2,
        ])->assertOk();

        $this->guest()->postJson('/api/v1/cart/items', [
            'vendor_inventory_id' => $inventory->id,
            'quantity' => 3,
        ])->assertOk()->assertJsonPath('data.total_quantity', 5);

        $this->assertSame(1, CartItem::query()->count());
    }

    public function test_the_sale_price_is_what_gets_snapshotted(): void
    {
        $inventory = $this->inventory(price: 900000, attributes: ['sale_price' => 750000]);

        $this->guest()->postJson('/api/v1/cart/items', ['vendor_inventory_id' => $inventory->id])
            ->assertOk()
            ->assertJsonPath('data.items.0.unit_price', 750000)
            ->assertJsonPath('data.items.0.unit_price_snapshot', 750000);
    }

    public function test_more_than_the_available_stock_is_rejected(): void
    {
        $inventory = $this->inventory(quantity: 2);

        $this->guest()->postJson('/api/v1/cart/items', [
            'vendor_inventory_id' => $inventory->id,
            'quantity' => 3,
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors('quantity');
    }

    public function test_an_unavailable_stock_row_cannot_be_added(): void
    {
        $inventory = $this->inventory(attributes: ['is_available' => false]);

        $this->guest()->postJson('/api/v1/cart/items', ['vendor_inventory_id' => $inventory->id])
            ->assertStatus(422)
            ->assertJsonValidationErrors('quantity');
    }

    public function test_a_line_quantity_can_be_changed_and_the_line_removed(): void
    {
        $inventory = $this->inventory();
        $itemId = $this->guest()->postJson('/api/v1/cart/items', [
            'vendor_inventory_id' => $inventory->id,
            'quantity' => 1,
        ])->json('data.items.0.id');

        $this->guest()->patchJson("/api/v1/cart/items/{$itemId}", ['quantity' => 4])
            ->assertOk()
            ->assertJsonPath('data.total_quantity', 4);

        $this->guest()->deleteJson("/api/v1/cart/items/{$itemId}")
            ->assertOk()
            ->assertJsonPath('data.total_quantity', 0);

        $this->assertSame(0, CartItem::query()->count());
    }

    public function test_a_guest_cannot_touch_a_line_that_belongs_to_someone_else(): void
    {
        $inventory = $this->inventory();

        $itemId = CartItem::factory()->create([
            'quantity' => 1,
            'vendor_inventory_id' => $inventory->id,
        ])->id;

        $this->guest()->patchJson("/api/v1/cart/items/{$itemId}", ['quantity' => 2])->assertNotFound();
        $this->guest()->deleteJson("/api/v1/cart/items/{$itemId}")->assertNotFound();
    }

    public function test_authenticated_carts_are_kept_per_user(): void
    {
        $user = User::factory()->create();
        $other = User::factory()->create();
        $inventory = $this->inventory();

        $this->actingAs($user, 'sanctum')->postJson('/api/v1/cart/items', [
            'vendor_inventory_id' => $inventory->id,
            'quantity' => 2,
        ])->assertOk();

        $this->actingAs($other, 'sanctum')->getJson('/api/v1/cart')
            ->assertOk()
            ->assertJsonPath('data.total_quantity', 0);
    }

    public function test_a_bearer_token_is_honoured_on_the_public_cart_routes(): void
    {
        $user = User::factory()->create();
        $inventory = $this->inventory();

        $token = $user->createToken('test')->plainTextToken;

        $this->withHeader('Authorization', "Bearer {$token}")
            ->withHeader('X-Cart-Session', self::SESSION)
            ->postJson('/api/v1/cart/items', [
                'vendor_inventory_id' => $inventory->id,
                'quantity' => 3,
            ])
            ->assertOk()
            ->assertJsonPath('data.total_quantity', 3);

        // سبد کاربر ثبت شده و سبد مهمان دست‌نخورده می‌ماند.
        $this->assertDatabaseHas('cart_items', [
            'vendor_inventory_id' => $inventory->id,
            'quantity' => 3,
        ]);
        $this->assertSame(1, Cart::query()->where('user_id', $user->id)->count());
        $this->assertSame(0, Cart::query()->whereNotNull('session_id')->count());
    }

    public function test_logging_in_merges_the_guest_cart_into_the_user_cart(): void
    {
        $user = User::factory()->create(['password' => 'password123']);
        $inventory = $this->inventory(quantity: 5);

        $this->guest()->postJson('/api/v1/cart/items', [
            'vendor_inventory_id' => $inventory->id,
            'quantity' => 2,
        ])->assertOk();

        $this->guest()->postJson('/api/v1/auth/login', [
            'email' => $user->email,
            'password' => 'password123',
        ])->assertOk();

        $this->actingAs($user, 'sanctum')->getJson('/api/v1/cart')
            ->assertOk()
            ->assertJsonPath('data.total_quantity', 2);
    }
}
