<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AdminUserResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'role' => $this->role?->value ?? $this->role,
            'is_active' => $this->is_active,
            'email_verified_at' => $this->email_verified_at?->toIso8601String(),
            'orders_count' => $this->whenCounted('orders'),
            'vendors' => $this->whenLoaded(
                'vendors',
                fn () => $this->vendors->map(fn ($vendor) => [
                    'id' => $vendor->id,
                    'store_name' => $vendor->store_name,
                    'slug' => $vendor->slug,
                    'status' => $vendor->status?->value ?? $vendor->status,
                ])->values()->all(),
            ),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
