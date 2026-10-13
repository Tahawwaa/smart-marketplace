<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Requests\Vendor\StoreProductRequest;
use App\Http\Requests\Vendor\UpdateProductRequest;
use App\Http\Resources\VendorProductResource;
use App\Models\Product;
use App\Services\VendorCatalogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class VendorProductController extends VendorController
{
    public function __construct(private readonly VendorCatalogService $catalog) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $vendor = $this->vendor($request);

        $products = Product::query()
            ->where('vendor_id', $vendor->id)
            ->with([
                'category:id,name,slug',
                'brand:id,name,slug',
                'variants' => fn ($query) => $query->orderBy('id'),
                'variants.inventories' => fn ($query) => $query->where('vendor_id', $vendor->id),
            ])
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return VendorProductResource::collection($products);
    }

    public function store(StoreProductRequest $request): JsonResponse
    {
        $vendor = $this->vendor($request);

        $product = $this->catalog->create($vendor, $request->payload());

        return VendorProductResource::make($product)
            ->response()
            ->setStatusCode(Response::HTTP_CREATED);
    }

    public function update(UpdateProductRequest $request, Product $product): VendorProductResource
    {
        $vendor = $this->vendor($request);

        $this->authorizeProduct($vendor->id, $product);

        return VendorProductResource::make($this->catalog->update($vendor, $product, $request->payload()));
    }

    public function destroy(Request $request, Product $product): Response
    {
        $vendor = $this->vendor($request);

        $this->authorizeProduct($vendor->id, $product);

        $this->catalog->archive($product);

        return response()->noContent();
    }

    /**
     * A vendor must never reach another store's catalog through route model binding.
     */
    private function authorizeProduct(int $vendorId, Product $product): void
    {
        abort_unless($product->vendor_id === $vendorId, 404);
    }
}
