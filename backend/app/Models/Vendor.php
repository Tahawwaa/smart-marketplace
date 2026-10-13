<?php

namespace App\Models;

use App\Enums\VendorStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable(['user_id', 'store_name', 'slug', 'commission_rate', 'bank_sheba', 'status', 'approved_at'])]
class Vendor extends Model
{
    use HasFactory, SoftDeletes;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'commission_rate' => 'decimal:2',
            'status' => VendorStatus::class,
            'approved_at' => 'datetime',
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
     * Get the products submitted by the vendor.
     *
     * @return HasMany<Product, $this>
     */
    public function products(): HasMany
    {
        return $this->hasMany(Product::class);
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
