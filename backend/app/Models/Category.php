<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['parent_id', 'name', 'slug', 'depth', 'is_active', 'sort_order'])]
class Category extends Model
{
    protected static function booted(): void
    {
        static::saving(function (Category $category) {
            $category->depth = $category->parent_id
                ? (int) static::query()->whereKey($category->parent_id)->value('depth') + 1
                : 0;
        });

        static::saved(function (Category $category) {
            if ($category->wasChanged('depth')) {
                $category->children()->each(fn (Category $child) => $child->save());
            }
            if ($category->wasChanged('name')) {
                $category->products()->each(fn (Product $product) => app(\App\Services\ProductSearchService::class)->reindex($product));
            }
        });
    }

    use HasFactory;

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
     * Get the parent category.
     *
     * @return BelongsTo<Category, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(self::class, 'parent_id');
    }

    /**
     * Get the direct child categories.
     *
     * @return HasMany<Category, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(self::class, 'parent_id');
    }

    /**
     * Get the child categories with their own children, recursively.
     *
     * The whole tree is resolved in one eager load. Callers must keep
     * `parent_id` acyclic; a self-referencing chain would recurse forever.
     *
     * @return HasMany<Category, $this>
     */
    public function childrenRecursive(): HasMany
    {
        return $this->children()
            ->where('is_active', true)
            ->orderBy('sort_order')
            ->orderBy('name')
            ->with('childrenRecursive');
    }

    /**
     * Get the products filed under the category.
     *
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
    }
}
