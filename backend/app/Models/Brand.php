<?php

namespace App\Models;

use App\Services\ProductSearchService;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'name',
    'slug',
    'logo_path',
    'is_active',
])]
class Brand extends Model
{
    protected static function booted(): void
    {
        static::updated(function (Brand $brand) {
            if ($brand->wasChanged('name')) {
                $brand->products()->each(fn (Product $product) => app(ProductSearchService::class)->reindex($product));
            }
        });
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    /**
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
