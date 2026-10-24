<?php

namespace App\Services;

use App\Enums\UserRole;
use App\Enums\VendorStatus;
use App\Models\User;
use App\Models\Vendor;
use App\Support\Slug;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Owns the link between an account and its store.
 *
 * Selling is not a separate kind of account: any account may open a store, and
 * the `vendor` role is granted alongside the role the account already has so an
 * admin or a long-standing customer never loses their existing access.
 */
class VendorStoreService
{
    /**
     * The caller's store, or `null` when the account has not opened one.
     */
    public function find(User $user): ?Vendor
    {
        return $user->store()->first();
    }

    /**
     * The caller's store, rejecting the request when it is missing or locked.
     *
     * Every vendor route funnels through here before touching store data.
     */
    public function forUserOrAbort(User $user): Vendor
    {
        $vendor = $this->find($user);

        abort_if($vendor === null, 403, 'برای این حساب فروشنده‌ای ثبت نشده است.');
        abort_if(
            in_array($vendor->status, [VendorStatus::Suspended, VendorStatus::Rejected], true),
            403,
            'فروشگاه شما فعال نیست.',
        );

        return $vendor;
    }

    /**
     * Open a store for the account and wait for an admin to approve it.
     *
     * The account keeps its current role; `vendor` is added on top so a
     * customer remains a customer and an admin remains an admin.
     */
    public function open(User $user, string $storeName, ?string $bankSheba = null): Vendor
    {
        return DB::transaction(function () use ($user, $storeName, $bankSheba) {
            $user = User::query()->lockForUpdate()->findOrFail($user->id);
            if ($this->find($user) !== null) {
                throw ValidationException::withMessages(['store_name' => 'برای این حساب قبلاً فروشگاهی ثبت شده است.']);
            }

            $vendor = $user->store()->create([
                'store_name' => $storeName,
                'slug' => $this->uniqueSlug($storeName),
                'bank_sheba' => $bankSheba,
                // A new store starts empty and unapproved; only an admin can
                // move it to `approved`.
                'status' => VendorStatus::Pending,
                'commission_rate' => 0,
            ]);

            // An admin keeps the admin role: losing it would lock them out of
            // the panel they just used to approve stores.
            if (! $user->isAdmin()) {
                $user->update(['role' => UserRole::Vendor]);
            }

            return $vendor;
        });
    }

    private function uniqueSlug(string $storeName): string
    {
        $base = Slug::make($storeName, 'store');
        $slug = $base;
        $counter = 1;

        while (Vendor::withTrashed()->where('slug', $slug)->exists()) {
            $slug = $base.'-'.(++$counter);
        }

        return $slug;
    }
}
