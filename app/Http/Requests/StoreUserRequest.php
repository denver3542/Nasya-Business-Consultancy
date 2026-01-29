<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class StoreUserRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->can('create', \App\Models\User::class);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users')],
            'password' => ['required', 'string', Password::defaults(), 'confirmed'],
            'phone' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
            'role' => ['required', 'string', Rule::in(['admin', 'staff', 'client', 'partner'])],
            'profile_photo' => ['nullable', 'image', 'max:2048'],

            // Profile fields
            'profile.date_of_birth' => ['nullable', 'date', 'before:today'],
            'profile.gender' => ['nullable', 'string', Rule::in(['male', 'female', 'other', 'prefer_not_to_say'])],
            'profile.address' => ['nullable', 'string'],
            'profile.city' => ['nullable', 'string', 'max:100'],
            'profile.state' => ['nullable', 'string', 'max:100'],
            'profile.country' => ['nullable', 'string', 'max:100'],
            'profile.postal_code' => ['nullable', 'string', 'max:20'],
            'profile.emergency_contact_name' => ['nullable', 'string', 'max:255'],
            'profile.emergency_contact_phone' => ['nullable', 'string', 'max:20'],
            'profile.emergency_contact_relationship' => ['nullable', 'string', 'max:100'],
            'profile.id_type' => ['nullable', 'string', 'max:50'],
            'profile.id_number' => ['nullable', 'string', 'max:100'],
            'profile.id_expiry_date' => ['nullable', 'date', 'after:today'],

            // Partner fields (only if role is partner)
            'partner.company_name' => $this->input('role') === 'partner'
                ? ['required', 'string', 'max:255']
                : ['nullable', 'string', 'max:255'],
            'partner.company_type' => ['nullable', 'string', Rule::in(['sole_proprietorship', 'partnership', 'llc', 'corporation', 'other', ''])],
            'partner.license_number' => ['nullable', 'string', 'max:255'],
            'partner.commission_rate' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'partner.is_verified' => ['nullable', 'boolean'],
            'partner.notes' => ['nullable', 'string'],
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
            'name.required' => 'The name field is required.',
            'email.required' => 'The email field is required.',
            'email.unique' => 'This email address is already registered.',
            'password.required' => 'The password field is required.',
            'password.confirmed' => 'The password confirmation does not match.',
            'role.required' => 'Please select a role for the user.',
            'role.in' => 'The selected role is invalid.',
            'partner.company_name.required' => 'Company name is required for partner accounts.',
            'profile.date_of_birth.before' => 'Date of birth must be in the past.',
            'profile.id_expiry_date.after' => 'ID expiry date must be in the future.',
        ];
    }
}
