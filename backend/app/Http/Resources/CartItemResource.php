<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $inventory = $this->relationLoaded('inventory') ? $this->inventory : null;
        $variant = $inventory?->relationLoaded('variant') ? $inventory->variant : null;
        $product = $variant?->relationLoaded('product') ? $variant->product : null;
        $unitPrice = $inventory !== null ? $inventory->effectivePrice() : (float) $this->unit_price_snapshot;
        $quantity = (int) $this->quantity;

        return [
            'id' => $this->id,
            'vendor_inventory_id' => $this->vendor_inventory_id,
            'quantity' => $quantity,
            'unit_price' => $unitPrice,
            'unit_price_snapshot' => $this->unit_price_snapshot === null ? null : (float) $this->unit_price_snapshot,
            'total_price' => round($unitPrice * $quantity, 2),
            'available_quantity' => $inventory?->availableQuantity(),
            'product' => $product === null ? null : [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
            ],
            'variant' => $variant === null ? null : [
                'id' => $variant->id,
                'sku' => $variant->sku,
            ],
            'vendor' => $inventory?->relationLoaded('vendor') && $inventory->vendor !== null ? [
                'id' => $inventory->vendor->id,
                'store_name' => $inventory->vendor->store_name,
                'slug' => $inventory->vendor->slug,
            ] : null,
        ];
    }
}
