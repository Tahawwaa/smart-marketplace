<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

#[Fillable([
    'vendor_inventory_id',
    'order_item_id',
    'change_quantity',
    'quantity_before',
    'quantity_after',
    'type',
    'note',
])]
class InventoryLog extends Model
{
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
            'created_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<VendorInventory, $this>
     */
    public function inventory(): BelongsTo
    {
        return $this->belongsTo(VendorInventory::class, 'vendor_inventory_id');
    }

    /**
     * @return BelongsTo<OrderItem, $this>
     */
    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }
}
