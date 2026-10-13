<?php

namespace App\Http\Requests\Vendor;

use App\Enums\OrderStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubOrderStatusRequest extends FormRequest
{
    /**
     * A vendor may not cancel or refund an order on the shopper's behalf.
     */
    private const ALLOWED = [
        OrderStatus::Confirmed,
        OrderStatus::Processing,
        OrderStatus::Shipped,
        OrderStatus::Delivered,
    ];

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
            'status' => ['required', Rule::in(array_map(fn (OrderStatus $status) => $status->value, self::ALLOWED))],
            'note' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'status.required' => 'انتخاب وضعیت جدید الزامی است.',
            'status.in' => 'این وضعیت برای فروشنده مجاز نیست.',
            'note.max' => 'توضیح حداکثر ۱۰۰۰ نویسه می‌تواند باشد.',
        ];
    }
}
