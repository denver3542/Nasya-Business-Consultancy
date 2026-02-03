<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFormFieldRequest extends FormRequest
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
            'name' => [
                'required', 
                'string', 
                'max:255',
                Rule::unique('form_fields', 'name')->ignore($this->route('form_field'))
            ],
            'label' => ['required', 'string', 'max:255'],
            'type' => ['required', 'string', Rule::in([
                'text', 'email', 'number', 'tel', 'url', 'date', 
                'datetime', 'time', 'textarea', 'select', 'radio', 
                'checkbox', 'file'
            ])],
            'placeholder' => ['nullable', 'string', 'max:255'],
            'help_text' => ['nullable', 'string', 'max:1000'],
            'is_active' => ['boolean'],
            'options' => [
                Rule::requiredIf(function () {
                    return $this->requiresOptions();
                }),
                'array',
                Rule::when($this->requiresOptions(), ['min:1'], ['nullable'])
            ],
            'options.*.label' => [
                Rule::requiredIf($this->requiresOptions()),
                'string',
                'max:255'
            ],
            'options.*.value' => [
                Rule::requiredIf($this->requiresOptions()),
                'string',
                'max:255'
            ],
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
            'options.required' => 'At least one option is required for select, radio, and checkbox fields.',
            'options.min' => 'At least one option is required.',
            'options.*.label.required' => 'Option label is required.',
            'options.*.value.required' => 'Option value is required.',
            'name.unique' => 'A form field with this name already exists.',
        ];
    }

    /**
     * Check if the current field type requires options
     */
    protected function requiresOptions(): bool
    {
        return in_array($this->input('type'), ['select', 'radio', 'checkbox']);
    }

    /**
     * Prepare the data for validation
     */
    protected function prepareForValidation(): void
    {
        // Clean up options based on field type
        if (!$this->requiresOptions()) {
            // Remove options entirely if not needed
            $this->merge(['options' => null]);
        } else {
            // Filter out empty options
            $options = $this->input('options', []);
            
            if (is_array($options)) {
                $filteredOptions = array_values(array_filter($options, function($option) {
                    return is_array($option) && 
                           (isset($option['label']) && trim($option['label']) !== '') ||
                           (isset($option['value']) && trim($option['value']) !== '');
                }));
                
                $this->merge(['options' => $filteredOptions]);
            }
        }
    }
}