<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Requests\Vendor\StoreProductRequest;
use App\Http\Requests\Vendor\UpdateProductRequest;
use App\Http\Resources\VendorProductResource;
use App\Models\Product;
use App\Services\VendorCatalogService;
use App\Services\VendorStoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Http\Response;

class VendorProductController extends VendorController
{
    public function __construct(
        private readonly VendorCatalogService $catalog,
        VendorStoreService $stores,
    ) {
        parent::__construct($stores);
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $vendor = $this->vendor($request);

        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', 'in:draft,pending,approved,rejected'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $products = Product::query()
            ->where('vendor_id', $vendor->id)
            ->when($filters['status'] ?? null, fn ($query, $status) => $query->where('status', $status))
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->where(fn ($query) => $query
                ->where('name', 'like', '%'.$search.'%')
                ->orWhereHas('variants', fn ($variant) => $variant->where('sku', 'like', '%'.$search.'%'))))
            ->with([
                'category:id,name,slug',
                'brand:id,name,slug',
                'variants' => fn ($query) => $query->orderBy('id'),
                'variants.inventories' => fn ($query) => $query->where('vendor_id', $vendor->id),
            ])
            ->latest('id')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();

        return VendorProductResource::collection($products);
    }

    public function show(Request $request, Product $product): VendorProductResource
    {
        $vendor = $this->vendor($request);
        $this->authorizeProduct($vendor->id, $product);

        return VendorProductResource::make($product->load([
            'category:id,name,slug', 'brand:id,name,slug',
            'variants' => fn ($query) => $query->orderBy('id'),
            'variants.inventories' => fn ($query) => $query->where('vendor_id', $vendor->id),
        ]));
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
