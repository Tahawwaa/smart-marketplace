<?php

namespace App\Services;

use App\Enums\ProductStatus;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Vendor;
use App\Models\VendorInventory;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class VendorCatalogService
{
    /**
     * Create a product together with its first variant and stock row.
     *
     * A vendor listing is meaningless without at least one way to buy it, so the
     * three rows are written as one unit.
     *
     * @param  array<string, mixed>  $payload
     */
    public function create(Vendor $vendor, array $payload): Product
    {
        return DB::transaction(function () use ($vendor, $payload) {
            $product = Product::create([
                'vendor_id' => $vendor->id,
                'category_id' => $payload['category_id'],
                'brand_id' => $payload['brand_id'] ?? null,
                'name' => $payload['name'],
                'slug' => $this->uniqueSlug($payload['name']),
                'description' => $payload['description'] ?? null,
                'status' => $payload['status'] ?? ProductStatus::Pending,
                'is_active' => $payload['is_active'] ?? true,
                'meta_title' => $payload['meta_title'] ?? null,
                'meta_description' => $payload['meta_description'] ?? null,
            ]);

            foreach ($payload['variants'] as $variantPayload) {
                $variant = ProductVariant::create([
                    'product_id' => $product->id,
                    'sku' => $variantPayload['sku'] ?? $this->uniqueSku($product->slug),
                    'barcode' => $variantPayload['barcode'] ?? null,
                    'weight_grams' => $variantPayload['weight_grams'] ?? null,
                    'is_active' => true,
                ]);

                VendorInventory::create([
                    'vendor_id' => $vendor->id,
                    'variant_id' => $variant->id,
                    'warranty_id' => $variantPayload['warranty_id'] ?? null,
                    'lead_time_days' => $variantPayload['lead_time_days'] ?? 0,
                    'price' => $variantPayload['price'],
                    'sale_price' => $variantPayload['sale_price'] ?? null,
                    'quantity' => $variantPayload['quantity'] ?? 0,
                    'reserved_quantity' => 0,
                    'is_available' => $variantPayload['is_available'] ?? true,
                ]);
            }

            return $product->load($this->relations($vendor->id));
        });
    }

    /**
     * Update the product header and any variant or stock rows the vendor sent.
     *
     * Only rows already owned by the caller are touched: a variant id from
     * another store is skipped instead of silently re-assigned.
     *
     * @param  array<string, mixed>  $payload
     */
    public function update(Vendor $vendor, Product $product, array $payload): Product
    {
        return DB::transaction(function () use ($vendor, $product, $payload) {
            $product->update([
                'category_id' => $payload['category_id'] ?? $product->category_id,
                'brand_id' => array_key_exists('brand_id', $payload) ? $payload['brand_id'] : $product->brand_id,
                'name' => $payload['name'] ?? $product->name,
                'description' => array_key_exists('description', $payload) ? $payload['description'] : $product->description,
                'status' => $payload['status'] ?? $product->status,
                'is_active' => array_key_exists('is_active', $payload) ? $payload['is_active'] : $product->is_active,
                'meta_title' => array_key_exists('meta_title', $payload) ? $payload['meta_title'] : $product->meta_title,
                'meta_description' => array_key_exists('meta_description', $payload)
                    ? $payload['meta_description']
                    : $product->meta_description,
            ]);

            foreach ($payload['variants'] ?? [] as $variantPayload) {
                $variant = $product->variants()
                    ->whereKey($variantPayload['id'])
                    ->first();

                if ($variant === null) {
                    continue;
                }

                $variant->update(array_intersect_key($variantPayload, array_flip([
                    'sku', 'barcode', 'weight_grams', 'is_active',
                ])));

                $this->updateStock(
                    $this->stockRow($vendor, $variant),
                    $variantPayload,
                );
            }

            return $product->load($this->relations($vendor->id));
        });
    }

    /**
     * Change price, quantity or the sale flag of a stock row.
     *
     * @param  array<string, mixed>  $payload
     */
    public function updateStock(VendorInventory $inventory, array $payload): VendorInventory
    {
        return DB::transaction(function () use ($inventory, $payload) {
            $inventory = VendorInventory::query()->lockForUpdate()->findOrFail($inventory->id);
            $quantity = $payload['quantity'] ?? null;

            // Stock cannot drop below what shoppers already reserved.
            if ($quantity !== null) {
                $quantity = max((int) $quantity, (int) $inventory->reserved_quantity);
            }

            $salePrice = array_key_exists('sale_price', $payload) ? $payload['sale_price'] : $inventory->sale_price;
            $price = $payload['price'] ?? $inventory->price;

            if ($salePrice !== null && (float) $salePrice > (float) $price) {
                $salePrice = null;
            }

            $inventory->update([
                'price' => $price,
                'sale_price' => $salePrice,
                'quantity' => $quantity ?? $inventory->quantity,
                'is_available' => $payload['is_available'] ?? $inventory->is_available,
                'lead_time_days' => $payload['lead_time_days'] ?? $inventory->lead_time_days,
                'warranty_id' => array_key_exists('warranty_id', $payload) ? $payload['warranty_id'] : $inventory->warranty_id,
            ]);

            $inventory->increment('lock_version');

            return $inventory->refresh();
        });
    }

    /**
     * Take a product off the shelf.
     *
     * Rows are soft deleted, so orders that reference them keep their history.
     */
    public function archive(Product $product): void
    {
        DB::transaction(function () use ($product) {
            $product->update(['is_active' => false]);

            VendorInventory::query()
                ->whereIn('variant_id', $product->variants()->select('id'))
                ->update(['is_available' => false]);

            $product->delete();
        });
    }

    private function stockRow(Vendor $vendor, ProductVariant $variant): VendorInventory
    {
        return VendorInventory::query()->firstOrCreate(
            ['vendor_id' => $vendor->id, 'variant_id' => $variant->id],
            ['price' => 0, 'quantity' => 0, 'reserved_quantity' => 0, 'is_available' => true],
        );
    }

    /**
     * @return array<int, string>
     */
    private function relations(int $vendorId): array
    {
        return [
            'category:id,name,slug',
            'brand:id,name,slug',
            'variants' => fn ($query) => $query->orderBy('id'),
            'variants.inventories' => fn ($query) => $query->where('vendor_id', $vendorId),
        ];
    }

    private function uniqueSlug(string $name): string
    {
        $base = Str::slug($name) ?: 'product';

        do {
            $slug = $base.'-'.Str::lower(Str::random(6));
        } while (Product::withTrashed()->where('slug', $slug)->exists());

        return $slug;
    }

    private function uniqueSku(string $productSlug): string
    {
        do {
            $sku = Str::upper(Str::substr($productSlug, 0, 12)).'-'.Str::upper(Str::random(6));
        } while (ProductVariant::withTrashed()->where('sku', $sku)->exists());

        return $sku;
    }
}
