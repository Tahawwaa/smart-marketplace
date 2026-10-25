<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Requests\Vendor\UpdateInventoryRequest;
use App\Http\Resources\VendorStockResource;
use App\Models\VendorInventory;
use App\Services\VendorCatalogService;
use App\Services\VendorStoreService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VendorInventoryController extends VendorController
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
            'stock' => ['nullable', 'in:low,out,available,disabled'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        $rows = VendorInventory::query()
            ->where('vendor_id', $vendor->id)
            ->whereHas('variant.product')
            ->when($filters['search'] ?? null, fn ($query, $search) => $query->whereHas('variant', fn ($variant) => $variant
                ->where(fn ($variant) => $variant->where('sku', 'like', '%'.$search.'%')
                    ->orWhereHas('product', fn ($product) => $product->where('name', 'like', '%'.$search.'%')))))
            ->when(($filters['stock'] ?? null) === 'low', fn ($query) => $query->whereRaw('(quantity - reserved_quantity) between 1 and 5'))
            ->when(($filters['stock'] ?? null) === 'out', fn ($query) => $query->whereColumn('quantity', '<=', 'reserved_quantity'))
            ->when(($filters['stock'] ?? null) === 'available', fn ($query) => $query->whereColumn('quantity', '>', 'reserved_quantity')->where('is_available', true))
            ->when(($filters['stock'] ?? null) === 'disabled', fn ($query) => $query->where('is_available', false))
            ->with('variant.product:id,name,slug')
            ->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 15)
            ->withQueryString();

        return VendorStockResource::collection($rows);
    }

    public function update(UpdateInventoryRequest $request, VendorInventory $inventory): VendorStockResource
    {
        $vendor = $this->vendor($request);

        abort_unless($inventory->vendor_id === $vendor->id, 404);

        $inventory = $this->catalog->updateStock($inventory, $request->payload());

        return VendorStockResource::make($inventory->load('variant.product:id,name,slug'));
    }
}
