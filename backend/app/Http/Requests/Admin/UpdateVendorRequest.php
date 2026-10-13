<?php

namespace App\Http\Requests\Admin;

use App\Enums\VendorStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateVendorRequest extends FormRequest
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
            'store_name' => ['sometimes', 'string', 'max:255'],
            'commission_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'bank_sheba' => ['sometimes', 'nullable', 'string', 'max:26'],
            'status' => ['sometimes', Rule::enum(VendorStatus::class)],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'commission_rate.max' => 'نرخ کمیسیون نمی‌تواند بیشتر از ۱۰۰ درصد باشد.',
            'commission_rate.min' => 'نرخ کمیسیون نمی‌تواند منفی باشد.',
            'bank_sheba.max' => 'شماره شبا حداکثر ۲۶ نویسه است.',
        ];
    }
}
