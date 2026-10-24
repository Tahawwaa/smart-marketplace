<?php

namespace App\Models;

use App\Enums\ProductStatus;
use App\Enums\VendorStatus;
use App\Services\ProductSearchService;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'category_id',
    'brand_id',
    'vendor_id',
    'name',
    'slug',
    'description',
    'ai_generated_description',
    'status',
    'meta_title',
    'meta_description',
    'is_active',
])]
class Product extends Model
{
    use HasFactory, SoftDeletes;

    /** @return Builder<Product> */
    public function scopePublished(Builder $query): Builder
    {
        return $query->where('products.is_active', true)
            ->where('products.status', ProductStatus::Approved)
            ->where(fn (Builder $query) => $query->whereNull('products.vendor_id')
                ->orWhereHas('vendor', fn (Builder $vendor) => $vendor
                    ->where('status', VendorStatus::Approved)
                    ->whereHas('user', fn (Builder $user) => $user->where('is_active', true))));
    }

    protected static function booted(): void
    {
        static::saved(function (Product $product) {
            if ($product->wasRecentlyCreated || $product->wasChanged(['name', 'description', 'brand_id', 'category_id'])) {
                app(ProductSearchService::class)->reindex($product);
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
            'status' => ProductStatus::class,
        ];
    }

    /**
     * Get the brand of the product.
     *
     * @return BelongsTo<Brand, $this>
     */
    public function brand(): BelongsTo
    {
        return $this->belongsTo(Brand::class);
    }

    /**
     * Get the vendor that submitted the product.
     *
     * @return BelongsTo<Vendor, $this>
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    /**
     * Get the images of the product.
     *
     * @return HasMany<ProductImage, $this>
     */
    public function images(): HasMany
    {
        return $this->hasMany(ProductImage::class)->orderBy('sort_order');
    }

    /**
     * Get the category the product belongs to.
     *
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * Get the variants of the product.
     *
     * @return HasMany<ProductVariant, $this>
     */
    public function variants(): HasMany
    {
        return $this->hasMany(ProductVariant::class);
    }

    /**
     * Get the vendor inventory rows across all variants.
     *
     * @return HasManyThrough<VendorInventory, ProductVariant, $this>
     */
    public function inventories(): HasManyThrough
    {
        return $this->hasManyThrough(VendorInventory::class, ProductVariant::class, 'product_id', 'variant_id');
    }

    /**
     * Get the reviews written for the product.
     *
     * @return HasMany<ProductReview, $this>
     */
    public function reviews(): HasMany
    {
        return $this->hasMany(ProductReview::class);
    }
}
