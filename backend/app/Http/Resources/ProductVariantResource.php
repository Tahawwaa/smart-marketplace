<?php

namespace App\Http\Resources;

use App\Models\AttributeValue;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProductVariantResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'sku' => $this->sku,
            'barcode' => $this->barcode,
            'weight_grams' => $this->weight_grams,
            'is_active' => $this->is_active,
            'attributes' => $this->whenLoaded('attributeValues', fn () => $this->groupedAttributes()),
            'inventories' => $this->whenLoaded(
                'inventories',
                fn () => VendorInventoryResource::collection($this->inventories),
            ),
        ];
    }

    /**
     * Group the variant attribute values under their parent attribute.
     *
     * @return array<int, array<string, mixed>>
     */
    private function groupedAttributes(): array
    {
        return $this->attributeValues
            ->groupBy(fn (AttributeValue $value) => $value->attribute?->slug ?? (string) $value->attribute_id)
            ->map(fn ($values, string $slug) => [
                'slug' => $slug,
                'name' => $values->first()->attribute?->name ?? $slug,
                'values' => $values->map(fn (AttributeValue $value) => [
                    'id' => $value->id,
                    'value' => $value->value,
                    'color_code' => $value->color_code,
                ])->values()->all(),
            ])
            ->values()
            ->all();
    }
}
