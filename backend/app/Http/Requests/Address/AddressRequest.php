<?php

namespace App\Http\Requests\Address;

use Illuminate\Foundation\Http\FormRequest;

class AddressRequest extends FormRequest
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
            'title' => ['nullable', 'string', 'max:255'],
            'province' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'postal_code' => ['nullable', 'string', 'max:20'],
            'address_line' => ['required', 'string', 'max:1000'],
            'recipient_name' => ['required', 'string', 'max:255'],
            'recipient_phone' => ['required', 'string', 'max:20'],
            'is_default' => ['nullable', 'boolean'],
            'latitude' => ['nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'province.required' => 'وارد کردن استان الزامی است.',
            'city.required' => 'وارد کردن شهر الزامی است.',
            'address_line.required' => 'وارد کردن نشانی الزامی است.',
            'recipient_name.required' => 'وارد کردن نام گیرنده الزامی است.',
            'recipient_phone.required' => 'وارد کردن شماره تماس گیرنده الزامی است.',
        ];
    }
}
