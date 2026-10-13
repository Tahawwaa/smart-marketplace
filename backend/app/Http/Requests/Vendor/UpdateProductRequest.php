<?php

namespace App\Http\Requests\Vendor;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
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
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['nullable', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'variants' => ['nullable', 'array'],
            'variants.*.id' => ['required', 'integer'],
            'variants.*.sku' => ['nullable', 'string', 'max:64'],
            'variants.*.barcode' => ['nullable', 'string', 'max:64'],
            'variants.*.weight_grams' => ['nullable', 'integer', 'min:0'],
            'variants.*.is_active' => ['nullable', 'boolean'],
            'variants.*.price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.sale_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.quantity' => ['nullable', 'integer', 'min:0'],
            'variants.*.warranty_id' => ['nullable', 'integer', 'exists:warranties,id'],
            'variants.*.lead_time_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'variants.*.is_available' => ['nullable', 'boolean'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'category_id.exists' => 'دسته‌بندی انتخاب‌شده یافت نشد.',
            'brand_id.exists' => 'برند انتخاب‌شده یافت نشد.',
        ];
    }

    /**
     * Everything is optional here, so only the sent keys reach the service.
     *
     * @return array<string, mixed>
     */
    public function payload(): array
    {
        return $this->validated();
    }
}
