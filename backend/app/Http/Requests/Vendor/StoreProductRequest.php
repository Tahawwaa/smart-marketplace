<?php

namespace App\Http\Requests\Vendor;

use App\Enums\ProductStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreProductRequest extends FormRequest
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
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['nullable', Rule::enum(ProductStatus::class)],
            'is_active' => ['nullable', 'boolean'],
            'meta_title' => ['nullable', 'string', 'max:255'],
            'meta_description' => ['nullable', 'string', 'max:500'],
            'variants' => ['required', 'array', 'min:1'],
            'variants.*.sku' => ['nullable', 'string', 'max:64', 'distinct', 'unique:product_variants,sku'],
            'variants.*.barcode' => ['nullable', 'string', 'max:64', 'distinct', 'unique:product_variants,barcode'],
            'variants.*.weight_grams' => ['nullable', 'integer', 'min:0'],
            'variants.*.price' => ['required', 'numeric', 'min:0'],
            'variants.*.sale_price' => ['nullable', 'numeric', 'min:0', 'lte:variants.*.price'],
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
            'category_id.required' => 'انتخاب دسته‌بندی الزامی است.',
            'category_id.exists' => 'دسته‌بندی انتخاب‌شده یافت نشد.',
            'brand_id.exists' => 'برند انتخاب‌شده یافت نشد.',
            'name.required' => 'وارد کردن نام کالا الزامی است.',
            'variants.required' => 'ثبت حداقل یک گونه با قیمت الزامی است.',
            'variants.*.price.required' => 'وارد کردن قیمت هر گونه الزامی است.',
            'variants.*.sku.unique' => 'این کد کالا قبلاً ثبت شده است.',
            'variants.*.barcode.unique' => 'این بارکد قبلاً ثبت شده است.',
        ];
    }

    /**
     * Shape the validated input the way the catalog service expects it.
     *
     * @return array<string, mixed>
     */
    public function payload(): array
    {
        $payload = $this->safe()->only([
            'category_id',
            'brand_id',
            'name',
            'description',
            'is_active',
            'meta_title',
            'meta_description',
        ]);

        // New listings always start as pending review, whatever the client sent.
        // Only an admin can approve a product, so a vendor cannot publish directly.
        $payload['status'] = ProductStatus::Pending;
        $payload['variants'] = array_values($this->validated()['variants']);

        return $payload;
    }
}
