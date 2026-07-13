<?php

namespace App\Http\Requests\Sales;

use App\Models\CashierShift;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class CheckoutPosRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('manage pos') ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'cashier_shift_id' => ['required', 'integer', 'exists:cashier_shifts,id'],
            'customer_id' => ['nullable', 'integer', 'exists:customers,id'],
            'discount_total' => ['nullable', 'numeric', 'min:0'],
            'tax_total' => ['nullable', 'numeric', 'min:0'],
            'payment_status' => ['nullable', Rule::in(['paid', 'unpaid', 'partial'])],
            'warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.product_id' => ['required', 'integer', 'exists:products,id'],
            'items.*.unit_id' => ['required', 'integer', 'exists:units,id'],
            'items.*.qty' => ['required', 'numeric', 'min:0.001'],
            'items.*.discount_amount' => ['nullable', 'numeric', 'min:0'],
            'payments' => ['required', 'array', 'min:1'],
            'payments.*.method' => ['required', Rule::in(['cash', 'qris', 'bank_transfer', 'e_wallet', 'debit_card', 'credit_card', 'piutang', 'points'])],
            'payments.*.amount' => ['required', 'numeric', 'gt:0'],
            'payments.*.reference_number' => ['nullable', 'string', 'max:100'],
            'applied_promotions' => ['nullable', 'array'],
            'applied_promotions.*.promotion_id' => ['required', 'integer', 'exists:promotions,id'],
            'applied_promotions.*.voucher_id' => ['nullable', 'integer', 'exists:vouchers,id'],
            'applied_promotions.*.amount' => ['required', 'numeric', 'min:0'],
            'applied_promotions.*.type' => ['required', 'string', 'max:30'],
            'parked_sale_id' => ['nullable', 'integer', 'exists:sales,id'],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                $shift = CashierShift::query()->find($this->integer('cashier_shift_id'));

                if ($shift === null || $shift->status !== 'open' || $shift->user_id !== $this->user()?->id) {
                    $validator->errors()->add('cashier_shift_id', 'Shift kasir tidak aktif atau bukan milik Anda.');
                }
            },
        ];
    }
}
