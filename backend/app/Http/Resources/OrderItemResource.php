<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderItemResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'vendor_inventory_id' => $this->vendor_inventory_id,
            'product_name_snapshot' => $this->product_name_snapshot,
            'variant_sku_snapshot' => $this->variant_sku_snapshot,
            'selected_attributes_snapshot' => $this->selected_attributes_snapshot,
            'unit_price' => (float) $this->unit_price,
            'quantity' => (int) $this->quantity,
            'total_price' => (float) $this->total_price,
        ];
    }
}
