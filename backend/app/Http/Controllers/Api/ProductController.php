<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Filters\ProductFilter;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductController extends Controller
{
    public function index(Request $request, ProductFilter $filter): AnonymousResourceCollection
    {
        $filters = $filter->fromRequest($request);

        $products = $filter->apply(
            Product::query()
                ->with(['brand:id,name,slug', 'category:id,name,slug'])
                ->where('is_active', true),
            $filters,
        )
            ->paginate($filters['per_page'] ?? ProductFilter::PER_PAGE_DEFAULT)
            ->withQueryString();

        return ProductResource::collection($products);
    }

    public function show(Product $product): ProductResource
    {
        abort_unless($product->is_active, 404);

        $product->load([
            'brand:id,name,slug',
            'category:id,name,slug',
            'images',
            'variants' => fn ($query) => $query->where('is_active', true),
            'variants.attributeValues.attribute:id,name,slug',
            'variants.inventories.vendor:id,store_name,slug',
            'variants.inventories.warranty:id,name,duration_months',
        ]);

        return ProductResource::make($product);
    }
}
