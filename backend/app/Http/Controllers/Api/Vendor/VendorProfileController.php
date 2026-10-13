<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Resources\VendorResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VendorProfileController extends VendorController
{
    /**
     * Describe the caller's store, or `null` when the account has none.
     */
    public function show(Request $request): JsonResponse
    {
        $vendor = $request->user()?->vendors()->first();

        return response()->json([
            'data' => $vendor === null ? null : VendorResource::make($vendor)->resolve($request),
        ]);
    }
}
