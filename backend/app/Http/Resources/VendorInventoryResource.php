<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorInventoryResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'price' => (float) $this->price,
            'sale_price' => $this->sale_price === null ? null : (float) $this->sale_price,
            'effective_price' => (float) ($this->sale_price ?? $this->price),
            'quantity' => (int) $this->quantity,
            'reserved_quantity' => (int) $this->reserved_quantity,
            'available_quantity' => $this->availableQuantity(),
            'lead_time_days' => $this->lead_time_days,
            'is_available' => $this->is_available,
            'vendor' => $this->whenLoaded('vendor', fn () => $this->vendor === null ? null : [
                'id' => $this->vendor->id,
                'store_name' => $this->vendor->store_name,
                'slug' => $this->vendor->slug,
            ]),
            'warranty' => $this->whenLoaded('warranty', fn () => $this->warranty === null ? null : [
                'id' => $this->warranty->id,
                'name' => $this->warranty->name,
                'duration_months' => $this->warranty->duration_months,
            ]),
        ];
    }
}
