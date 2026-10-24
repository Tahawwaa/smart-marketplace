<?php

namespace App\Services;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class ProductRecommendationService
{
    public const LIMIT = 8;

    private const TTL_SECONDS = 600;

    /**
     * Items bought together with the product, topped up with similar products
     * (same category/brand) and, as a last resort, the best sellers.
     *
     * @return Collection<int, Product>
     */
    public function forProduct(Product $product): Collection
    {
        $ids = Cache::remember(
            'recommendations:product:'.$product->id,
            self::TTL_SECONDS,
            fn () => $this->rankedIdsFor($product),
        );

        return $this->hydrate($ids);
    }

    /**
     * @return Collection<int, Product>
     */
    public function popular(): Collection
    {
        return $this->hydrate(Cache::remember('recommendations:popular', self::TTL_SECONDS, fn () => $this->popularIds()));
    }

    /**
     * @return list<int>
     */
    private function rankedIdsFor(Product $product): array
    {
        $ids = $this->boughtTogetherIds($product);

        if (count($ids) < self::LIMIT) {
            $ids = array_merge($ids, $this->similarIds($product, $ids));
        }

        if (count($ids) < self::LIMIT) {
            $ids = array_merge($ids, array_diff($this->popularIds(), $ids, [$product->id]));
        }

        return array_slice(array_values(array_unique($ids)), 0, self::LIMIT);
    }

    /**
     * Co-purchase counts from order history (products sharing a sub-order).
     *
     * @return list<int>
     */
    private function boughtTogetherIds(Product $product): array
    {
        $subOrderIds = $this->soldItemsQuery()
            ->where('product_variants.product_id', $product->id)
            ->select('order_items.sub_order_id');

        return $this->soldItemsQuery()
            ->whereIn('order_items.sub_order_id', $subOrderIds)
            ->where('product_variants.product_id', '!=', $product->id)
            ->groupBy('product_variants.product_id')
            ->orderByRaw('sum(order_items.quantity) desc')
            ->limit(self::LIMIT)
            ->pluck('product_variants.product_id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * @param  list<int>  $exclude
     * @return list<int>
     */
    private function similarIds(Product $product, array $exclude): array
    {
        return Product::query()
            ->published()
            ->whereKeyNot($product->id)
            ->whereNotIn('id', $exclude)
            ->where(fn (Builder $query) => $query
                ->where('category_id', $product->category_id)
                ->when($product->brand_id, fn (Builder $inner) => $inner->orWhere('brand_id', $product->brand_id)))
            ->orderByRaw('case when category_id = ? then 0 else 1 end', [$product->category_id])
            ->latest('id')
            ->limit(self::LIMIT)
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();
    }

    /**
     * Best sellers by units sold, padded with the newest products.
     *
     * @return list<int>
     */
    private function popularIds(): array
    {
        $sold = $this->soldItemsQuery()
            ->groupBy('product_variants.product_id')
            ->orderByRaw('sum(order_items.quantity) desc')
            ->limit(self::LIMIT)
            ->pluck('product_variants.product_id')
            ->map(fn ($id) => (int) $id)
            ->all();

        if (count($sold) >= self::LIMIT) {
            return $sold;
        }

        $fill = Product::query()
            ->published()
            ->whereNotIn('id', $sold)
            ->latest('id')
            ->limit(self::LIMIT - count($sold))
            ->pluck('id')
            ->map(fn ($id) => (int) $id)
            ->all();

        return array_merge($sold, $fill);
    }

    private function soldItemsQuery(): \Illuminate\Database\Query\Builder
    {
        return DB::table('order_items')
            ->join('vendor_inventories', 'vendor_inventories.id', '=', 'order_items.vendor_inventory_id')
            ->join('product_variants', 'product_variants.id', '=', 'vendor_inventories.variant_id')
            ->join('sub_orders', 'sub_orders.id', '=', 'order_items.sub_order_id')
            ->join('orders', 'orders.id', '=', 'sub_orders.order_id')
            ->whereIn('orders.payment_status', ['paid', 'partially_refunded'])
            ->whereNotIn('sub_orders.status', ['cancelled', 'refunded'])
            ->whereNull('orders.deleted_at')
            ->whereNull('sub_orders.deleted_at')
            ->join('products', 'products.id', '=', 'product_variants.product_id')
            ->whereIn('products.id', Product::query()->published()->select('products.id'))
            ->whereNull('products.deleted_at');
    }

    /**
     * @param  list<int>  $ids
     * @return Collection<int, Product>
     */
    private function hydrate(array $ids): Collection
    {
        $products = Product::query()
            ->with(['brand:id,name,slug', 'category:id,name,slug', 'images'])
            ->withMin(
                ['inventories as price_from' => fn (Builder $inventory) => $inventory->purchasable()],
                DB::raw('coalesce(sale_price, price)'),
            )
            ->published()
            ->whereIn('id', $ids)
            ->get();

        return $products
            ->sortBy(fn (Product $product) => array_search($product->id, $ids, true))
            ->values();
    }
}
