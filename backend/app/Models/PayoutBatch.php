<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Fillable([
    'reference',
    'total_amount',
    'status',
    'paid_at',
])]
class PayoutBatch extends Model
{
    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'total_amount' => 'decimal:2',
            'paid_at' => 'datetime',
        ];
    }

    /**
     * @return HasMany<VendorPayout, $this>
     */
    public function payouts(): HasMany
    {
        return $this->hasMany(VendorPayout::class);
    }
}
