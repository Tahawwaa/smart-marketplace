<?php

namespace App\Http\Requests\Order;

use Illuminate\Foundation\Http\FormRequest;

class StoreOrderRequest extends FormRequest
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
            'address_id' => ['nullable', 'integer', 'exists:addresses,id'],
            'address' => ['nullable', 'array'],
            'address.title' => ['nullable', 'string', 'max:255'],
            'address.province' => ['required_without:address_id', 'string', 'max:255'],
            'address.city' => ['required_without:address_id', 'string', 'max:255'],
            'address.postal_code' => ['nullable', 'string', 'max:20'],
            'address.address_line' => ['required_without:address_id', 'string', 'max:1000'],
            'address.recipient_name' => ['required_without:address_id', 'string', 'max:255'],
            'address.recipient_phone' => ['required_without:address_id', 'string', 'max:20'],
            'address.latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'address.longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'address_id.exists' => 'نشانی انتخاب‌شده یافت نشد.',
            'address.province.required_without' => 'وارد کردن استان الزامی است.',
            'address.city.required_without' => 'وارد کردن شهر الزامی است.',
            'address.address_line.required_without' => 'وارد کردن نشانی الزامی است.',
            'address.recipient_name.required_without' => 'وارد کردن نام گیرنده الزامی است.',
            'address.recipient_phone.required_without' => 'وارد کردن شماره تماس گیرنده الزامی است.',
        ];
    }
}
