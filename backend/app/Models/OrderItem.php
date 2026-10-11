<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'sub_order_id',
    'vendor_inventory_id',
    'product_name_snapshot',
    'variant_sku_snapshot',
    'selected_attributes_snapshot',
    'unit_price',
    'quantity',
    'total_price',
])]
class OrderItem extends Model
{
    use HasFactory;

    /**
     * Disable the default timestamps.
     *
     * @var bool
     */
    public $timestamps = false;

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'selected_attributes_snapshot' => 'array',
            'unit_price' => 'decimal:2',
            'total_price' => 'decimal:2',
            'created_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<SubOrder, $this>
     */
    public function subOrder(): BelongsTo
    {
        return $this->belongsTo(SubOrder::class);
    }

    /**
     * @return BelongsTo<VendorInventory, $this>
     */
    public function inventory(): BelongsTo
    {
        return $this->belongsTo(VendorInventory::class, 'vendor_inventory_id');
    }

    /**
     * @return HasOne<ProductReview, $this>
     */
    public function review(): HasOne
    {
        return $this->hasOne(ProductReview::class);
    }
}
