<?php

namespace App\Http\Requests\Vendor;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateVendorProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'store_name' => ['required', 'string', 'max:255'],
            'bank_sheba' => ['nullable', 'string', 'regex:/^IR\d{24}$/'],
        ];
    }

    protected function prepareForValidation(): void
    {
        if (is_string($this->input('bank_sheba'))) {
            $this->merge(['bank_sheba' => strtoupper(preg_replace('/\s+/', '', $this->input('bank_sheba')))]);
        }
    }
}
