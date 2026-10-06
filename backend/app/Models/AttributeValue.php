<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

#[Fillable(['attribute_id', 'value'])]
class AttributeValue extends Model
{
    /**
     * Disable the default timestamps.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get the attribute the value belongs to.
     *
     * @return BelongsTo<Attribute, $this>
     */
    public function attribute(): BelongsTo
    {
        return $this->belongsTo(Attribute::class);
    }

    /**
     * Get the variants that carry the value.
     *
     * @return BelongsToMany<ProductVariant, $this>
     */
    public function variants(): BelongsToMany
    {
        return $this->belongsToMany(
            ProductVariant::class,
            'variant_attribute_values',
            'attribute_value_id',
            'variant_id',
        );
    }
}
