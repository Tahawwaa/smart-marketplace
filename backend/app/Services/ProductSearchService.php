<?php

namespace App\Services;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;

class ProductSearchService
{
    public const MAX_TOKENS = 6;

    public const SUGGEST_LIMIT = 8;

    private const MIN_TERM_LENGTH = 2;

    /**
     * Fold Arabic letter/digit variants, ZWNJ and punctuation so that «لپ‌تاپ»
     * and «لپ تاپ» tokenise the same way.
     */
    public function normalize(string $text): string
    {
        $text = strtr($text, [
            'ي' => 'ی', 'ى' => 'ی', 'ك' => 'ک', 'ة' => 'ه', 'ۀ' => 'ه', 'أ' => 'ا', 'إ' => 'ا', 'ؤ' => 'و',
            '٠' => '0', '١' => '1', '٢' => '2', '٣' => '3', '٤' => '4', '٥' => '5', '٦' => '6', '٧' => '7', '٨' => '8', '٩' => '9',
            '۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4', '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9',
            "\u{200C}" => ' ', "\u{200D}" => '', "\u{0640}" => '',
        ]);

        $text = preg_replace('/[\x{064B}-\x{065F}\x{0670}]/u', '', $text) ?? $text;
        $text = preg_replace('/[^\p{L}\p{N}]+/u', ' ', mb_strtolower($text)) ?? $text;

        return trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
    }

    /**
     * @return list<string>
     */
    public function tokens(string $term): array
    {
        $tokens = array_values(array_unique(array_filter(explode(' ', $this->normalize($term)), fn (string $token) => $token !== '')));

        return array_slice($tokens, 0, self::MAX_TOKENS);
    }

    public function buildText(Product $product): string
    {
        $brand = $product->brand_id ? Brand::query()->whereKey($product->brand_id)->value('name') : null;
        $category = $product->category_id ? Category::query()->whereKey($product->category_id)->value('name') : null;
        $name = $this->normalize((string) $product->name);

        return trim(implode(' ', array_filter([
            $name,
            str_replace(' ', '', $name),
            $this->normalize((string) $brand),
            $this->normalize((string) $category),
            $this->normalize((string) $product->description),
        ])));
    }

    public function reindex(Product $product): void
    {
        Product::withTrashed()->whereKey($product->getKey())->update([
            'search_text' => $this->buildText($product),
        ]);
    }

    /**
     * Every token must match the start of a word in the indexed text.
     *
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    public function apply(Builder $query, string $term): Builder
    {
        foreach ($this->tokens($term) as $token) {
            $like = $this->escapeLike($token);

            $query->where(fn (Builder $inner) => $inner
                ->whereRaw("search_text like ? escape '!'", [$like.'%'])
                ->orWhereRaw("search_text like ? escape '!'", ['% '.$like.'%']));
        }

        return $query;
    }

    /**
     * Name-prefix hits first, then the rest, newest first within each group.
     *
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    public function orderByRelevance(Builder $query, string $term): Builder
    {
        $normalized = $this->normalize($term);

        if ($normalized === '') {
            return $query->latest('id');
        }

        $like = $this->escapeLike($normalized);

        return $query
            ->orderByRaw(
                "case when search_text like ? escape '!' then 0 when search_text like ? escape '!' then 1 else 2 end",
                [$like.'%', '%'.$like.'%'],
            )
            ->latest('id');
    }

    /**
     * Lightweight autocomplete payload filtered against the current publication state.
     *
     * @return array{products: list<array<string, mixed>>, categories: list<array<string, mixed>>, brands: list<array<string, mixed>>}
     */
    public function suggest(string $term): array
    {
        $normalized = $this->normalize($term);

        if (mb_strlen($normalized) < self::MIN_TERM_LENGTH) {
            return ['products' => [], 'categories' => [], 'brands' => []];
        }

        return $this->buildSuggestions($normalized);
    }

    /**
     * @return array{products: list<array<string, mixed>>, categories: list<array<string, mixed>>, brands: list<array<string, mixed>>}
     */
    private function buildSuggestions(string $normalized): array
    {
        $products = $this->orderByRelevance(
            $this->apply(
                Product::query()
                    ->select(['id', 'name', 'slug', 'category_id', 'search_text'])
                    ->with(['category:id,name,slug', 'images:id,product_id,path,is_primary,sort_order'])
                    ->published(),
                $normalized,
            ),
            $normalized,
        )->limit(self::SUGGEST_LIMIT)->get();

        $categories = Category::query()
            ->where('is_active', true)
            ->where('name', 'like', '%'.$this->escapeLike($normalized).'%')
            ->limit(3)
            ->get(['id', 'name', 'slug']);

        $brands = Brand::query()
            ->where('is_active', true)
            ->where('name', 'like', '%'.$this->escapeLike($normalized).'%')
            ->limit(3)
            ->get(['id', 'name', 'slug']);

        return [
            'products' => $products->map(fn (Product $product) => [
                'id' => $product->id,
                'name' => $product->name,
                'slug' => $product->slug,
                'category' => $product->category?->name,
                'image' => ($product->images->firstWhere('is_primary', true) ?? $product->images->first())?->path,
            ])->values()->all(),
            'categories' => $categories->map->only(['id', 'name', 'slug'])->values()->all(),
            'brands' => $brands->map->only(['id', 'name', 'slug'])->values()->all(),
        ];
    }

    private function escapeLike(string $value): string
    {
        return strtr($value, ['!' => '!!', '%' => '!%', '_' => '!_']);
    }
}
