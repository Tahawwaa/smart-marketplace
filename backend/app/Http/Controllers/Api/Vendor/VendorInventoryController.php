<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Requests\Vendor\UpdateInventoryRequest;
use App\Http\Resources\VendorStockResource;
use App\Models\VendorInventory;
use App\Services\VendorCatalogService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VendorInventoryController extends VendorController
{
    public function __construct(private readonly VendorCatalogService $catalog) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $vendor = $this->vendor($request);

        $rows = VendorInventory::query()
            ->where('vendor_id', $vendor->id)
            ->with('variant.product:id,name,slug')
            ->orderByDesc('id')
            ->paginate(15)
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
