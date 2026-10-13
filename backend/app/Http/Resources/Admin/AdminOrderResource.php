<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\SubOrderResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminOrderResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status?->value ?? $this->status,
            'payment_status' => $this->payment_status?->value ?? $this->payment_status,
            'total_items_price' => (float) $this->total_items_price,
            'total_shipping_fee' => (float) $this->total_shipping_fee,
            'discount_total' => (float) $this->discount_total,
            'tax_total' => (float) $this->tax_total,
            'grand_total' => (float) $this->grand_total,
            'currency' => $this->currency,
            'shipping_address_snapshot' => $this->shipping_address_snapshot,
            'items_count' => $this->whenCounted('subOrders'),
            'user' => $this->whenLoaded('user', fn () => $this->user === null ? null : [
                'id' => $this->user->id,
                'name' => $this->user->name,
                'email' => $this->user->email,
                'phone' => $this->user->phone,
            ]),
            'sub_orders' => $this->whenLoaded(
                'subOrders',
                fn () => SubOrderResource::collection($this->subOrders),
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
