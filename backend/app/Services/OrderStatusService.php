<?php

namespace App\Services;

use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\InventoryLog;
use App\Models\Order;
use App\Models\OrderHistory;
use App\Models\OrderStatusHistory;
use App\Models\Payment;
use App\Models\SubOrder;
use App\Models\User;
use App\Models\VendorInventory;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class OrderStatusService
{
    private const PROGRESS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

    public function updateVendor(SubOrder $subOrder, OrderStatus $status, User $user, ?string $note): void
    {
        DB::transaction(function () use ($subOrder, $status, $user, $note) {
            $order = Order::query()->lockForUpdate()->findOrFail($subOrder->order_id);
            $subOrder = SubOrder::query()->lockForUpdate()->findOrFail($subOrder->id);
            $this->validateTransition($order, $subOrder->status, $status);
            $this->recordSubOrder($subOrder, $status, $user, $note);

            $statuses = $order->subOrders()->pluck('status')->map(fn ($value) => $value->value)->all();
            $rank = min(array_map(fn (string $value) => array_search($value, self::PROGRESS, true), $statuses));

            if ($rank !== false) {
                $this->recordOrder($order, OrderStatus::from(self::PROGRESS[$rank]), $user, $note);
            }
        });
    }

    public function updateAdmin(Order $order, OrderStatus $status, User $user, ?string $note): void
    {
        DB::transaction(function () use ($order, $status, $user, $note) {
            $order = Order::query()->lockForUpdate()->findOrFail($order->id);
            $this->validateTransition($order, $order->status, $status);

            if ($order->status === $status) {
                return;
            }

            $subOrders = $order->subOrders()->lockForUpdate()->get();
            foreach ($subOrders as $subOrder) {
                $this->validateTransition($order, $subOrder->status, $status);
            }

            if ($status === OrderStatus::Cancelled) {
                $this->restock($order);
                Payment::query()->where('order_id', $order->id)->where('status', PaymentStatus::Pending->value)
                    ->update(['status' => PaymentStatus::Failed->value]);
            }

            foreach ($subOrders as $subOrder) {
                $this->recordSubOrder($subOrder, $status, $user, $note);
            }

            $this->recordOrder($order, $status, $user, $note);
        });
    }

    private function validateTransition(Order $order, OrderStatus $from, OrderStatus $to): void
    {
        if ($from === $to) {
            return;
        }

        $fromRank = array_search($from->value, self::PROGRESS, true);
        $toRank = array_search($to->value, self::PROGRESS, true);
        $paid = in_array($order->payment_status, [PaymentStatus::Paid, PaymentStatus::PartiallyRefunded], true);
        $terminalOrder = in_array($order->status, [OrderStatus::Cancelled, OrderStatus::Refunded], true);
        $canAdvance = ! $terminalOrder && $paid && $fromRank !== false && $toRank !== false && $toRank > $fromRank;
        $canCancel = ! $terminalOrder && $to === OrderStatus::Cancelled && $fromRank !== false && $fromRank < 3;
        $canRefund = $to === OrderStatus::Refunded && $order->payment_status === PaymentStatus::Refunded;

        if (! $canAdvance && ! $canCancel && ! $canRefund) {
            throw ValidationException::withMessages(['status' => 'این تغییر وضعیت با وضعیت سفارش و پرداخت سازگار نیست.']);
        }
    }

    private function recordOrder(Order $order, OrderStatus $status, User $user, ?string $note): void
    {
        if ($order->status === $status) {
            return;
        }

        OrderHistory::create([
            'order_id' => $order->id, 'from_status' => $order->status->value,
            'to_status' => $status->value, 'changed_by_user_id' => $user->id, 'note' => $note,
        ]);
        $order->update(['status' => $status]);
    }

    private function recordSubOrder(SubOrder $subOrder, OrderStatus $status, User $user, ?string $note): void
    {
        if ($subOrder->status === $status) {
            return;
        }

        OrderStatusHistory::create([
            'sub_order_id' => $subOrder->id, 'from_status' => $subOrder->status->value,
            'to_status' => $status->value, 'changed_by_user_id' => $user->id, 'note' => $note,
        ]);
        $subOrder->update(['status' => $status]);
    }

    private function restock(Order $order): void
    {
        foreach ($order->subOrders()->with('items')->get()->flatMap->items->sortBy('vendor_inventory_id') as $item) {
            $stock = VendorInventory::withTrashed()->lockForUpdate()->find($item->vendor_inventory_id);
            if ($stock === null) {
                continue;
            }

            $before = $stock->quantity;
            $stock->increment('quantity', $item->quantity);
            InventoryLog::create([
                'vendor_inventory_id' => $stock->id, 'order_item_id' => $item->id,
                'change_quantity' => $item->quantity, 'quantity_before' => $before,
                'quantity_after' => $stock->quantity, 'type' => 'order_cancelled',
            ]);
        }
    }
}
