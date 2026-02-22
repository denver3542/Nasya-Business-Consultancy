<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class UpdateClientRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['admin', 'staff']);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $clientId = $this->route('client')->id;

        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($clientId)->whereNull('deleted_at'),
            ],
            'password' => ['nullable', 'string', Password::defaults(), 'confirmed'],
            'phone' => ['nullable', 'string', 'max:20'],
            'is_active' => ['boolean'],
            'profile.address' => ['nullable', 'string', 'max:1000'],
            'profile.city' => ['nullable', 'string', 'max:100'],
            'profile.state' => ['nullable', 'string', 'max:100'],
            'profile.country' => ['nullable', 'string', 'max:100'],
            'profile.postal_code' => ['nullable', 'string', 'max:20'],
            'profile.date_of_birth' => ['nullable', 'date', 'before:today'],
        ];
    }
}
