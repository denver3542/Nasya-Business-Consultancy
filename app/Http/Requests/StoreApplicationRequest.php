<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreApplicationRequest extends FormRequest
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
            'client_id' => 'required|exists:users,id',
            'application_type_id' => 'required|exists:application_types,id',
            'custom_fields' => 'nullable|array',
            'form_data' => 'nullable|array',
            'client_notes' => 'nullable|string|max:5000',
            'is_draft' => 'boolean',
        ];
    }

    /**
     * Get custom error messages for validation rules.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'application_type_id.required' => 'Please select an application type.',
            'client_id.required' => 'Please select a client.',
            'client_id.exists' => 'The selected client is invalid.',
            'application_type_id.exists' => 'The selected application type is invalid.',
            'custom_fields.array' => 'The custom fields must be a valid array.',
            'form_data.array' => 'The form data must be a valid array.',
            'client_notes.max' => 'Client notes cannot exceed 5000 characters.',
            'is_draft.boolean' => 'The draft flag must be true or false.',
        ];
    }
}
