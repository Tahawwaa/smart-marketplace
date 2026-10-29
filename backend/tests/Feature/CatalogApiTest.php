<?php

namespace Tests\Feature;

use App\Models\Attribute;
use App\Models\AttributeValue;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\Vendor;
use App\Models\VendorInventory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CatalogApiTest extends TestCase
{
    use RefreshDatabase;

    private function inventory(ProductVariant $variant, float $price, int $quantity = 10, array $attributes = []): VendorInventory
    {
        return VendorInventory::factory()->create([
            'variant_id' => $variant->id,
            'price' => $price,
            'quantity' => $quantity,
            'reserved_quantity' => 0,
            ...$attributes,
        ]);
    }

    public function test_product_index_is_paginated_and_wrapped_in_a_data_key(): void
    {
        Product::factory()->count(3)->create(['is_active' => true]);

        $response = $this->getJson('/api/v1/products?per_page=2');

        $response->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.per_page', 2)
            ->assertJsonStructure(['data', 'links', 'meta']);
    }

    public function test_inactive_products_are_hidden_from_the_index_and_return_404(): void
    {
        $hidden = Product::factory()->create(['is_active' => false]);

        $this->getJson('/api/v1/products')->assertOk()->assertJsonCount(0, 'data');
        $this->getJson('/api/v1/products/'.$hidden->slug)->assertNotFound();
    }

    public function test_per_page_is_clamped_to_the_maximum(): void
    {
        $this->getJson('/api/v1/products?per_page=500')
            ->assertStatus(422)
            ->assertJsonValidationErrors('per_page');
    }

    public function test_products_can_be_filtered_by_category_including_descendants(): void
    {
        $root = Category::factory()->create();
        $child = Category::factory()->create(['parent_id' => $root->id]);
        $other = Category::factory()->create();

        $inTree = Product::factory()->create(['category_id' => $child->id, 'is_active' => true]);
        Product::factory()->create(['category_id' => $other->id, 'is_active' => true]);

        $this->getJson('/api/v1/products?category='.$root->slug)
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', $inTree->slug);
    }

    public function test_products_can_be_filtered_by_price_range_and_sorted(): void
    {
        $cheapProduct = Product::factory()->create(['is_active' => true]);
        $expensiveProduct = Product::factory()->create(['is_active' => true]);

        $this->inventory(ProductVariant::factory()->create(['product_id' => $cheapProduct->id]), 100_000);
        $expensive = ProductVariant::factory()->create(['product_id' => $expensiveProduct->id]);
        $this->inventory($expensive, 900_000);

        $this->getJson('/api/v1/products?min_price=500000')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', $expensiveProduct->slug);

        $this->getJson('/api/v1/products?max_price=500000')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', $cheapProduct->slug);

        $this->getJson('/api/v1/products?sort=price_asc')
            ->assertOk()
            ->assertJsonPath('data.0.slug', $cheapProduct->slug)
            ->assertJsonPath('data.0.price_from', 100000)
            ->assertJsonPath('data.1.slug', $expensiveProduct->slug);

        $this->getJson('/api/v1/products?sort=price_desc')
            ->assertOk()
            ->assertJsonPath('data.0.slug', $expensiveProduct->slug);
    }

    public function test_products_can_be_filtered_by_attribute_values(): void
    {
        $color = Attribute::query()->create(['name' => 'Color', 'slug' => 'color']);
        $red = AttributeValue::query()->create(['attribute_id' => $color->id, 'value' => 'red']);

        $matching = Product::factory()->create(['is_active' => true]);
        $other = Product::factory()->create(['is_active' => true]);

        $matchingVariant = ProductVariant::factory()->create(['product_id' => $matching->id]);
        ProductVariant::factory()->create(['product_id' => $other->id]);
        $matchingVariant->attributeValues()->attach($red->id, ['attribute_id' => $color->id]);

        $this->getJson('/api/v1/products?attrs[color][]=red')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', $matching->slug);
    }

    public function test_product_show_includes_variant_id_on_images(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $red = ProductVariant::factory()->create(['product_id' => $product->id]);
        $blue = ProductVariant::factory()->create(['product_id' => $product->id]);
        $this->inventory($red, 250_000);
        $this->inventory($blue, 260_000);
        $product->images()->create([
            'path' => '/products/linen-coat-beige.webp',
            'variant_id' => $red->id,
            'is_primary' => true,
        ]);
        $product->images()->create([
            'path' => '/products/linen-coat-olive.webp',
            'variant_id' => $blue->id,
            'is_primary' => false,
            'sort_order' => 1,
        ]);

        $this->getJson('/api/v1/products/'.$product->slug)
            ->assertOk()
            ->assertJsonPath('data.images.0.variant_id', $red->id)
            ->assertJsonPath('data.images.1.variant_id', $blue->id);
    }

    public function test_product_show_exposes_variants_with_vendor_pricing(): void
    {
        $product = Product::factory()->create(['is_active' => true]);
        $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
        $vendor = Vendor::factory()->create();
        $this->inventory($variant, 250_000, 4, ['vendor_id' => $vendor->id]);

        $this->getJson('/api/v1/products/'.$product->slug)
            ->assertOk()
            ->assertJsonPath('data.variants.0.sku', $variant->sku)
            ->assertJsonPath('data.variants.0.inventories.0.effective_price', 250000)
            ->assertJsonPath('data.variants.0.inventories.0.available_quantity', 4)
            ->assertJsonPath('data.variants.0.inventories.0.vendor.id', $vendor->id);
    }

    public function test_category_index_returns_the_tree(): void
    {
        $root = Category::factory()->create(['name' => 'Root', 'sort_order' => 0]);
        Category::factory()->create(['name' => 'Child', 'parent_id' => $root->id]);

        $this->getJson('/api/v1/categories')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', $root->slug)
            ->assertJsonPath('data.0.children.0.name', 'Child');
    }

    public function test_category_show_includes_the_parent(): void
    {
        $root = Category::factory()->create();
        $child = Category::factory()->create(['parent_id' => $root->id]);

        $this->getJson('/api/v1/categories/'.$child->slug)
            ->assertOk()
            ->assertJsonPath('data.parent.slug', $root->slug);
    }

    public function test_products_can_be_searched_and_filtered_by_brand(): void
    {
        $brand = Brand::query()->create(['name' => 'Acme', 'slug' => 'acme']);

        $match = Product::factory()->create([
            'brand_id' => $brand->id,
            'name' => 'Galaxy Phone',
            'is_active' => true,
        ]);
        Product::factory()->create(['name' => 'Unrelated Chair', 'is_active' => true]);

        $this->getJson('/api/v1/products?search=galaxy')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.slug', $match->slug);

        $this->getJson('/api/v1/products?brand=acme')
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.brand.slug', 'acme');
    }
}
