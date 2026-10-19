<?php

namespace App\Http\Filters;

use App\Models\Category;
use App\Models\Product;
use App\Services\ProductSearchService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class ProductFilter
{
    public const PER_PAGE_DEFAULT = 15;

    public const PER_PAGE_MAX = 100;

    /**
     * Depth guard so a malformed parent chain cannot loop forever.
     */
    private const MAX_CATEGORY_DEPTH = 10;

    public function __construct(private readonly ProductSearchService $search) {}

    /**
     * Normalise the query string into a validated filter array.
     *
     * @return array<string, mixed>
     */
    public function fromRequest(Request $request): array
    {
        $filters = $request->validate([
            'category' => ['nullable', 'string', 'max:255'],
            'brand' => ['nullable', 'string', 'max:255'],
            'vendor' => ['nullable', 'string', 'max:255'],
            'search' => ['nullable', 'string', 'max:100'],
            'min_price' => ['nullable', 'integer', 'min:0'],
            'max_price' => [
                'nullable',
                'integer',
                'min:0',
                Rule::when($request->filled('min_price'), ['gte:min_price']),
            ],
            'attrs' => ['nullable', 'array'],
            'attrs.*' => ['nullable', function (string $attribute, mixed $value, \Closure $fail) {
                foreach ((array) $value as $single) {
                    if (! is_string($single) || trim($single) === '') {
                        $fail('مقدار فیلتر ویژگی معتبر نیست.');

                        return;
                    }
                }
            }],
            'sort' => ['nullable', 'in:newest,price_asc,price_desc,name'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:'.self::PER_PAGE_MAX],
        ]);

        $filters['attrs'] = $this->normaliseAttributes($filters['attrs'] ?? []);

        return $filters;
    }

    /**
     * Apply the catalog filters to a product query.
     *
     * @param  Builder<Product>  $query
     * @param  array<string, mixed>  $filters
     * @return Builder<Product>
     */
    public function apply(Builder $query, array $filters): Builder
    {
        $query
            ->when(isset($filters['category']), fn (Builder $query) => $query->whereIn(
                'category_id',
                $this->categoryTreeIds($filters['category']),
            ))
            ->when(isset($filters['brand']), fn (Builder $query) => $query->whereHas(
                'brand',
                fn (Builder $brand) => $brand->where('slug', $filters['brand']),
            ))
            ->when(isset($filters['vendor']), fn (Builder $query) => $query->whereHas(
                'inventories',
                fn (Builder $inventory) => $inventory
                    ->where('is_available', true)
                    ->whereHas('vendor', fn (Builder $vendor) => $vendor->where('slug', $filters['vendor'])),
            ))
            ->when(isset($filters['search']), fn (Builder $query) => $this->search->apply($query, $filters['search']))
            ->when(
                isset($filters['min_price']) || isset($filters['max_price']),
                function (Builder $query) use ($filters) {
                    $query->whereHas('inventories', fn (Builder $inventory) => $inventory
                        ->where('is_available', true)
                        ->when(
                            isset($filters['min_price']),
                            fn (Builder $inventory) => $inventory->whereRaw(
                                'coalesce(sale_price, price) >= ?',
                                [(int) $filters['min_price']],
                            ),
                        )
                        ->when(
                            isset($filters['max_price']),
                            fn (Builder $inventory) => $inventory->whereRaw(
                                'coalesce(sale_price, price) <= ?',
                                [(int) $filters['max_price']],
                            ),
                        ));
                },
            );

        $this->applyAttributes($query, $filters['attrs']);

        return $this->applySort($query, $filters['sort'] ?? 'newest', $filters['search'] ?? null);
    }

    /**
     * @param  Builder<Product>  $query
     * @param  array<string, list<string>>  $attributes
     */
    private function applyAttributes(Builder $query, array $attributes): void
    {
        foreach ($attributes as $attribute => $values) {
            $query->whereHas('variants', fn (Builder $variant) => $variant
                ->where('is_active', true)
                ->whereHas('attributeValues', fn (Builder $value) => $value
                    ->whereIn('value', $values)
                    ->whereHas('attribute', fn (Builder $definition) => is_numeric($attribute)
                        ? $definition->whereKey($attribute)
                        : $definition->where('slug', $attribute))));
        }
    }

    /**
     * @param  Builder<Product>  $query
     * @return Builder<Product>
     */
    private function applySort(Builder $query, string $sort, ?string $search = null): Builder
    {
        if ($sort === 'price_asc' || $sort === 'price_desc') {
            $query->withMin(
                ['inventories as price_from' => fn (Builder $inventory) => $inventory->where('is_available', true)],
                DB::raw('coalesce(sale_price, price)'),
            );
        }

        return match ($sort) {
            'price_asc' => $query->orderBy('price_from'),
            'price_desc' => $query->orderByDesc('price_from'),
            'name' => $query->orderBy('name'),
            default => $search === null ? $query->latest('id') : $this->search->orderByRelevance($query, $search),
        };
    }

    /**
     * Resolve a category slug to the ids of itself and every descendant.
     *
     * @return list<int>
     */
    private function categoryTreeIds(string $slug): array
    {
        $rootId = Category::query()->where('slug', $slug)->value('id');

        if ($rootId === null) {
            return [];
        }

        $ids = [$rootId];

        for ($depth = 0, $frontier = [$rootId]; $frontier !== [] && $depth < self::MAX_CATEGORY_DEPTH; $depth++) {
            $frontier = Category::query()
                ->whereIn('parent_id', $frontier)
                ->whereNotIn('id', $ids)
                ->pluck('id')
                ->all();

            $ids = array_merge($ids, $frontier);
        }

        return array_values($ids);
    }

    /**
     * Accept both `attrs[color][]=red` and `attrs[color]=red,blue`.
     *
     * @param  array<string, mixed>  $attributes
     * @return array<string, list<string>>
     */
    private function normaliseAttributes(array $attributes): array
    {
        $normalised = [];

        foreach ($attributes as $attribute => $values) {
            $normalised[(string) $attribute] = collect((array) $values)
                ->flatMap(fn ($value) => explode(',', (string) $value))
                ->map(fn (string $value) => trim($value))
                ->filter()
                ->unique()
                ->values()
                ->all();
        }

        return array_filter($normalised);
    }
}
