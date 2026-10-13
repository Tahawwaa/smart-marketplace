<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Http\Controllers\Controller;
use App\Models\Vendor;
use App\Services\VendorStoreService;
use Illuminate\Http\Request;

abstract class VendorController extends Controller
{
    public function __construct(private readonly VendorStoreService $stores) {}

    /**
     * Resolve the store owned by the authenticated account.
     *
     * There is no policy layer yet, so every vendor route funnels through here
     * before touching any store data.
     */
    protected function vendor(Request $request): Vendor
    {
        $user = $request->user();

        abort_if($user === null, 401);

        return $this->stores->forUserOrAbort($user);
    }
}
