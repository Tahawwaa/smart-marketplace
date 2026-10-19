<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductResource;
use App\Models\Product;
use App\Services\ProductRecommendationService;
use App\Services\ProductSearchService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class ProductSearchController extends Controller
{
    public function suggest(Request $request, ProductSearchService $search): JsonResponse
    {
        $validated = $request->validate(['q' => ['nullable', 'string', 'max:100']]);

        return response()
            ->json(['data' => $search->suggest($validated['q'] ?? '')])
            ->header('Cache-Control', 'public, max-age=30');
    }

    public function popular(ProductRecommendationService $recommendations): AnonymousResourceCollection
    {
        return ProductResource::collection($recommendations->popular());
    }

    public function recommendations(Product $product, ProductRecommendationService $recommendations): AnonymousResourceCollection
    {
        abort_unless($product->is_active, 404);

        return ProductResource::collection($recommendations->forProduct($product));
    }
}
