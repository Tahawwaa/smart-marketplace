<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['product_id', 'sku', 'barcode', 'weight_grams'])]
class ProductVariant extends Model
{
    /**
     * Get the product the variant belongs to.
     *
     * @return BelongsTo<Product, $this>
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get the attribute values that define the variant.
     *
     * @return BelongsToMany<AttributeValue, $this>
     */
    public function attributeValues(): BelongsToMany
    {
        return $this->belongsToMany(
            AttributeValue::class,
            'variant_attribute_values',
            'variant_id',
            'attribute_value_id',
        );
    }

    /**
     * Get the vendor inventory rows for the variant.
     *
     * @return HasMany<VendorInventory, $this>
     */
    public function inventories(): HasMany
    {
        return $this->hasMany(VendorInventory::class, 'variant_id');
    }
}
