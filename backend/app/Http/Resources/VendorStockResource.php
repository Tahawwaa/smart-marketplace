<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VendorStockResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'vendor_inventory_id' => $this->id,
            'variant_id' => $this->variant_id,
            'price' => (float) $this->price,
            'sale_price' => $this->sale_price === null ? null : (float) $this->sale_price,
            'effective_price' => $this->effectivePrice(),
            'quantity' => (int) $this->quantity,
            'reserved_quantity' => (int) $this->reserved_quantity,
            'available_quantity' => $this->availableQuantity(),
            'lead_time_days' => (int) $this->lead_time_days,
            'is_available' => (bool) $this->is_available,
            'lock_version' => (int) $this->lock_version,
            'variant' => $this->whenLoaded('variant', fn () => $this->variant === null ? null : [
                'id' => $this->variant->id,
                'sku' => $this->variant->sku,
                'product' => $this->variant->relationLoaded('product') && $this->variant->product !== null
                    ? [
                        'id' => $this->variant->product->id,
                        'name' => $this->variant->product->name,
                        'slug' => $this->variant->product->slug,
                    ]
                    : null,
            ]),
            'warranty' => $this->whenLoaded('warranty', fn () => $this->warranty === null ? null : [
                'id' => $this->warranty->id,
                'name' => $this->warranty->name,
                'duration_months' => $this->warranty->duration_months,
            ]),
        ];
    }
}
