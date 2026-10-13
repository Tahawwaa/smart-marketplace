<?php

namespace App\Services\Gateways;

use App\Contracts\PaymentGateway;
use App\Models\Order;
use App\Models\Payment;
use Illuminate\Support\Str;

/**
 * Development stand-in for a real payment provider.
 *
 * It moves no money and contacts nothing: it only produces the reference
 * strings and the success/failure verdict that the order flow needs while a
 * real provider is not wired up yet. Confirming a payment against this gateway
 * always succeeds, so it must never be enabled outside development.
 */
class SandboxGateway implements PaymentGateway
{
    public function name(): string
    {
        return 'sandbox';
    }

    public function start(Order $order): array
    {
        return [
            'reference' => 'SBX-'.Str::upper(Str::random(12)),
            'redirect_url' => null,
        ];
    }

    public function verify(Payment $payment): bool
    {
        return true;
    }
}
