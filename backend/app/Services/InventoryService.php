<?php

namespace App\Services;

use App\Exceptions\OutOfStockException;
use App\Models\InventoryLog;
use App\Models\InventoryReservation;
use App\Models\VendorInventory;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;

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
        if ($quantity < 1 || $ttlMinutes < 1) {
            throw new InvalidArgumentException('Quantity and reservation lifetime must be positive.');
        }

        return DB::transaction(function () use ($vendorInventoryId, $quantity, $cartId, $ttlMinutes) {
            $stock = VendorInventory::query()
                ->whereKey($vendorInventoryId)
                ->lockForUpdate()
                ->firstOrFail();

            if (! $stock->isPurchasable() || $stock->availableQuantity() < $quantity) {
                throw new OutOfStockException('موجودی کالا کافی نیست.');
            }

            $stock->increment('reserved_quantity', $quantity);
            $stock->increment('lock_version');

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
            $stock = VendorInventory::withTrashed()->lockForUpdate()->findOrFail($reservation->vendor_inventory_id);
            $reservation = InventoryReservation::query()->lockForUpdate()->findOrFail($reservation->id);

            if ($reservation->status === 'consumed') {
                return;
            }

            if ($reservation->status !== 'active' || $reservation->expires_at->isPast()) {
                throw new OutOfStockException('مهلت رزرو موجودی به پایان رسیده است.');
            }

            if ($stock->reserved_quantity < $reservation->quantity || $stock->quantity < $reservation->quantity) {
                throw new OutOfStockException('موجودی رزروشده کافی نیست.');
            }

            $before = $stock->quantity;

            $stock->decrement('reserved_quantity', $reservation->quantity);
            $stock->decrement('quantity', $reservation->quantity);
            $stock->increment('lock_version');
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
    public function release(InventoryReservation $reservation): bool
    {
        return DB::transaction(function () use ($reservation) {
            $stock = VendorInventory::withTrashed()->lockForUpdate()->findOrFail($reservation->vendor_inventory_id);
            $reservation = InventoryReservation::query()->lockForUpdate()->findOrFail($reservation->id);

            if ($reservation->status !== 'active') {
                return false;
            }

            $stock->decrement('reserved_quantity', $reservation->quantity);
            $stock->increment('lock_version');
            $reservation->update(['status' => 'released']);

            return true;
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
                    $released += (int) $this->release($reservation);
                }
            });

        return $released;
    }
}
