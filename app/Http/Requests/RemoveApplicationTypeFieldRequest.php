<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RemoveApplicationTypeFieldRequest extends FormRequest
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
            'field_name' => ['nullable', 'string', 'required_without:form_field_id'],
            'form_field_id' => ['nullable', 'integer', 'exists:form_fields,id', 'required_without:field_name'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'field_name.required_without' => 'Provide a field name or form field ID to remove.',
            'form_field_id.required_without' => 'Provide a form field ID or field name to remove.',
            'form_field_id.exists' => 'The selected form field does not exist.',
        ];
    }
}
