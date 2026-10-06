<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['name'])]
class Attribute extends Model
{
    /**
     * Disable the default timestamps.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get the values defined for the attribute.
     *
     * @return HasMany<AttributeValue, $this>
     */
    public function values(): HasMany
    {
        return $this->hasMany(AttributeValue::class);
    }
}
