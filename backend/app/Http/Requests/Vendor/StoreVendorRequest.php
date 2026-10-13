<?php

namespace App\Http\Requests\Vendor;

use Illuminate\Foundation\Http\FormRequest;

class StoreVendorRequest extends FormRequest
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
            'store_name' => ['required', 'string', 'max:255'],
            // Sheba is optional; a vendor can add it later from the panel.
            'bank_sheba' => ['nullable', 'string', 'max:26', 'regex:/^IR\d{24}$/i'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'store_name.required' => 'نام فروشگاه الزامی است.',
            'store_name.max' => 'نام فروشگاه حداکثر ۲۵۵ نویسه است.',
            'bank_sheba.regex' => 'شماره شبا باید با IR شروع شود و ۲۴ رقم داشته باشد.',
        ];
    }
}
