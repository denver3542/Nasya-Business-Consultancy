<?php

namespace App\Http\Requests;

use App\Models\BoardList;
use Illuminate\Foundation\Http\FormRequest;

class UpdateBoardListRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $boardList = $this->route('list');

        return $boardList instanceof BoardList && $this->user()->can('update', $boardList);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'color' => ['nullable', 'string', 'max:7', 'regex:/^#[a-fA-F0-9]{6}$/'],
            'position' => ['nullable', 'integer', 'min:0'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'name.required' => 'Please enter a list name.',
            'name.max' => 'List name cannot exceed 255 characters.',
            'color.regex' => 'Color must be a valid hex color (e.g., #6b7280).',
            'position.min' => 'Position cannot be negative.',
        ];
    }
}
