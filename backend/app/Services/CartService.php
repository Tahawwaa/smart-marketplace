<?php

namespace App\Services;

use App\Models\Cart;
use App\Models\CartItem;
use App\Models\User;
use App\Models\VendorInventory;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class CartService
{
    /**
     * Header that identifies a guest cart.
     */
    public const SESSION_HEADER = 'X-Cart-Session';

    public const TTL_DAYS = 7;

    private const SESSION_PATTERN = '/^[A-Za-z0-9._-]{16,64}$/';

    /**
     * Resolve the cart behind the current request, creating it when needed.
     *
     * Authenticated requests use the user cart, guests use the cart bound to
     * the session id sent with the request.
     */
    public function resolve(Request $request, bool $create = true): ?Cart
    {
        $user = $this->user($request);

        if ($user !== null) {
            return $this->forUser($user, $create);
        }

        return $this->forSession($this->sessionId($request), $create);
    }

    /**
     * Resolve the caller for the public cart routes.
     *
     * These routes sit outside the auth middleware so guests can use them, but
     * a bearer token may still be present: a logged-in shopper must always see
     * the user cart, never the guest one.
     */
    private function user(Request $request): ?User
    {
        $user = Auth::guard('sanctum')->user();
        abort_if($request->bearerToken() !== null && $user === null, 401);
        abort_if($user !== null && ! $user->is_active, 403, 'این حساب کاربری غیرفعال است.');

        return $user;
    }

    /**
     * Resolve the cart for a guest, failing when no usable session id was sent.
     */
    public function requireCart(Request $request): Cart
    {
        $cart = $this->resolve($request);

        if ($cart === null) {
            throw ValidationException::withMessages([
                self::SESSION_HEADER => 'شناسه سبد خرید ارسال نشده است.',
            ]);
        }

        return $cart;
    }

    public function forUser(User $user, bool $create = true): ?Cart
    {
        $query = Cart::query()->where('user_id', $user->id);

        if (! $create) {
            return $query->first();
        }

        return DB::transaction(function () use ($user, $query) {
            User::query()->lockForUpdate()->findOrFail($user->id);

            return $query->firstOrCreate(
                ['user_id' => $user->id],
                ['expires_at' => now()->addDays(self::TTL_DAYS)],
            );
        });
    }

    public function forSession(?string $sessionId, bool $create = true): ?Cart
    {
        if ($sessionId === null) {
            return null;
        }

        return DB::transaction(function () use ($sessionId, $create) {
            $query = Cart::query()->where('session_id', $sessionId)->whereNull('user_id');
            $cart = $query->lockForUpdate()->first();

            if ($cart?->expires_at?->isPast()) {
                $cart->delete();
                $cart = null;
            }

            return $cart ?? ($create ? $query->create([
                'session_id' => $sessionId, 'expires_at' => now()->addDays(self::TTL_DAYS),
            ]) : null);
        }, 3);
    }

    /**
     * Read the guest cart id from the request header.
     */
    public function sessionId(Request $request): ?string
    {
        $value = $request->header(self::SESSION_HEADER);

        if (! is_string($value) || preg_match(self::SESSION_PATTERN, $value) !== 1) {
            return null;
        }

        return $value;
    }

    /**
     * Add stock to the cart, merging with the line that already exists.
     *
     * @throws ValidationException
     */
    public function addItem(Cart $cart, VendorInventory $inventory, int $quantity): CartItem
    {
        return DB::transaction(function () use ($cart, $inventory, $quantity) {
            $cart = Cart::query()->lockForUpdate()->findOrFail($cart->id);
            $inventory = VendorInventory::query()->lockForUpdate()->findOrFail($inventory->id);
            $existing = $cart->items()->where('vendor_inventory_id', $inventory->id)->first();
            $requested = ($existing?->quantity ?? 0) + $quantity;

            $this->assertAvailable($inventory, $requested);

            $this->touch($cart);

            if ($existing !== null) {
                $existing->update(['quantity' => $requested]);

                return $existing;
            }

            return $cart->items()->create([
                'vendor_inventory_id' => $inventory->id,
                'quantity' => $quantity,
                'unit_price_snapshot' => $inventory->effectivePrice(),
            ]);
        });
    }

    /**
     * Change the quantity of a cart line.
     *
     * @throws ValidationException
     */
    public function updateQuantity(CartItem $item, int $quantity): void
    {
        DB::transaction(function () use ($item, $quantity) {
            $cart = Cart::query()->lockForUpdate()->findOrFail($item->cart_id);
            $item = $cart->items()->findOrFail($item->id);
            $this->assertAvailable($item->inventory, $quantity);
            $this->touch($cart);
            $item->update(['quantity' => $quantity]);
        });
    }

    /**
     * Move every guest cart line into the user cart, then drop the guest cart.
     */
    public function mergeGuestCart(User $user, ?string $sessionId): void
    {
        if ($sessionId === null) {
            return;
        }

        DB::transaction(function () use ($user, $sessionId) {
            $guest = Cart::query()
                ->where('session_id', $sessionId)
                ->whereNull('user_id')
                ->lockForUpdate()
                ->with('items.inventory')
                ->first();

            if ($guest === null || $guest->items->isEmpty() || $guest->expires_at?->isPast()) {
                $guest?->delete();

                return;
            }

            $cart = $this->forUser($user);
            $cart = Cart::query()->lockForUpdate()->findOrFail($cart->id);

            foreach ($guest->items as $item) {
                $inventory = $item->inventory;

                if ($inventory === null || ! $inventory->isPurchasable()) {
                    continue;
                }

                $existing = $cart->items()->where('vendor_inventory_id', $item->vendor_inventory_id)->first();
                $quantity = min(
                ($existing?->quantity ?? 0) + $item->quantity,
                $inventory->availableQuantity(),
                100,
                );

                if ($existing !== null) {
                    $existing->update(['quantity' => $quantity]);

                    continue;
                }

                $item->update(['cart_id' => $cart->id, 'quantity' => $quantity]);
            }

            $guest->delete();
            $this->touch($cart);
        });
    }

    /**
     * Extend the life of a cart that is being used.
     */
    public function touch(Cart $cart): void
    {
        $cart->forceFill(['expires_at' => now()->addDays(self::TTL_DAYS)])->save();
    }

    /**
     * @throws ValidationException
     */
    private function assertAvailable(?VendorInventory $inventory, int $quantity): void
    {
        if ($quantity < 1 || $quantity > 100) {
            throw ValidationException::withMessages(['quantity' => 'تعداد کالا باید بین ۱ و ۱۰۰ باشد.']);
        }

        if ($inventory === null || ! $inventory->isPurchasable() || $inventory->availableQuantity() < $quantity) {
            throw ValidationException::withMessages([
                'quantity' => 'موجودی کالا کافی نیست.',
            ]);
        }
    }
}
