<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SubOrderResource extends JsonResource
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
            'vendor' => $this->whenLoaded('vendor', fn () => $this->vendor === null ? null : [
                'id' => $this->vendor->id,
                'store_name' => $this->vendor->store_name,
                'slug' => $this->vendor->slug,
            ]),
            'items' => $this->whenLoaded(
                'items',
                fn () => OrderItemResource::collection($this->items),
            ),
        ];
    }
}
