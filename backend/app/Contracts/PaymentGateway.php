<?php

namespace App\Contracts;

use App\Models\Order;
use App\Models\Payment;

/**
 * Seam for a real payment provider.
 *
 * The application only ever talks to a gateway through this contract, so
 * swapping the sandbox implementation for a live one does not touch the
 * controllers or the order flow.
 */
interface PaymentGateway
{
    /**
     * Machine name stored on the payment row.
     */
    public function name(): string;

    /**
     * Open a payment attempt and return where the shopper should go next.
     *
     * A gateway that is settled inline (no redirect) returns a null url.
     *
     * @return array{reference: string|null, redirect_url: string|null}
     */
    public function start(Order $order): array;

    /**
     * Decide whether an attempt has actually been settled.
     */
    public function verify(Payment $payment): bool;
}
