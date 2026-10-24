<?php

namespace App\Http\Requests\Vendor;

use App\Models\ProductVariant;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

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
        $rules = [
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'name' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'is_active' => ['sometimes', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'variants' => ['nullable', 'array'],
            'variants.*.id' => ['required', 'integer', 'distinct', Rule::exists('product_variants', 'id')->where('product_id', $this->route('product')?->id)->whereNull('deleted_at')],
            'variants.*.sku' => ['sometimes', 'required', 'string', 'max:64', 'distinct'],
            'variants.*.barcode' => ['nullable', 'string', 'max:64'],
            'variants.*.weight_grams' => ['nullable', 'integer', 'min:0'],
            'variants.*.is_active' => ['sometimes', 'boolean'],
            'variants.*.price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.sale_price' => ['nullable', 'numeric', 'min:0'],
            'variants.*.quantity' => ['nullable', 'integer', 'min:0'],
            'variants.*.warranty_id' => ['nullable', 'integer', 'exists:warranties,id'],
            'variants.*.lead_time_days' => ['nullable', 'integer', 'min:0', 'max:365'],
            'variants.*.is_available' => ['nullable', 'boolean'],
        ];

        foreach (is_array($this->input('variants')) ? $this->input('variants') : [] as $index => $variant) {
            $id = is_array($variant) ? ($variant['id'] ?? null) : null;
            $ownedVariant = is_scalar($id) ? ProductVariant::query()
                ->where('product_id', $this->route('product')?->id)->find($id) : null;

            foreach (['sku', 'barcode'] as $column) {
                $rules["variants.$index.$column"] = [
                    ...$rules["variants.*.$column"],
                    Rule::unique('product_variants', $column)->ignore($ownedVariant),
                ];
            }
        }

        return $rules;
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
