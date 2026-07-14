<?php

namespace App\Http\Requests\Promotion;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SavePromotionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('promotions.manage') === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'store_id' => ['required', 'integer', 'exists:store_locations,id'],
            'name' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:2000'],
            'storefront_visible' => ['required', 'boolean'],
            'storefront_title' => ['nullable', 'string', 'max:255'],
            'storefront_summary' => ['nullable', 'string', 'max:500'],
            'storefront_badge' => ['nullable', 'string', 'max:50'],
            'storefront_image' => ['nullable', 'image', 'max:5120'],
            'type' => ['required', Rule::in(['discount_item', 'discount_category', 'voucher', 'bundling', 'bxgy', 'cashback', 'loyalty_point'])],
            'status' => ['required', Rule::in(['draft', 'active', 'paused', 'archived'])],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'channel' => ['required', Rule::in(['pos', 'online', 'both'])],
            'customer_group_id' => ['nullable', 'integer', 'exists:customer_groups,id'],
            'is_stackable' => ['required', 'boolean'],
            'exclusive_group' => ['nullable', 'string', 'max:50'],
            'priority' => ['required', 'integer', 'min:0', 'max:999'],
            'usage_limit_total' => ['nullable', 'integer', 'min:1'],
            'usage_limit_per_customer' => ['nullable', 'integer', 'min:1'],
            'min_purchase_amount' => ['nullable', 'numeric', 'min:0'],
            'max_discount_amount' => ['nullable', 'numeric', 'min:0'],
            'applicable_scope' => ['required', Rule::in(['all', 'category', 'product', 'brand'])],
            'conditions' => ['array'],
            'conditions.*.conditionable_type' => ['required', Rule::in(['product', 'category', 'brand'])],
            'conditions.*.conditionable_id' => ['required', 'integer'],
            'conditions.*.min_qty' => ['nullable', 'numeric', 'min:0.001'],
            'rewards' => ['required', 'array', 'min:1'],
            'rewards.*.reward_type' => ['required', Rule::in(['percent_discount', 'fixed_discount', 'free_product', 'cashback', 'point_multiplier'])],
            'rewards.*.value' => ['required', 'numeric', 'min:0'],
            'rewards.*.free_product_id' => ['nullable', 'integer', 'exists:products,id'],
            'rewards.*.free_product_qty' => ['nullable', 'numeric', 'min:0.001'],
            'vouchers' => ['array'],
            'vouchers.*.code' => ['required', 'string', 'max:50'],
            'vouchers.*.max_uses' => ['nullable', 'integer', 'min:1'],
            'vouchers.*.expires_at' => ['nullable', 'date'],
            'voucher_quantity' => ['nullable', 'integer', 'min:1', 'max:1000'],
            'voucher_prefix' => ['nullable', 'string', 'max:20', 'alpha_num:ascii'],
        ];
    }
}
