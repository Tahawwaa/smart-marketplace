<?php

namespace App\Models;

use App\Enums\VendorStatus;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

#[Fillable([
    'vendor_id',
    'variant_id',
    'warranty_id',
    'lead_time_days',
    'price',
    'sale_price',
    'quantity',
    'reserved_quantity',
    'is_available',
    'lock_version',
])]
class VendorInventory extends Model
{
    use HasFactory, SoftDeletes;

    /** @return Builder<VendorInventory> */
    public function scopePurchasable(Builder $query): Builder
    {
        return $query->where('vendor_inventories.is_available', true)
            ->whereColumn('vendor_inventories.quantity', '>', 'vendor_inventories.reserved_quantity')
            ->whereHas('variant', fn (Builder $variant) => $variant->where('is_active', true)
                ->whereHas('product', fn (Builder $product) => $product->published()))
            ->whereHas('vendor', fn (Builder $vendor) => $vendor->where('status', VendorStatus::Approved)
                ->whereHas('user', fn (Builder $user) => $user->where('is_active', true)));
    }

    public function isPurchasable(): bool
    {
        return static::query()->whereKey($this->id)->purchasable()->exists();
    }

    /**
     * Get the warranty offered by the vendor for this stock row.
     *
     * @return BelongsTo<Warranty, $this>
     */
    public function warranty(): BelongsTo
    {
        return $this->belongsTo(Warranty::class);
    }

    /**
     * Get the active reservations holding stock.
     *
     * @return HasMany<InventoryReservation, $this>
     */
    public function reservations(): HasMany
    {
        return $this->hasMany(InventoryReservation::class);
    }

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'price' => 'decimal:2',
            'sale_price' => 'decimal:2',
            'is_available' => 'boolean',
        ];
    }

    /**
     * @return BelongsTo<Vendor, $this>
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class);
    }

    /**
     * @return BelongsTo<ProductVariant, $this>
     */
    public function variant(): BelongsTo
    {
        return $this->belongsTo(ProductVariant::class, 'variant_id');
    }

    /**
     * @return HasMany<InventoryLog, $this>
     */
    public function logs(): HasMany
    {
        return $this->hasMany(InventoryLog::class);
    }

    /**
     * @return HasMany<CartItem, $this>
     */
    public function cartItems(): HasMany
    {
        return $this->hasMany(CartItem::class);
    }

    public function availableQuantity(): int
    {
        return max(0, $this->quantity - $this->reserved_quantity);
    }

    /**
     * Get the price a customer actually pays for this stock row.
     */
    public function effectivePrice(): float
    {
        return (float) ($this->sale_price ?? $this->price);
    }
}
