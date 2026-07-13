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
            'address_id' => ['nullable', 'integer', 'exists:customer_addresses,id'],
            'recipient_name' => ['required_without:address_id', 'string', 'max:150'],
            'phone' => ['required_without:address_id', 'string', 'max:30'],
            'full_address' => ['required_without:address_id', 'string', 'max:1000'],
            'latitude' => ['required_without:address_id', 'numeric', 'between:-90,90'],
            'longitude' => ['required_without:address_id', 'numeric', 'between:-180,180'],
            'payment_method' => ['required', Rule::in(['bank_transfer', 'e_wallet'])],
            'voucher_code' => ['nullable', 'string', 'max:50'],
            'payment_proof' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'mimetypes:image/jpeg,image/png,application/pdf', 'max:5120'],
        ];
    }
}
