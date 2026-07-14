<?php

namespace App\Http\Requests\Storefront;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreCheckoutRequest extends FormRequest
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
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'delivery_method' => ['required', Rule::in(['delivery', 'pickup'])],
            'address_id' => ['nullable', 'integer', 'exists:customer_addresses,id'],
            'recipient_name' => ['required', 'string', 'max:150'],
            'phone' => ['required', 'string', 'max:30'],
            'full_address' => ['required_if:delivery_method,delivery', 'nullable', 'string', 'max:1000'],
            'latitude' => [
                'nullable',
                Rule::requiredIf(fn (): bool => $this->input('delivery_method') === 'delivery' && ! $this->filled('address_id')),
                'numeric',
                'between:-90,90',
            ],
            'longitude' => [
                'nullable',
                Rule::requiredIf(fn (): bool => $this->input('delivery_method') === 'delivery' && ! $this->filled('address_id')),
                'numeric',
                'between:-180,180',
            ],
            'payment_method' => ['required', Rule::in(['bank_transfer', 'e_wallet', 'qris', 'cash'])],
            'voucher_code' => ['nullable', 'string', 'max:50'],
            'payment_proof' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
        ];
    }
}
