<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable(['user_id', 'store_name', 'slug', 'commission_rate', 'status'])]
class Vendor extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:2',
        ];
    }

    /**
     * Get the user account behind the vendor.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the inventory rows offered by the vendor.
     *
     * @return HasMany<VendorInventory, $this>
     */
    public function inventories(): HasMany
    {
        return $this->hasMany(VendorInventory::class);
    }

    /**
     * Get the sub-orders fulfilled by the vendor.
     *
     * @return HasMany<SubOrder, $this>
     */
    public function subOrders(): HasMany
    {
        return $this->hasMany(SubOrder::class);
    }

    /**
     * Get the payouts issued to the vendor.
     *
     * @return HasMany<VendorPayout, $this>
     */
    public function payouts(): HasMany
    {
        return $this->hasMany(VendorPayout::class);
    }
}
