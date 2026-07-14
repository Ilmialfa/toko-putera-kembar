<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class SaveProductRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $permission = $this->route('product') ? 'products.edit' : 'products.create';

        return $this->user()?->can($permission) === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'sku' => ['nullable', 'string', 'max:100', Rule::unique('products', 'sku')->ignore($this->route('product'))],
            'category_id' => ['required', 'integer', 'exists:categories,id'],
            'brand_id' => ['nullable', 'integer', 'exists:brands,id'],
            'default_warehouse_id' => ['required', 'integer', 'exists:warehouses,id'],
            'primary_supplier_id' => ['nullable', 'integer', 'exists:suppliers,id'],
            'base_unit_id' => ['required', 'integer', 'exists:units,id'],
            'online_display_unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'display_price_prefix' => ['required', Rule::in(['exact', 'from'])],
            'is_active' => ['required', 'boolean'],
            'is_sellable' => ['required', 'boolean'],
            'sellable_pos' => ['required', 'boolean'],
            'sellable_online' => ['required', 'boolean'],
            'hpp_current' => ['required', 'numeric', 'min:0'],
            'is_preorder' => ['required', 'boolean'],
            'preorder_eta_days' => ['nullable', 'integer', 'min:1', 'max:365'],
            'weight_grams' => ['nullable', 'numeric', 'min:0'],
            'description_short' => ['nullable', 'string', 'max:1000'],
            'description_long' => ['nullable', 'string'],
            'barcodes' => ['array'],
            'barcodes.*.barcode' => ['required', 'string', 'max:100'],
            'barcodes.*.unit_id' => ['nullable', 'integer', 'exists:units,id'],
            'barcodes.*.is_primary' => ['required', 'boolean'],
            'units' => ['array'],
            'units.*.unit_id' => ['required', 'integer', 'distinct', 'exists:units,id'],
            'units.*.conversion_qty' => ['required', 'numeric', 'gt:0'],
            'units.*.is_purchase_unit' => ['required', 'boolean'],
            'units.*.is_sales_unit' => ['required', 'boolean'],
            'prices' => ['required', 'array', 'min:1'],
            'prices.*.unit_id' => ['required', 'integer', 'exists:units,id'],
            'prices.*.price_type' => ['required', Rule::in(['retail', 'wholesale_tier', 'member', 'reseller', 'promo'])],
            'prices.*.customer_group_id' => ['nullable', 'integer', 'exists:customer_groups,id'],
            'prices.*.min_qty' => ['required', 'numeric', 'gt:0'],
            'prices.*.max_qty' => ['nullable', 'numeric'],
            'prices.*.price' => ['required', 'numeric', 'min:0'],
            'prices.*.channel' => ['required', Rule::in(['pos', 'online', 'both'])],
            'prices.*.active_from' => ['nullable', 'date'],
            'prices.*.active_until' => ['nullable', 'date'],
            'prices.*.is_active' => ['required', 'boolean'],
            'images' => ['array', 'max:8'],
            'images.*' => ['image', 'mimes:jpeg,png,webp', 'max:4096'],
            'remove_image_ids' => ['array'],
            'remove_image_ids.*' => ['integer', 'exists:product_images,id'],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $validUnitIds = collect($this->input('units', []))->pluck('unit_id')
                ->push($this->integer('base_unit_id'))
                ->map(fn (mixed $id): int => (int) $id);
            $displayUnitId = $this->integer('online_display_unit_id');

            if ($displayUnitId > 0 && ! $validUnitIds->contains($displayUnitId)) {
                $validator->errors()->add('online_display_unit_id', 'Satuan display harus merupakan satuan dasar atau satuan produk.');
            }

            foreach ($this->input('prices', []) as $index => $price) {
                if (! $validUnitIds->contains((int) ($price['unit_id'] ?? 0))) {
                    $validator->errors()->add("prices.{$index}.unit_id", 'Satuan harga belum terdaftar pada produk.');
                }

                if (isset($price['max_qty']) && (float) $price['max_qty'] < (float) ($price['min_qty'] ?? 0)) {
                    $validator->errors()->add("prices.{$index}.max_qty", 'Qty maksimum tidak boleh lebih kecil dari qty minimum.');
                }

                if (isset($price['active_from'], $price['active_until']) && $price['active_until'] <= $price['active_from']) {
                    $validator->errors()->add("prices.{$index}.active_until", 'Tanggal selesai harus setelah tanggal mulai.');
                }
            }
        }];
    }
}
