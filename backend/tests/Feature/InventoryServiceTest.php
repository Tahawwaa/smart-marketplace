<?php

namespace Tests\Feature;

use App\Exceptions\OutOfStockException;
use App\Models\InventoryLog;
use App\Models\InventoryReservation;
use App\Models\VendorInventory;
use App\Services\InventoryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InventoryServiceTest extends TestCase
{
    use RefreshDatabase;

    private function stock(int $quantity = 5): VendorInventory
    {
        return VendorInventory::factory()->create(['quantity' => $quantity, 'reserved_quantity' => 0]);
    }

    public function test_reserving_stock_holds_quantity_without_deducting_it(): void
    {
        $stock = $this->stock(5);

        app(InventoryService::class)->reserve($stock->id, 2);

        $this->assertSame(5, $stock->refresh()->quantity);
        $this->assertSame(2, $stock->reserved_quantity);
        $this->assertSame(3, $stock->availableQuantity());
    }

    public function test_reserving_more_than_available_throws(): void
    {
        $stock = $this->stock(1);

        $this->expectException(OutOfStockException::class);

        app(InventoryService::class)->reserve($stock->id, 2);
    }

    public function test_consuming_a_reservation_deducts_stock_and_writes_a_log(): void
    {
        $stock = $this->stock(5);
        $service = app(InventoryService::class);
        $reservation = $service->reserve($stock->id, 2);

        $service->consume($reservation, null);

        $this->assertSame(3, $stock->refresh()->quantity);
        $this->assertSame(0, $stock->reserved_quantity);
        $this->assertSame('consumed', $reservation->refresh()->status);

        $log = InventoryLog::query()->firstOrFail();
        $this->assertSame(-2, $log->change_quantity);
        $this->assertSame(5, $log->quantity_before);
        $this->assertSame(3, $log->quantity_after);
    }

    public function test_releasing_a_reservation_returns_the_stock(): void
    {
        $stock = $this->stock(5);
        $service = app(InventoryService::class);
        $reservation = $service->reserve($stock->id, 2);

        $service->release($reservation);

        $this->assertSame(0, $stock->refresh()->reserved_quantity);
        $this->assertSame('released', $reservation->refresh()->status);
    }

    public function test_expired_reservations_are_released_by_the_command(): void
    {
        $stock = $this->stock(5);
        $reservation = app(InventoryService::class)->reserve($stock->id, 2);
        $reservation->update(['expires_at' => now()->subMinute()]);

        $this->artisan('inventory:release-expired')->assertSuccessful();

        $this->assertSame(0, $stock->refresh()->reserved_quantity);
        $this->assertSame('released', $reservation->refresh()->status);
    }

    public function test_active_reservations_are_not_released_early(): void
    {
        $stock = $this->stock(5);
        $reservation = app(InventoryService::class)->reserve($stock->id, 2);

        $this->artisan('inventory:release-expired')->assertSuccessful();

        $this->assertSame(2, $stock->refresh()->reserved_quantity);
        $this->assertSame('active', $reservation->refresh()->status);
        $this->assertSame(1, InventoryReservation::query()->where('status', 'active')->count());
    }
}
