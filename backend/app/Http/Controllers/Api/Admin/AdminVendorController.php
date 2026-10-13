<?php

namespace App\Http\Controllers\Api\Admin;

use App\Enums\VendorStatus;
use App\Http\Requests\Admin\UpdateVendorRequest;
use App\Http\Requests\Admin\UpdateVendorStatusRequest;
use App\Http\Resources\Admin\AdminVendorResource;
use App\Models\Vendor;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class AdminVendorController extends AdminController
{
    public function index(Request $request): AnonymousResourceCollection
    {
        $vendors = Vendor::query()
            ->when(
                $request->filled('status'),
                fn ($query) => $query->where('status', $request->string('status')->value()),
            )
            ->when(
                $request->filled('search'),
                fn ($query) => $query->where(
                    fn ($inner) => $inner
                        ->where('store_name', 'like', '%'.$request->string('search')->value().'%')
                        ->orWhere('slug', 'like', '%'.$request->string('search')->value().'%'),
                ),
            )
            ->with('user:id,name,email')
            ->withCount(['products', 'inventories'])
            ->latest('id')
            ->paginate($this->perPage($request))
            ->withQueryString();

        return AdminVendorResource::collection($vendors);
    }

    public function show(Vendor $vendor): AdminVendorResource
    {
        return AdminVendorResource::make(
            $vendor->load('user:id,name,email')->loadCount(['products', 'inventories']),
        );
    }

    /**
     * Approving a store stamps `approved_at`; the other transitions only flip status.
     */
    public function updateStatus(UpdateVendorStatusRequest $request, Vendor $vendor): AdminVendorResource
    {
        $status = VendorStatus::from($request->string('status')->value());

        $vendor->update([
            'status' => $status,
            'approved_at' => $status === VendorStatus::Approved
                ? ($vendor->approved_at ?? now())
                : $vendor->approved_at,
        ]);

        return AdminVendorResource::make(
            $vendor->load('user:id,name,email')->loadCount(['products', 'inventories']),
        );
    }

    public function update(UpdateVendorRequest $request, Vendor $vendor): AdminVendorResource
    {
        $vendor->update($request->validated());

        return AdminVendorResource::make(
            $vendor->load('user:id,name,email')->loadCount(['products', 'inventories']),
        );
    }
}
