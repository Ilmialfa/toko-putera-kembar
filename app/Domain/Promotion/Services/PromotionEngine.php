<?php

namespace App\Domain\Promotion\Services;

use App\Models\Promotion;
use App\Models\PromotionUsage;
use App\Models\Voucher;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class PromotionEngine
{
    /**
     * Calculate applicable promotions for a cart/checkout.
     *
     * @param  string  $channel  (pos, online)
     * @param  array  $items  Array of ['product_id' => x, 'qty' => y, 'price_per_unit' => z, 'subtotal' => w, 'category_id' => c, 'brand_id' => b]
     * @return array [
     *               'discount_total' => total_discount_amount,
     *               'applied_promotions' => list of promotion details,
     *               'items' => updated items with discount_amount populated
     *               ]
     */
    public function calculate(int $storeId, string $channel, array $items, float $subtotal, ?string $voucherCode = null, ?int $customerId = null): array
    {
        $now = Carbon::now();

        // 1. Fetch active promos (excluding voucher type unless code is provided)
        $query = Promotion::where('store_id', $storeId)
            ->where('is_active', true)
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->where(function ($q) use ($channel) {
                $q->where('channel', 'both')->orWhere('channel', $channel);
            })
            ->with(['conditions', 'rewards'])
            ->orderBy('priority', 'desc');

        $activePromos = $query->get()->filter(function ($promo) {
            return $promo->type !== 'voucher' && $promo->type !== 'loyalty_point';
        });

        $voucherPromo = null;
        $voucherModel = null;
        if ($voucherCode) {
            $voucherModel = Voucher::where('code', $voucherCode)->where('is_active', true)->first();
            if ($voucherModel) {
                $vPromo = Promotion::where('id', $voucherModel->promotion_id)
                    ->where('store_id', $storeId)
                    ->where('is_active', true)
                    ->where('start_date', '<=', $now)
                    ->where('end_date', '>=', $now)
                    ->with(['conditions', 'rewards'])
                    ->first();

                if ($vPromo) {
                    $voucherPromo = $vPromo;
                    $activePromos->push($vPromo);
                } else {
                    throw ValidationException::withMessages(['voucher' => 'Voucher expired or invalid.']);
                }
            } else {
                throw ValidationException::withMessages(['voucher' => 'Invalid voucher code.']);
            }
        }

        // 2. Validate Limits
        $validPromos = new Collection;
        foreach ($activePromos as $promo) {
            if ($promo->usage_limit_total) {
                $totalUsed = PromotionUsage::where('promotion_id', $promo->id)->count();
                if ($totalUsed >= $promo->usage_limit_total) {
                    continue;
                }
            }
            if ($promo->usage_limit_per_customer && $customerId) {
                $customerUsed = PromotionUsage::where('promotion_id', $promo->id)
                    ->where('customer_id', $customerId)
                    ->count();
                if ($customerUsed >= $promo->usage_limit_per_customer) {
                    continue;
                }
            }
            if ($promo->min_purchase_amount && $subtotal < $promo->min_purchase_amount) {
                continue; // Does not meet min amount
            }
            $validPromos->push($promo);
        }

        // 3. Apply Promos and handle stacking
        $totalDiscount = 0;
        $appliedPromos = [];
        $hasUnstackable = false;

        // Initialize item discounts
        foreach ($items as &$item) {
            $item['discount_amount'] = 0;
            $item['net_subtotal'] = $item['subtotal'];
        }
        unset($item);

        foreach ($validPromos as $promo) {
            if ($hasUnstackable) {
                break;
            } // If an unstackable promo was applied, stop.

            $appliedAmount = 0;
            $reward = $promo->rewards->first();
            if (! $reward) {
                continue;
            }

            if ($promo->type === 'discount_item' || $promo->type === 'discount_category') {
                $conditions = $promo->conditions;

                foreach ($items as &$item) {
                    // Check if item matches scope
                    $isMatch = false;
                    if ($promo->applicable_scope === 'all') {
                        $isMatch = true;
                    } elseif ($promo->applicable_scope === 'product') {
                        $isMatch = $conditions->contains(fn ($c) => $c->conditionable_type === 'product' && $c->conditionable_id == $item['product_id']);
                    } elseif ($promo->applicable_scope === 'category') {
                        $isMatch = $conditions->contains(fn ($c) => $c->conditionable_type === 'category' && $c->conditionable_id == $item['category_id']);
                    }

                    if ($isMatch) {
                        $discount = 0;
                        if ($reward->reward_type === 'percent_discount') {
                            $discount = $item['net_subtotal'] * ($reward->value / 100);
                        } elseif ($reward->reward_type === 'fixed_discount') {
                            // fixed per item qty or flat? Usually per unit.
                            $discount = $reward->value * $item['qty'];
                            if ($discount > $item['net_subtotal']) {
                                $discount = $item['net_subtotal'];
                            }
                        }

                        $item['discount_amount'] += $discount;
                        $item['net_subtotal'] -= $discount;
                        $appliedAmount += $discount;
                    }
                }
                unset($item);
            } elseif ($promo->type === 'voucher') {
                if ($reward->reward_type === 'percent_discount') {
                    $appliedAmount = $subtotal * ($reward->value / 100);
                } elseif ($reward->reward_type === 'fixed_discount') {
                    $appliedAmount = $reward->value;
                }
                // Distribute voucher discount proportionally to items
                if ($appliedAmount > 0) {
                    $currentSubtotal = array_sum(array_column($items, 'net_subtotal'));
                    if ($appliedAmount > $currentSubtotal) {
                        $appliedAmount = $currentSubtotal;
                    }

                    foreach ($items as &$item) {
                        if ($currentSubtotal > 0) {
                            $proportion = $item['net_subtotal'] / $currentSubtotal;
                            $itemDiscount = round($appliedAmount * $proportion, 2);
                            $item['discount_amount'] += $itemDiscount;
                            $item['net_subtotal'] -= $itemDiscount;
                        }
                    }
                    unset($item);
                }
            }

            if ($appliedAmount > 0) {
                $totalDiscount += $appliedAmount;
                $appliedPromos[] = [
                    'promotion_id' => $promo->id,
                    'name' => $promo->name,
                    'type' => $promo->type,
                    'amount' => $appliedAmount,
                    'voucher_id' => $promo->type === 'voucher' ? $voucherModel?->id : null,
                ];

                if (! $promo->is_stackable) {
                    $hasUnstackable = true;
                }
            }
        }

        return [
            'discount_total' => $totalDiscount,
            'applied_promotions' => $appliedPromos,
            'items' => $items,
        ];
    }
}
