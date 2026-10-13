<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorSubOrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sub_order_number' => $this->sub_order_number,
            'status' => $this->status?->value ?? $this->status,
            'subtotal_price' => (float) $this->subtotal_price,
            'shipping_fee' => (float) $this->shipping_fee,
            'commission_rate' => (float) $this->commission_rate,
            'commission_amount' => (float) $this->commission_amount,
            'vendor_net_amount' => (float) $this->vendor_net_amount,
            'created_at' => $this->created_at?->toIso8601String(),
            'order' => $this->whenLoaded('order', fn () => $this->order === null ? null : [
                'id' => $this->order->id,
                'order_number' => $this->order->order_number,
                'status' => $this->order->status?->value ?? $this->order->status,
                'payment_status' => $this->order->payment_status?->value ?? $this->order->payment_status,
                'shipping_address_snapshot' => $this->order->shipping_address_snapshot,
                'user' => $this->order->relationLoaded('user') && $this->order->user !== null
                    ? [
                        'id' => $this->order->user->id,
                        'name' => $this->order->user->name,
                        'email' => $this->order->user->email,
                        'phone' => $this->order->user->phone,
                    ]
                    : null,
                'created_at' => $this->order->created_at?->toIso8601String(),
            ]),
            'items' => $this->whenLoaded(
                'items',
                fn () => OrderItemResource::collection($this->items),
            ),
        ];
    }
}
