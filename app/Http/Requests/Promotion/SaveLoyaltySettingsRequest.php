<?php

namespace App\Http\Requests\Promotion;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaveLoyaltySettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('promotions.manage') === true;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'enabled' => ['required', 'boolean'],
            'earn_spend_amount' => ['required', 'integer', 'min:1000', 'max:10000000'],
            'earn_points' => ['required', 'integer', 'min:1', 'max:10000'],
            'redeem_value' => ['required', 'integer', 'min:1', 'max:100000'],
            'redeem_min_points' => ['required', 'integer', 'min:1', 'max:1000000'],
            'redeem_max_points' => ['required', 'integer', 'gte:redeem_min_points', 'max:1000000'],
            'redeem_max_percentage' => ['required', 'integer', 'min:1', 'max:100'],
            'expiry_months' => ['required', 'integer', 'min:1', 'max:60'],
        ];
    }

    public function attributes(): array
    {
        return [
            'earn_spend_amount' => 'nilai belanja untuk mendapatkan poin',
            'earn_points' => 'poin yang diperoleh',
            'redeem_value' => 'nilai tukar per poin',
            'redeem_min_points' => 'minimal penukaran poin',
            'redeem_max_points' => 'maksimal poin per transaksi',
            'redeem_max_percentage' => 'batas nilai pembayaran dengan poin',
            'expiry_months' => 'masa berlaku poin',
        ];
    }
}
