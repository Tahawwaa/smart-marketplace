<?php

namespace App\Http\Requests\Cart;

use Illuminate\Foundation\Http\FormRequest;

class AddCartItemRequest extends FormRequest
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
            'vendor_inventory_id' => ['required', 'integer', 'exists:vendor_inventories,id'],
            'quantity' => ['nullable', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'vendor_inventory_id.required' => 'انتخاب کالا برای افزودن به سبد الزامی است.',
            'vendor_inventory_id.exists' => 'این کالا در سیستم موجود نیست.',
            'quantity.min' => 'تعداد باید حداقل ۱ باشد.',
            'quantity.max' => 'حداکثر تعداد قابل سفارش ۱۰۰ عدد است.',
        ];
    }

    public function quantity(): int
    {
        return (int) $this->input('quantity', 1);
    }
}
