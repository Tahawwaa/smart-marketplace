<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddressApiTest extends TestCase
{
    use RefreshDatabase;

    private function payload(array $overrides = []): array
    {
        return [
            'title' => 'خانه',
            'province' => 'تهران',
            'city' => 'تهران',
            'postal_code' => '1234567890',
            'address_line' => 'خیابان ولیعصر، پلاک ۱۰',
            'recipient_name' => 'مینا کریمی',
            'recipient_phone' => '09121234567',
            ...$overrides,
        ];
    }

    public function test_addresses_require_authentication(): void
    {
        $this->getJson('/api/v1/addresses')->assertUnauthorized();
    }

    public function test_a_user_can_manage_their_own_addresses(): void
    {
        $user = User::factory()->create();

        $addressId = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/addresses', $this->payload())
            ->assertCreated()
            ->assertJsonPath('data.city', 'تهران')
            ->json('data.id');

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/v1/addresses/{$addressId}", $this->payload(['city' => 'کرج']))
            ->assertOk()
            ->assertJsonPath('data.city', 'کرج');

        $this->actingAs($user, 'sanctum')
            ->getJson('/api/v1/addresses')
            ->assertOk()
            ->assertJsonCount(1, 'data');

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/v1/addresses/{$addressId}")
            ->assertNoContent();

        $this->assertSame(0, Address::query()->count());
    }

    public function test_only_one_address_stays_default(): void
    {
        $user = User::factory()->create();

        $first = $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/addresses', $this->payload(['is_default' => true]))
            ->json('data.id');

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/addresses', $this->payload(['title' => 'کار', 'is_default' => true]))
            ->assertCreated();

        $this->assertFalse(Address::query()->find($first)->is_default);
        $this->assertSame(1, Address::query()->where('is_default', true)->count());
    }

    public function test_required_fields_are_validated(): void
    {
        $user = User::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->postJson('/api/v1/addresses', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['province', 'city', 'address_line', 'recipient_name', 'recipient_phone']);
    }

    public function test_another_users_address_is_not_reachable(): void
    {
        $user = User::factory()->create();
        $address = Address::factory()->create();

        $this->actingAs($user, 'sanctum')
            ->putJson("/api/v1/addresses/{$address->id}", $this->payload())
            ->assertNotFound();

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/v1/addresses/{$address->id}")
            ->assertNotFound();
    }
}
