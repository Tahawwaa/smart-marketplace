<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PaymentResource;
use App\Models\Order;
use App\Models\Payment;
use App\Services\PaymentService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PaymentController extends Controller
{
    public function __construct(private readonly PaymentService $payments) {}

    /**
     * Open a payment attempt for an order the caller owns.
     */
    public function store(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        $attempt = $this->payments->start($request->user(), $order);

        return response()->json([
            'data' => PaymentResource::make($attempt['payment'])->resolve($request),
            // Null whenever the gateway settles inline, as the sandbox does.
            'redirect_url' => $attempt['redirect_url'],
        ], Response::HTTP_CREATED);
    }

    /**
     * Ask the gateway to settle an attempt and confirm the order.
     */
    public function verify(Request $request, Payment $payment): JsonResponse
    {
        $payment = $this->payments->confirm($request->user(), $payment);

        return response()->json(['data' => PaymentResource::make($payment)->resolve($request)]);
    }
}
