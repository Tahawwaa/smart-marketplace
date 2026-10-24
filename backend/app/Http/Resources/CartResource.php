<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CartResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $items = $this->relationLoaded('items') ? $this->items : collect();

        $subtotal = $items->sum(
            fn ($item) => $item->inventory === null
                ? 0
                : $item->inventory->effectivePrice() * (int) $item->quantity,
        );

        return [
            'id' => $this->id,
            'items' => CartItemResource::collection($items),
            'items_count' => $items->count(),
            'total_quantity' => (int) $items->sum('quantity'),
            'subtotal' => round((float) $subtotal, 2),
            'currency' => 'IRT',
            'expires_at' => $this->expires_at?->toIso8601String(),
        ];
    }
}
