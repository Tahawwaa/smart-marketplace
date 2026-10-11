<?php

namespace App\Services;

use App\Exceptions\OutOfStockException;
use App\Models\InventoryLog;
use App\Models\InventoryReservation;
use App\Models\VendorInventory;
use Illuminate\Support\Facades\DB;

class InventoryService
{
    public const DEFAULT_TTL_MINUTES = 15;

    /**
     * Reserve stock for a pending purchase, locking the row until commit.
     *
     * @throws OutOfStockException
     */
    public function reserve(
        int $vendorInventoryId,
        int $quantity,
        ?int $cartId = null,
        int $ttlMinutes = self::DEFAULT_TTL_MINUTES,
    ): InventoryReservation {
        return DB::transaction(function () use ($vendorInventoryId, $quantity, $cartId, $ttlMinutes) {
            $stock = VendorInventory::query()
                ->whereKey($vendorInventoryId)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $stock->is_available || $stock->availableQuantity() < $quantity) {
                throw new OutOfStockException('موجودی کالا کافی نیست.');
            }

            $stock->increment('reserved_quantity', $quantity);

            return InventoryReservation::create([
                'vendor_inventory_id' => $stock->id,
                'cart_id' => $cartId,
                'quantity' => $quantity,
                'status' => 'active',
                'expires_at' => now()->addMinutes($ttlMinutes),
            ]);
        });
    }

    /**
     * Turn a reservation into a real stock deduction.
     */
    public function consume(InventoryReservation $reservation, ?int $orderItemId = null): void
    {
        DB::transaction(function () use ($reservation, $orderItemId) {
            $stock = VendorInventory::query()->lockForUpdate()->findOrFail($reservation->vendor_inventory_id);
            $before = $stock->quantity;

            $stock->decrement('reserved_quantity', $reservation->quantity);
            $stock->decrement('quantity', $reservation->quantity);
            $stock->refresh();

            $reservation->update(['status' => 'consumed']);

            InventoryLog::create([
                'vendor_inventory_id' => $stock->id,
                'order_item_id' => $orderItemId,
                'change_quantity' => -$reservation->quantity,
                'quantity_before' => $before,
                'quantity_after' => $stock->quantity,
                'type' => 'order_placed',
            ]);
        });
    }

    /**
     * Give reserved stock back to the pool.
     */
    public function release(InventoryReservation $reservation): void
    {
        if ($reservation->status !== 'active') {
            return;
        }

        DB::transaction(function () use ($reservation) {
            $stock = VendorInventory::query()->lockForUpdate()->findOrFail($reservation->vendor_inventory_id);

            $stock->decrement('reserved_quantity', $reservation->quantity);
            $reservation->update(['status' => 'released']);
        });
    }

    /**
     * Release every reservation whose hold has expired.
     *
     * @return int number of released reservations
     */
    public function releaseExpired(): int
    {
        $released = 0;

        InventoryReservation::query()
            ->where('status', 'active')
            ->where('expires_at', '<=', now())
            ->orderBy('id')
            ->chunkById(100, function ($reservations) use (&$released) {
                foreach ($reservations as $reservation) {
                    $this->release($reservation);
                    $released++;
                }
            });

        return $released;
    }
}
