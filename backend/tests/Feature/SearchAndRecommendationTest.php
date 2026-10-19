<?php

namespace Tests\Feature;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductVariant;
use App\Models\SubOrder;
use App\Models\VendorInventory;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SearchAndRecommendationTest extends TestCase
{
    use RefreshDatabase;

    private function soldTogether(Product ...$products): void
    {
        $subOrder = SubOrder::factory()->create(['order_id' => Order::factory()->create()->id]);

        foreach ($products as $product) {
            $variant = ProductVariant::factory()->create(['product_id' => $product->id]);
            $inventory = VendorInventory::factory()->create(['variant_id' => $variant->id]);

            OrderItem::factory()->create([
                'sub_order_id' => $subOrder->id,
                'vendor_inventory_id' => $inventory->id,
                'quantity' => 1,
            ]);
        }
    }

    public function test_search_matches_word_prefixes_and_ignores_persian_character_variants(): void
    {
        Product::factory()->create(['name' => 'لپ‌تاپ ایسوس', 'is_active' => true]);
        Product::factory()->create(['name' => 'کتاب داستان', 'is_active' => true]);

        $this->getJson('/api/v1/products?search='.urlencode('لپ تاپ'))
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'لپ‌تاپ ایسوس');

        $this->getJson('/api/v1/products?search='.urlencode('كتاب'))
            ->assertOk()
            ->assertJsonCount(1, 'data');
    }

    public function test_search_also_matches_brand_and_category_names_and_ranks_name_hits_first(): void
    {
        $brand = Brand::query()->create(['name' => 'Zenith', 'slug' => 'zenith', 'is_active' => true]);
        $branded = Product::factory()->create(['name' => 'Alpha', 'brand_id' => $brand->id, 'description' => 'x', 'is_active' => true]);
        $named = Product::factory()->create(['name' => 'Zenith Pro', 'description' => 'x', 'is_active' => true]);

        $ids = collect($this->getJson('/api/v1/products?search=zenith')->assertOk()->json('data'))->pluck('id');

        $this->assertSame([$named->id, $branded->id], $ids->all());
    }

    public function test_renaming_a_product_refreshes_its_search_index(): void
    {
        $product = Product::factory()->create(['name' => 'old name', 'is_active' => true]);
        $product->update(['name' => 'brand new']);

        $this->getJson('/api/v1/products?search=brand')->assertOk()->assertJsonCount(1, 'data');
        $this->getJson('/api/v1/products?search=old')->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_suggest_returns_products_categories_and_brands_for_a_term(): void
    {
        Category::factory()->create(['name' => 'camera gear', 'is_active' => true]);
        Brand::query()->create(['name' => 'Camtech', 'slug' => 'camtech', 'is_active' => true]);
        Product::factory()->create(['name' => 'camera bag', 'is_active' => true]);
        Product::factory()->create(['name' => 'hidden camera', 'is_active' => false]);

        $this->getJson('/api/v1/products/suggest?q=cam')
            ->assertOk()
            ->assertJsonCount(1, 'data.products')
            ->assertJsonPath('data.products.0.name', 'camera bag')
            ->assertJsonCount(1, 'data.categories')
            ->assertJsonCount(1, 'data.brands');
    }

    public function test_suggest_ignores_terms_that_are_too_short(): void
    {
        Product::factory()->create(['name' => 'abc', 'is_active' => true]);

        $this->getJson('/api/v1/products/suggest?q=a')
            ->assertOk()
            ->assertJsonCount(0, 'data.products');
    }

    public function test_recommendations_prefer_bought_together_then_same_category(): void
    {
        $category = Category::factory()->create();
        $main = Product::factory()->create(['category_id' => $category->id, 'is_active' => true]);
        $partner = Product::factory()->create(['is_active' => true]);
        $sibling = Product::factory()->create(['category_id' => $category->id, 'is_active' => true]);
        $this->soldTogether($main, $partner);

        $ids = collect($this->getJson("/api/v1/products/{$main->slug}/recommendations")->assertOk()->json('data'))->pluck('id');

        $this->assertSame($partner->id, $ids->first());
        $this->assertContains($sibling->id, $ids->all());
        $this->assertNotContains($main->id, $ids->all());
    }

    public function test_popular_ranks_by_units_sold_and_skips_inactive_products(): void
    {
        $best = Product::factory()->create(['is_active' => true]);
        $other = Product::factory()->create(['is_active' => true]);
        $inactive = Product::factory()->create(['is_active' => false]);
        $this->soldTogether($best, $other, $inactive);

        $ids = collect($this->getJson('/api/v1/products/popular')->assertOk()->json('data'))->pluck('id');

        $this->assertNotContains($inactive->id, $ids->all());
        $this->assertContains($best->id, $ids->all());
    }

    public function test_recommendations_for_an_inactive_product_return_404(): void
    {
        $product = Product::factory()->create(['is_active' => false]);

        $this->getJson("/api/v1/products/{$product->slug}/recommendations")->assertNotFound();
    }
}
