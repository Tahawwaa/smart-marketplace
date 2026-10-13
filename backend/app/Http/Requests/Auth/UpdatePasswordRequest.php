<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Password;

class UpdatePasswordRequest extends FormRequest
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
            'current_password' => ['required', 'current_password'],
            'password' => ['required', 'confirmed', Password::defaults()],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'current_password.required' => 'وارد کردن گذرواژه‌ی فعلی الزامی است.',
            'current_password.current_password' => 'گذرواژه‌ی فعلی نادرست است.',
            'password.confirmed' => 'تکرار گذرواژه مطابقت ندارد.',
        ];
    }
}
