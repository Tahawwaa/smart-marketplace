<?php

namespace App\Http\Controllers\Api\Vendor;

use App\Enums\VendorStatus;
use App\Http\Controllers\Controller;
use App\Models\Vendor;
use Illuminate\Http\Request;

abstract class VendorController extends Controller
{
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

        $vendor = $user->vendors()->first();

        abort_if($vendor === null, 403, 'برای این حساب فروشنده‌ای ثبت نشده است.');
        abort_if(
            in_array($vendor->status, [VendorStatus::Suspended, VendorStatus::Rejected], true),
            403,
            'فروشگاه شما فعال نیست.',
        );

        return $vendor;
    }
}
