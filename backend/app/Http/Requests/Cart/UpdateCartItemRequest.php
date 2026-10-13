<?php

namespace App\Http\Requests\Cart;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCartItemRequest extends FormRequest
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
            'quantity' => ['required', 'integer', 'min:1', 'max:100'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'quantity.required' => 'وارد کردن تعداد الزامی است.',
            'quantity.min' => 'برای حذف کالا از دکمه‌ی حذف استفاده کنید.',
            'quantity.max' => 'حداکثر تعداد قابل سفارش ۱۰۰ عدد است.',
        ];
    }

    public function quantity(): int
    {
        return (int) $this->input('quantity');
    }
}
