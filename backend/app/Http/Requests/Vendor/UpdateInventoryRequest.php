<?php

namespace App\Http\Requests\Vendor;

use Illuminate\Foundation\Http\FormRequest;

class UpdateInventoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'lock_version' => ['sometimes', 'required', 'integer', 'min:0'],
            'price' => ['nullable', 'numeric', 'min:0'],
            'sale_price' => ['nullable', 'numeric', 'min:0'],
            'quantity' => ['nullable', 'integer', 'min:0'],
            'is_available' => ['nullable', 'boolean'],
            'lead_time_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'warranty_id' => ['nullable', 'integer', 'exists:warranties,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'price.min' => 'قیمت نمی‌تواند منفی باشد.',
            'quantity.min' => 'موجودی نمی‌تواند منفی باشد.',
            'warranty_id.exists' => 'گارانتی انتخاب‌شده یافت نشد.',
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function payload(): array
    {
        return $this->validated();
    }
}
