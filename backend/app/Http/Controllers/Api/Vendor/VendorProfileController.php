<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Requests\Vendor\StoreVendorRequest;
use App\Http\Requests\Vendor\UpdateVendorProfileRequest;
use App\Http\Resources\VendorResource;
use App\Http\Resources\UserResource;
use App\Services\VendorStoreService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Validation\ValidationException;

class VendorProfileController extends VendorController
{
    public function __construct(private readonly VendorStoreService $stores)
    {
        parent::__construct($stores);
    }

    /**
     * Describe the caller's store, or `null` when the account has none.
     */
    public function show(Request $request): JsonResponse
    {
        $vendor = $this->stores->find($request->user());

        return response()->json([
            'data' => $vendor === null ? null : VendorResource::make($vendor)->resolve($request),
        ]);
    }

    public function update(UpdateVendorProfileRequest $request): VendorResource
    {
        $vendor = $this->vendor($request);
        $vendor->update($request->safe()->only(['store_name', 'bank_sheba']));

        return VendorResource::make($vendor->refresh());
    }

    /**
     * Open a store for the signed-in account.
     *
     * This is the entry point a customer uses to become a vendor; the store
     * waits for admin approval before its panel unlocks.
     */
    public function store(StoreVendorRequest $request): JsonResponse
    {
        $user = $request->user();

        if ($this->stores->find($user) !== null) {
            throw ValidationException::withMessages([
                'store_name' => 'برای این حساب قبلاً فروشگاهی ثبت شده است.',
            ]);
        }

        $vendor = $this->stores->open(
            $user,
            $request->string('store_name')->value(),
            $request->filled('bank_sheba') ? $request->string('bank_sheba')->value() : null,
        );

        return response()->json([
            'data' => VendorResource::make($vendor)->resolve($request),
            // The header switches from «فروشنده شوید» to «پنل فروشنده» on this
            // value, so the refreshed account travels back with the store.
            'user' => UserResource::make($user->refresh()->load('store'))->resolve($request),
        ], Response::HTTP_CREATED);
    }
}
