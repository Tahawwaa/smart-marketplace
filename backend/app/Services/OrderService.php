<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Exceptions\OutOfStockException;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\SubOrder;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class OrderService
{
    public function __construct(private readonly InventoryService $inventory) {}

    /**
     * Turn every line of a cart into a placed order.
     *
     * Lines are grouped per vendor into sub-orders; stock is deducted and the
     * cart is emptied only after everything succeeded.
     *
     * @param  array<string, mixed>  $addressSnapshot
     *
     * @throws ValidationException
     */
    public function placeFromCart(User $user, Cart $cart, array $addressSnapshot): Order
    {
        $items = CartItem::query()
            ->where('cart_id', $cart->id)
            ->with(['inventory.variant.product', 'inventory.vendor'])
            ->get();

        if ($items->isEmpty()) {
            throw ValidationException::withMessages([
                'cart' => 'سبد خرید خالی است.',
            ]);
        }

        try {
            return DB::transaction(function () use ($user, $cart, $items, $addressSnapshot) {
                $lines = $items->map(fn (CartItem $item) => $this->reserveLine($item, $cart->id));

                $totalItemsPrice = (float) $lines->sum('total_price');

                $order = Order::create([
                    'user_id' => $user->id,
                    'order_number' => $this->uniqueNumber('ORD'),
                    'shipping_address_snapshot' => $addressSnapshot,
                    'total_items_price' => $totalItemsPrice,
                    'total_shipping_fee' => 0,
                    'discount_total' => 0,
                    'tax_total' => 0,
                    'grand_total' => $totalItemsPrice,
                    'currency' => 'IRR',
                    'payment_status' => PaymentStatus::Pending,
                    'status' => OrderStatus::Pending,
                ]);

                foreach ($lines->groupBy('vendor_id') as $vendorLines) {
                    $this->createSubOrder($order, (int) $vendorLines->first()['vendor_id'], $vendorLines);
                }

                $cart->items()->delete();
                $cart->delete();

                return $order->load(['subOrders.items', 'subOrders.vendor:id,store_name,slug']);
            });
        } catch (OutOfStockException $exception) {
            throw ValidationException::withMessages([
                'cart' => $exception->getMessage(),
            ]);
        }
    }

    /**
     * Reserve one cart line and snapshot the data the order needs.
     *
     * @return array<string, mixed>
     *
     * @throws OutOfStockException
     */
    private function reserveLine(CartItem $item, int $cartId): array
    {
        $inventory = $item->inventory;

        if ($inventory === null || ! $inventory->is_available) {
            throw ValidationException::withMessages([
                'cart' => 'یکی از کالاهای سبد خرید دیگر موجود نیست.',
            ]);
        }

        $reservation = $this->inventory->reserve($inventory->id, $item->quantity, $cartId);
        $unitPrice = $inventory->effectivePrice();

        return [
            'reservation' => $reservation,
            'vendor_id' => $inventory->vendor_id,
            'vendor_inventory_id' => $inventory->id,
            'product_name_snapshot' => $inventory->variant?->product?->name ?? 'کالا',
            'variant_sku_snapshot' => $inventory->variant?->sku ?? (string) $inventory->variant_id,
            'selected_attributes_snapshot' => null,
            'unit_price' => $unitPrice,
            'quantity' => $item->quantity,
            'total_price' => round($unitPrice * $item->quantity, 2),
        ];
    }

    /**
     * @param  iterable<int, array<string, mixed>>  $lines
     */
    private function createSubOrder(Order $order, int $vendorId, iterable $lines): SubOrder
    {
        $subtotal = (float) collect($lines)->sum('total_price');
        $commissionRate = (float) $this->commissionRate($vendorId);
        $commissionAmount = round($subtotal * $commissionRate / 100, 2);

        $subOrder = SubOrder::create([
            'order_id' => $order->id,
            'vendor_id' => $vendorId,
            'sub_order_number' => $this->uniqueNumber('SUB'),
            'subtotal_price' => $subtotal,
            'shipping_fee' => 0,
            'commission_rate' => $commissionRate,
            'commission_amount' => $commissionAmount,
            'vendor_net_amount' => max(0, $subtotal - $commissionAmount),
            'status' => OrderStatus::Pending,
        ]);

        foreach ($lines as $line) {
            $orderItem = OrderItem::create([
                'sub_order_id' => $subOrder->id,
                'vendor_inventory_id' => $line['vendor_inventory_id'],
                'product_name_snapshot' => $line['product_name_snapshot'],
                'variant_sku_snapshot' => $line['variant_sku_snapshot'],
                'selected_attributes_snapshot' => $line['selected_attributes_snapshot'],
                'unit_price' => $line['unit_price'],
                'quantity' => $line['quantity'],
                'total_price' => $line['total_price'],
            ]);

            $this->inventory->consume($line['reservation'], $orderItem->id);
        }

        return $subOrder;
    }

    private function commissionRate(int $vendorId): float
    {
        return (float) DB::table('vendors')->where('id', $vendorId)->value('commission_rate');
    }

    /**
     * Build a reference that is not taken yet.
     */
    private function uniqueNumber(string $prefix): string
    {
        $table = $prefix === 'ORD' ? 'orders' : 'sub_orders';
        $column = $prefix === 'ORD' ? 'order_number' : 'sub_order_number';

        do {
            $number = $prefix.'-'.now()->format('Ymd').'-'.strtoupper(Str::random(6));
        } while (DB::table($table)->where($column, $number)->exists());

        return $number;
    }
}
