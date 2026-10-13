<?php

namespace App\Services;

use App\Contracts\PaymentGateway;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Models\Order;
use App\Models\OrderHistory;
use App\Models\OrderStatusHistory;
use App\Models\Payment;
use App\Models\SubOrder;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(private readonly PaymentGateway $gateway) {}

    /**
     * Open a payment attempt for an order the caller owns.
     *
     * @return array{payment: Payment, redirect_url: string|null}
     *
     * @throws ValidationException
     */
    public function start(User $user, Order $order): array
    {
        $this->guardPayable($order);

        return DB::transaction(function () use ($order) {
            // A second attempt supersedes an unpaid one; the old row stays for audit.
            Payment::query()
                ->where('order_id', $order->id)
                ->where('status', PaymentStatus::Pending->value)
                ->update(['status' => PaymentStatus::Failed->value]);

            $attempt = $this->gateway->start($order);

            $payment = Payment::create([
                'order_id' => $order->id,
                'gateway_name' => $this->gateway->name(),
                'reference_id' => $attempt['reference'],
                'amount' => $order->grand_total,
                'status' => PaymentStatus::Pending->value,
            ]);

            return [
                'payment' => $payment,
                'redirect_url' => $attempt['redirect_url'],
            ];
        });
    }

    /**
     * Ask the gateway whether an attempt is settled and, when it is, confirm
     * the order and its sub-orders.
     *
     * @throws ValidationException
     */
    public function confirm(User $user, Payment $payment): Payment
    {
        $order = $payment->order;

        abort_if($order === null || $order->user_id !== $user->id, 404);

        if ($payment->status !== PaymentStatus::Pending->value) {
            throw ValidationException::withMessages([
                'payment' => 'این پرداخت قبلاً تعیین وضعیت شده است.',
            ]);
        }

        return DB::transaction(function () use ($user, $payment, $order) {
            if (! $this->gateway->verify($payment)) {
                $payment->update(['status' => PaymentStatus::Failed->value]);
                $order->update(['payment_status' => PaymentStatus::Failed]);

                return $payment->refresh();
            }

            $payment->update([
                'status' => PaymentStatus::Paid->value,
                'paid_at' => now(),
            ]);

            $order->update(['payment_status' => PaymentStatus::Paid]);

            $this->advanceOrder($user, $order);

            return $payment->refresh();
        });
    }

    /**
     * Move a freshly paid order from pending to confirmed.
     *
     * Anything already past pending keeps its state.
     */
    private function advanceOrder(User $user, Order $order): void
    {
        $order->subOrders()
            ->where('status', OrderStatus::Pending->value)
            ->each(function (SubOrder $subOrder) use ($user) {
                $subOrder->update(['status' => OrderStatus::Confirmed]);

                OrderStatusHistory::create([
                    'sub_order_id' => $subOrder->id,
                    'from_status' => OrderStatus::Pending->value,
                    'to_status' => OrderStatus::Confirmed->value,
                    'changed_by_user_id' => $user->id,
                    'note' => 'پرداخت موفق',
                ]);
            });

        if ($order->status !== OrderStatus::Pending) {
            return;
        }

        $order->update(['status' => OrderStatus::Confirmed]);

        OrderHistory::create([
            'order_id' => $order->id,
            'from_status' => OrderStatus::Pending->value,
            'to_status' => OrderStatus::Confirmed->value,
            'changed_by_user_id' => $user->id,
            'note' => 'پرداخت موفق',
        ]);
    }

    /**
     * @throws ValidationException
     */
    private function guardPayable(Order $order): void
    {
        if ($order->payment_status === PaymentStatus::Paid) {
            throw ValidationException::withMessages([
                'order' => 'این سفارش قبلاً پرداخت شده است.',
            ]);
        }

        if (in_array($order->status, [OrderStatus::Cancelled, OrderStatus::Refunded], true)) {
            throw ValidationException::withMessages([
                'order' => 'این سفارش قابل پرداخت نیست.',
            ]);
        }
    }
}
