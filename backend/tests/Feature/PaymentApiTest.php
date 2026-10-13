<?php

namespace Tests\Feature;

use App\Contracts\PaymentGateway;
use App\Models\Order;
use App\Models\Payment;
use App\Models\SubOrder;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentApiTest extends TestCase
{
    use RefreshDatabase;

    private function order(User $user, float $total = 400000, string $paymentStatus = 'pending'): Order
    {
        return Order::factory()->create([
            'user_id' => $user->id,
            'total_items_price' => $total,
            'grand_total' => $total,
            'payment_status' => $paymentStatus,
        ]);
    }

    public function test_the_sandbox_gateway_is_bound_in_testing(): void
    {
        $gateway = app(PaymentGateway::class);

        $this->assertSame('sandbox', $gateway->name());
    }

    public function test_payment_routes_require_authentication(): void
    {
        $order = Order::factory()->create();

        $this->postJson("/api/v1/orders/{$order->id}/pay")->assertUnauthorized();
        $this->postJson('/api/v1/payments/1/verify')->assertUnauthorized();
    }

    public function test_an_attempt_is_opened_for_the_callers_order(): void
    {
        $user = User::factory()->create();
        $order = $this->order($user);

        $response = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/pay");

        $response->assertCreated()
            ->assertJsonPath('data.gateway_name', 'sandbox')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.amount', 400000)
            // The sandbox settles inline, so it hands back no url to follow.
            ->assertJsonPath('redirect_url', null);

        $this->assertStringStartsWith('SBX-', (string) $response->json('data.reference_id'));
        $this->assertDatabaseHas('payments', [
            'order_id' => $order->id,
            'gateway_name' => 'sandbox',
            'amount' => 400000,
            'status' => 'pending',
        ]);
    }

    public function test_confirming_marks_the_payment_order_and_sub_orders(): void
    {
        $user = User::factory()->create();
        $order = $this->order($user);
        $subOrder = SubOrder::factory()->create(['order_id' => $order->id, 'status' => 'pending']);

        $paymentId = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/pay")
            ->json('data.id');

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/payments/{$paymentId}/verify")
            ->assertOk()
            ->assertJsonPath('data.status', 'paid')
            ->assertJsonPath('data.paid_at', fn ($value) => $value !== null);

        $this->assertSame('paid', $order->fresh()->payment_status->value);
        $this->assertSame('confirmed', $order->fresh()->status->value);
        $this->assertSame('confirmed', $subOrder->fresh()->status->value);
        $this->assertNotNull(Payment::query()->find($paymentId)->paid_at);
    }

    public function test_the_advance_is_recorded_in_both_histories(): void
    {
        $user = User::factory()->create();
        $order = $this->order($user);
        $subOrder = SubOrder::factory()->create(['order_id' => $order->id, 'status' => 'pending']);

        $paymentId = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/pay")
            ->json('data.id');

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/payments/{$paymentId}/verify")
            ->assertOk();

        $this->assertDatabaseHas('order_histories', [
            'order_id' => $order->id,
            'from_status' => 'pending',
            'to_status' => 'confirmed',
            'changed_by_user_id' => $user->id,
        ]);
        $this->assertDatabaseHas('order_status_histories', [
            'sub_order_id' => $subOrder->id,
            'from_status' => 'pending',
            'to_status' => 'confirmed',
        ]);
    }

    public function test_the_same_attempt_cannot_be_confirmed_twice(): void
    {
        $user = User::factory()->create();
        $order = $this->order($user);

        $paymentId = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/pay")
            ->json('data.id');

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/payments/{$paymentId}/verify")
            ->assertOk();

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/payments/{$paymentId}/verify")
            ->assertJsonValidationErrors('payment');
    }

    public function test_a_paid_order_cannot_be_paid_again(): void
    {
        $user = User::factory()->create();
        $order = $this->order($user, paymentStatus: 'paid');

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/pay")
            ->assertJsonValidationErrors('order');
    }

    public function test_a_cancelled_order_cannot_be_paid(): void
    {
        $user = User::factory()->create();
        $order = $this->order($user);
        $order->update(['status' => 'cancelled']);

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/pay")
            ->assertJsonValidationErrors('order');
    }

    public function test_another_shoppers_order_cannot_be_paid(): void
    {
        $user = User::factory()->create();
        $foreign = $this->order(User::factory()->create());

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/orders/{$foreign->id}/pay")
            ->assertNotFound();
    }

    public function test_another_shoppers_payment_cannot_be_confirmed(): void
    {
        $user = User::factory()->create();
        $owner = User::factory()->create();
        $order = $this->order($owner);

        $paymentId = $this->actingAs($owner, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/pay")
            ->json('data.id');

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/payments/{$paymentId}/verify")
            ->assertNotFound();
    }

    public function test_a_second_attempt_supersedes_the_unpaid_one(): void
    {
        $user = User::factory()->create();
        $order = $this->order($user);

        $first = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/pay")
            ->json('data.id');

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/pay")
            ->assertCreated();

        $this->assertSame('failed', Payment::query()->find($first)->status);
        $this->assertSame(2, Payment::query()->where('order_id', $order->id)->count());
    }

    public function test_a_gateway_that_refuses_leaves_the_order_unpaid(): void
    {
        $user = User::factory()->create();
        $order = $this->order($user);
        $subOrder = SubOrder::factory()->create(['order_id' => $order->id, 'status' => 'pending']);

        $paymentId = $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/orders/{$order->id}/pay")
            ->json('data.id');

        $this->app->bind(PaymentGateway::class, fn () => new class implements PaymentGateway
        {
            public function name(): string
            {
                return 'stub';
            }

            public function start(Order $order): array
            {
                return ['reference' => 'STUB-1', 'redirect_url' => null];
            }

            public function verify(Payment $payment): bool
            {
                return false;
            }
        });

        $this->actingAs($user, 'sanctum')
            ->postJson("/api/v1/payments/{$paymentId}/verify")
            ->assertOk()
            ->assertJsonPath('data.status', 'failed');

        $this->assertSame('failed', $order->fresh()->payment_status->value);
        $this->assertSame('pending', $order->fresh()->status->value);
        $this->assertSame('pending', $subOrder->fresh()->status->value);
    }
}
