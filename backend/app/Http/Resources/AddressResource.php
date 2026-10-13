<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AddressResource extends JsonResource
{
    /**
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'province' => $this->province,
            'city' => $this->city,
            'postal_code' => $this->postal_code,
            'address_line' => $this->address_line,
            'recipient_name' => $this->recipient_name,
            'recipient_phone' => $this->recipient_phone,
            'is_default' => (bool) $this->is_default,
        ];
    }
}
