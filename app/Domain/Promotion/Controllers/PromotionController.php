<?php

namespace App\Domain\Promotion\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PromotionController extends Controller
{
    public function index(): Response
    {
        $promotions = Promotion::with(['conditions', 'rewards', 'vouchers'])
            ->orderBy('id', 'desc')
            ->paginate(10);

        return Inertia::render('promotions/Index', [
            'promotions' => $promotions,
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('promotions/Form');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'store_id' => 'required|exists:store_locations,id',
            'name' => 'required|string|max:255',
            'type' => 'required|in:discount_item,discount_category,voucher,bundling,bxgy,cashback,loyalty_point',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'channel' => 'required|in:pos,online,both',
            'is_active' => 'boolean',
            'is_stackable' => 'boolean',
            'priority' => 'integer',
            'usage_limit_total' => 'nullable|integer',
            'usage_limit_per_customer' => 'nullable|integer',
            'min_purchase_amount' => 'nullable|numeric',
            'applicable_scope' => 'required|in:all,category,product,brand',

            // Related conditions
            'conditions' => 'nullable|array',
            'conditions.*.conditionable_type' => 'required_with:conditions|string',
            'conditions.*.conditionable_id' => 'required_with:conditions|integer',
            'conditions.*.min_qty' => 'nullable|numeric',

            // Related rewards
            'rewards' => 'required|array|min:1',
            'rewards.*.reward_type' => 'required|in:percent_discount,fixed_discount,free_product,cashback,point_multiplier',
            'rewards.*.value' => 'required|numeric',
            'rewards.*.free_product_id' => 'nullable|exists:products,id',
            'rewards.*.free_product_qty' => 'nullable|numeric',

            // Vouchers
            'vouchers' => 'nullable|array',
            'vouchers.*.code' => 'required_with:vouchers|string|unique:vouchers,code',
        ]);

        DB::transaction(function () use ($validated) {
            $promotion = Promotion::create(collect($validated)->except(['conditions', 'rewards', 'vouchers'])->toArray());

            if (! empty($validated['conditions'])) {
                foreach ($validated['conditions'] as $condition) {
                    $promotion->conditions()->create($condition);
                }
            }

            foreach ($validated['rewards'] as $reward) {
                $promotion->rewards()->create($reward);
            }

            if ($validated['type'] === 'voucher' && ! empty($validated['vouchers'])) {
                foreach ($validated['vouchers'] as $voucher) {
                    $promotion->vouchers()->create($voucher);
                }
            }
        });

        return redirect()->route('promotions.index')->with('success', 'Promotion created successfully.');
    }
}
