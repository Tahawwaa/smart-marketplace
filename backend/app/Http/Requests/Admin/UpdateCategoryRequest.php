<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCategoryRequest extends FormRequest
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
        $category = $this->route('category');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'slug' => ['sometimes', 'string', 'max:255', Rule::unique('categories', 'slug')->ignore($category)],
            'parent_id' => [
                'sometimes',
                'nullable',
                'integer',
                'exists:categories,id',
                // A category cannot be filed under itself.
                Rule::notIn([$category?->id]),
            ],
            'is_active' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'slug.unique' => 'این نشانی دسته‌بندی قبلاً استفاده شده است.',
            'parent_id.exists' => 'دسته‌بندی والد یافت نشد.',
            'parent_id.not_in' => 'یک دسته‌بندی نمی‌تواند والد خودش باشد.',
        ];
    }
}
