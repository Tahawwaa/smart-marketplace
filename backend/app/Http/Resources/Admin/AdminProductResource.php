<?php

namespace App\Http\Resources\Admin;

use App\Http\Resources\ProductVariantResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminProductResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'slug' => $this->slug,
            'description' => $this->description,
            'status' => $this->status?->value ?? $this->status,
            'is_active' => $this->is_active,
            'brand' => $this->whenLoaded('brand', fn () => $this->brand === null ? null : [
                'id' => $this->brand->id,
                'name' => $this->brand->name,
                'slug' => $this->brand->slug,
            ]),
            'category' => $this->whenLoaded('category', fn () => $this->category === null ? null : [
                'id' => $this->category->id,
                'name' => $this->category->name,
                'slug' => $this->category->slug,
            ]),
            'vendor' => $this->whenLoaded('vendor', fn () => $this->vendor === null ? null : [
                'id' => $this->vendor->id,
                'store_name' => $this->vendor->store_name,
                'slug' => $this->vendor->slug,
            ]),
            'variants' => $this->whenLoaded(
                'variants',
                fn () => ProductVariantResource::collection($this->variants),
            ),
            'created_at' => $this->created_at?->toIso8601String(),
            'updated_at' => $this->updated_at?->toIso8601String(),
        ];
    }
}
