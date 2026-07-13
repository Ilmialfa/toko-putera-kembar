<?php

namespace App\Domain\Promotion\Services;

use App\Models\Promotion;
use App\Models\PromotionUsage;
use App\Models\Voucher;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PromotionEngine
{
    /**
     * @param  array<int, array<string, mixed>>  $items
     * @return array{discount_total:float,cashback_total:float,point_multiplier:float,free_items:array<int,array<string,mixed>>,applied_promotions:array<int,array<string,mixed>>,items:array<int,array<string,mixed>>}
     */
    public function calculate(int $storeId, string $channel, array $items, float $subtotal, ?string $voucherCode = null, ?int $customerId = null): array
    {
        $promotions = Promotion::query()
            ->where('store_id', $storeId)
            ->where('is_active', true)
            ->where('status', 'active')
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->whereIn('channel', [$channel, 'both'])
            ->with(['conditions', 'rewards'])
            ->orderByDesc('priority')
            ->get()
            ->filter(fn (Promotion $promotion): bool => $promotion->type !== 'voucher' && $promotion->type !== 'loyalty_point');

        [$voucher, $voucherPromotion] = $this->resolveVoucher($voucherCode, $storeId, $channel);
        if ($voucherPromotion !== null) {
            $promotions->push($voucherPromotion);
        }

        $promotions = $this->eligiblePromotions($promotions, $subtotal, $customerId);
        $preparedItems = collect($items)->map(function (array $item): array {
            return [
                ...$item,
                'discount_amount' => 0.0,
                'net_subtotal' => round((float) $item['subtotal'], 2),
            ];
        })->values()->all();

        $applied = [];
        $appliedByPromotion = [];
        $nonStackableCandidates = [];
        $stackableCandidates = [];

        foreach ($promotions->whereIn('type', ['discount_item', 'discount_category']) as $promotion) {
            $reward = $promotion->rewards->first();
            if ($reward === null) {
                continue;
            }

            foreach ($preparedItems as $index => $item) {
                if (! $this->matches($promotion, $item)) {
                    continue;
                }

                $amount = $this->discountAmount((string) $reward->reward_type, (float) $reward->value, (float) $item['subtotal'], (float) $item['qty']);
                $amount = $this->cap($promotion, $amount);
                if ($amount <= 0) {
                    continue;
                }

                $candidate = ['promotion' => $promotion, 'item_index' => $index, 'amount' => $amount];
                if ($promotion->is_stackable) {
                    $stackableCandidates[] = $candidate;
                } else {
                    $nonStackableCandidates[$index][] = $candidate;
                }
            }
        }

        foreach ($nonStackableCandidates as $candidates) {
            usort($candidates, fn (array $left, array $right): int => [$right['amount'], $right['promotion']->priority] <=> [$left['amount'], $left['promotion']->priority]);
            $this->applyItemCandidate($preparedItems, $candidates[0], $appliedByPromotion);
        }
        foreach ($stackableCandidates as $candidate) {
            $this->applyItemCandidate($preparedItems, $candidate, $appliedByPromotion);
        }

        foreach ($appliedByPromotion as $promotionId => $detail) {
            $applied[] = [
                'promotion_id' => $promotionId,
                'name' => $detail['promotion']->name,
                'type' => $detail['promotion']->type,
                'amount' => round($detail['amount'], 2),
                'voucher_id' => null,
            ];
        }

        $discountTotal = round((float) collect($preparedItems)->sum('discount_amount'), 2);
        $cashbackTotal = 0.0;
        $pointMultiplier = 1.0;
        $freeItems = [];
        $hasExclusiveCartPromotion = false;

        foreach ($promotions->whereNotIn('type', ['discount_item', 'discount_category']) as $promotion) {
            if ($hasExclusiveCartPromotion && ! $promotion->is_stackable) {
                continue;
            }

            $reward = $promotion->rewards->first();
            if ($reward === null) {
                continue;
            }

            $amount = 0.0;
            $cashback = 0.0;
            $promoFreeItems = [];
            if ($promotion->type === 'voucher') {
                $netSubtotal = max(0, $subtotal - $discountTotal);
                $amount = $this->discountAmount((string) $reward->reward_type, (float) $reward->value, $netSubtotal, 1);
            } elseif ($promotion->type === 'bundling' && $this->bundleSatisfied($promotion, $preparedItems)) {
                $amount = $this->discountAmount((string) $reward->reward_type, (float) $reward->value, max(0, $subtotal - $discountTotal), 1);
            } elseif ($promotion->type === 'bxgy') {
                $promoFreeItems = $this->freeItems($promotion, $preparedItems);
            } elseif ($promotion->type === 'cashback') {
                $cashback = (string) $reward->reward_type === 'percent_discount'
                    ? max(0, $subtotal - $discountTotal) * ((float) $reward->value / 100)
                    : (float) $reward->value;
            }

            $amount = min(max(0, $subtotal - $discountTotal), $this->cap($promotion, $amount));
            $cashback = $this->cap($promotion, $cashback);
            if ($amount <= 0 && $cashback <= 0 && $promoFreeItems === []) {
                continue;
            }

            if ($amount > 0) {
                $this->distributeCartDiscount($preparedItems, $amount);
                $discountTotal = round($discountTotal + $amount, 2);
            }
            $cashbackTotal = round($cashbackTotal + $cashback, 2);
            $freeItems = [...$freeItems, ...$promoFreeItems];
            $applied[] = [
                'promotion_id' => $promotion->id,
                'name' => $promotion->name,
                'type' => $promotion->type,
                'amount' => round($amount, 2),
                'cashback' => round($cashback, 2),
                'voucher_id' => $promotion->type === 'voucher' ? $voucher?->id : null,
            ];
            $hasExclusiveCartPromotion = ! $promotion->is_stackable;
        }

        foreach ($promotions->where('type', 'loyalty_point') as $promotion) {
            $reward = $promotion->rewards->firstWhere('reward_type', 'point_multiplier');
            if ($reward !== null) {
                $pointMultiplier = max($pointMultiplier, (float) $reward->value);
                $applied[] = ['promotion_id' => $promotion->id, 'name' => $promotion->name, 'type' => $promotion->type, 'amount' => 0.0, 'voucher_id' => null];
            }
        }

        return [
            'discount_total' => round($discountTotal, 2),
            'cashback_total' => round($cashbackTotal, 2),
            'point_multiplier' => $pointMultiplier,
            'free_items' => $freeItems,
            'applied_promotions' => $applied,
            'items' => $preparedItems,
        ];
    }

    /** @return array{0:?Voucher,1:?Promotion} */
    private function resolveVoucher(?string $code, int $storeId, string $channel): array
    {
        if ($code === null || trim($code) === '') {
            return [null, null];
        }

        $voucher = Voucher::query()->where('code', mb_strtoupper(trim($code)))->where('is_active', true)->first();
        if ($voucher === null || ($voucher->expires_at !== null && $voucher->expires_at->isPast())) {
            throw ValidationException::withMessages(['voucher' => 'Kode voucher tidak valid atau sudah kedaluwarsa.']);
        }

        if ($voucher->max_uses !== null && PromotionUsage::query()->where('voucher_id', $voucher->id)->count() >= $voucher->max_uses) {
            throw ValidationException::withMessages(['voucher' => 'Kuota penggunaan voucher sudah habis.']);
        }

        $promotion = Promotion::query()
            ->whereKey($voucher->promotion_id)
            ->where('store_id', $storeId)
            ->where('status', 'active')
            ->where('is_active', true)
            ->whereIn('channel', [$channel, 'both'])
            ->where('start_date', '<=', now())
            ->where('end_date', '>=', now())
            ->with(['conditions', 'rewards'])
            ->first();

        if ($promotion === null) {
            throw ValidationException::withMessages(['voucher' => 'Promosi voucher sedang tidak aktif.']);
        }

        return [$voucher, $promotion];
    }

    /** @param Collection<int, Promotion> $promotions @return Collection<int, Promotion> */
    private function eligiblePromotions(Collection $promotions, float $subtotal, ?int $customerId): Collection
    {
        return $promotions->filter(function (Promotion $promotion) use ($subtotal, $customerId): bool {
            if ($promotion->usage_limit_total !== null && PromotionUsage::query()->where('promotion_id', $promotion->id)->count() >= $promotion->usage_limit_total) {
                return false;
            }
            if ($promotion->usage_limit_per_customer !== null && $customerId !== null
                && PromotionUsage::query()->where('promotion_id', $promotion->id)->where('customer_id', $customerId)->count() >= $promotion->usage_limit_per_customer) {
                return false;
            }
            if ($promotion->customer_group_id !== null && $customerId === null) {
                return false;
            }
            if ($promotion->customer_group_id !== null && ! DB::table('customers')->where('id', $customerId)->where('customer_group_id', $promotion->customer_group_id)->exists()) {
                return false;
            }

            return $promotion->min_purchase_amount === null || $subtotal >= (float) $promotion->min_purchase_amount;
        })->values();
    }

    /** @param array<string,mixed> $item */
    private function matches(Promotion $promotion, array $item): bool
    {
        if ($promotion->applicable_scope === 'all') {
            return true;
        }

        $field = match ($promotion->applicable_scope) {
            'product' => 'product_id',
            'category' => 'category_id',
            'brand' => 'brand_id',
            default => null,
        };

        return $field !== null && $promotion->conditions->contains(fn ($condition): bool => $condition->conditionable_type === $promotion->applicable_scope
            && (int) $condition->conditionable_id === (int) ($item[$field] ?? 0)
            && (float) $item['qty'] >= (float) ($condition->min_qty ?? 0));
    }

    private function discountAmount(string $type, float $value, float $subtotal, float $quantity): float
    {
        return match ($type) {
            'percent_discount' => round($subtotal * ($value / 100), 2),
            'fixed_discount' => min($subtotal, round($value * $quantity, 2)),
            default => 0.0,
        };
    }

    private function cap(Promotion $promotion, float $amount): float
    {
        return $promotion->max_discount_amount === null ? round($amount, 2) : round(min($amount, (float) $promotion->max_discount_amount), 2);
    }

    /** @param array<array<string,mixed>> $items @param array<string,mixed> $candidate @param array<int,array<string,mixed>> $applied */
    private function applyItemCandidate(array &$items, array $candidate, array &$applied): void
    {
        $index = $candidate['item_index'];
        $amount = min((float) $candidate['amount'], (float) $items[$index]['net_subtotal']);
        $items[$index]['discount_amount'] = round((float) $items[$index]['discount_amount'] + $amount, 2);
        $items[$index]['net_subtotal'] = round((float) $items[$index]['net_subtotal'] - $amount, 2);
        $promotion = $candidate['promotion'];
        $applied[$promotion->id] ??= ['promotion' => $promotion, 'amount' => 0.0];
        $applied[$promotion->id]['amount'] += $amount;
    }

    /** @param array<int,array<string,mixed>> $items */
    private function bundleSatisfied(Promotion $promotion, array $items): bool
    {
        return $promotion->conditions->every(function ($condition) use ($items): bool {
            return collect($items)->contains(fn (array $item): bool => $condition->conditionable_type === 'product'
                && (int) $item['product_id'] === (int) $condition->conditionable_id
                && (float) $item['qty'] >= (float) ($condition->min_qty ?? 1));
        });
    }

    /** @param array<int,array<string,mixed>> $items @return array<int,array<string,mixed>> */
    private function freeItems(Promotion $promotion, array $items): array
    {
        $reward = $promotion->rewards->firstWhere('reward_type', 'free_product');
        $buyCondition = $promotion->conditions->firstWhere('conditionable_type', 'product');
        if ($reward === null || $buyCondition === null || $reward->free_product_id === null) {
            return [];
        }

        $buyQuantity = (float) collect($items)->where('product_id', $buyCondition->conditionable_id)->sum('qty');
        $groups = (int) floor($buyQuantity / max(0.001, (float) ($buyCondition->min_qty ?? 1)));
        $freeQuantity = round($groups * (float) ($reward->free_product_qty ?? 1), 3);

        return $freeQuantity > 0 ? [['product_id' => (int) $reward->free_product_id, 'qty' => $freeQuantity]] : [];
    }

    /** @param array<array<string,mixed>> $items */
    private function distributeCartDiscount(array &$items, float $amount): void
    {
        $netTotal = (float) collect($items)->sum('net_subtotal');
        $remaining = round($amount, 2);
        $lastIndex = array_key_last($items);
        foreach ($items as $index => &$item) {
            $share = $index === $lastIndex ? $remaining : round($amount * ((float) $item['net_subtotal'] / max(0.01, $netTotal)), 2);
            $share = min($share, (float) $item['net_subtotal']);
            $item['discount_amount'] = round((float) $item['discount_amount'] + $share, 2);
            $item['net_subtotal'] = round((float) $item['net_subtotal'] - $share, 2);
            $remaining = round($remaining - $share, 2);
        }
        unset($item);
    }
}
