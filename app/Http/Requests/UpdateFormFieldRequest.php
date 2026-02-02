<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFormFieldRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('form_fields', 'name')->ignore($this->route('form_field'))],
            'label' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', Rule::in(['text', 'email', 'number', 'textarea', 'select', 'date', 'file', 'checkbox', 'radio'])],
            'placeholder' => ['nullable', 'string', 'max:255'],
            'help_text' => ['nullable', 'string', 'max:500'],
            'validation_rules' => ['nullable', 'array'],
            'is_active' => ['boolean'],
            'options' => ['required_if:type,select,radio,checkbox', 'nullable', 'array', 'min:1'],
            'options.*.label' => ['required_with:options', 'string', 'max:255'],
            'options.*.value' => ['required_with:options', 'string', 'max:255'],
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
            'name.required' => 'The field name is required.',
            'name.unique' => 'A form field with this name already exists.',
            'label.required' => 'The field label is required.',
            'type.required' => 'Please select a field type.',
            'type.in' => 'The selected field type is invalid.',
            'options.required_if' => 'Options are required for select, radio, and checkbox fields.',
            'options.min' => 'At least one option is required.',
            'options.*.label.required_with' => 'Each option must have a label.',
            'options.*.value.required_with' => 'Each option must have a value.',
        ];
    }
}
