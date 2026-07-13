<?php

namespace App\Domain\Promotion\Controllers;

use App\Http\Controllers\Controller;
use App\Http\Requests\Promotion\SavePromotionRequest;
use App\Models\Brand;
use App\Models\Category;
use App\Models\CustomerGroup;
use App\Models\Product;
use App\Models\Promotion;
use App\Models\StoreLocation;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class PromotionController extends Controller
{
    public function index(Request $request): Response
    {
        $promotions = Promotion::query()
            ->with(['conditions', 'rewards', 'vouchers'])
            ->withCount('usages')
            ->withSum('usages', 'discount_amount_applied')
            ->when($request->string('status')->toString(), fn ($query, string $status) => $query->where('status', $status))
            ->when($request->string('search')->toString(), fn ($query, string $search) => $query->where('name', 'like', "%{$search}%"))
            ->latest()
            ->paginate(12)
            ->withQueryString();

        return Inertia::render('promotions/Index', [
            'promotions' => $promotions,
            'filters' => $request->only(['search', 'status']),
            'summary' => [
                'active' => Promotion::query()->where('status', 'active')->where('start_date', '<=', now())->where('end_date', '>=', now())->count(),
                'scheduled' => Promotion::query()->where('status', 'active')->where('start_date', '>', now())->count(),
                'discount' => (float) DB::table('promotion_usages')->sum('discount_amount_applied'),
            ],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('promotions/Form', $this->formProps());
    }

    public function store(SavePromotionRequest $request): RedirectResponse
    {
        $this->persist(new Promotion, $request->validated(), $request);

        return redirect()->route('admin.promotions.index')->with('success', 'Promosi berhasil dibuat.');
    }

    public function edit(Promotion $promotion): Response
    {
        $promotion->load(['conditions', 'rewards', 'vouchers']);

        return Inertia::render('promotions/Form', [
            ...$this->formProps(),
            'promotion' => $promotion,
        ]);
    }

    public function update(SavePromotionRequest $request, Promotion $promotion): RedirectResponse
    {
        $this->persist($promotion, $request->validated(), $request);

        return redirect()->route('admin.promotions.index')->with('success', 'Promosi berhasil diperbarui.');
    }

    public function toggle(Promotion $promotion): RedirectResponse
    {
        $promotion->update([
            'status' => $promotion->status === 'active' ? 'paused' : 'active',
            'is_active' => $promotion->status !== 'active',
        ]);

        return back()->with('success', 'Status promosi berhasil diubah.');
    }

    public function duplicate(Promotion $promotion, Request $request): RedirectResponse
    {
        $request->user()->can('promotions.manage') || abort(403);

        DB::transaction(function () use ($promotion, $request): void {
            $promotion->load(['conditions', 'rewards']);
            $copy = $promotion->replicate();
            $copy->name = $promotion->name.' (Salinan)';
            $copy->status = 'draft';
            $copy->is_active = false;
            $copy->created_by = $request->user()->id;
            $copy->save();
            foreach ($promotion->conditions as $condition) {
                $copy->conditions()->create($condition->only(['conditionable_type', 'conditionable_id', 'min_qty']));
            }
            foreach ($promotion->rewards as $reward) {
                $copy->rewards()->create($reward->only(['reward_type', 'value', 'free_product_id', 'free_product_qty']));
            }
        });

        return back()->with('success', 'Promosi disalin sebagai draft tanpa kode voucher.');
    }

    public function destroy(Promotion $promotion): RedirectResponse
    {
        if ($promotion->usages()->exists()) {
            $promotion->update(['status' => 'archived', 'is_active' => false]);

            return back()->with('success', 'Promosi yang pernah dipakai diarsipkan.');
        }

        $promotion->delete();

        return back()->with('success', 'Promosi berhasil dihapus.');
    }

    /** @return array<string, mixed> */
    private function formProps(): array
    {
        return [
            'store' => StoreLocation::query()->where('is_main', true)->firstOrFail(['id', 'name']),
            'products' => Product::query()->where('is_active', true)->orderBy('name')->get(['id', 'name', 'sku']),
            'categories' => Category::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'brands' => Brand::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
            'customerGroups' => CustomerGroup::query()->where('is_active', true)->orderBy('name')->get(['id', 'name']),
        ];
    }

    /** @param array<string, mixed> $data */
    private function persist(Promotion $promotion, array $data, Request $request): void
    {
        DB::transaction(function () use ($promotion, $data, $request): void {
            $attributes = collect($data)->except(['conditions', 'rewards', 'vouchers', 'voucher_quantity', 'voucher_prefix'])->all();
            $attributes['is_active'] = $data['status'] === 'active';
            $attributes['created_by'] = $promotion->exists ? $promotion->created_by : $request->user()->id;
            $promotion->fill($attributes)->save();

            $promotion->conditions()->delete();
            foreach ($data['conditions'] as $condition) {
                $promotion->conditions()->create($condition);
            }

            $promotion->rewards()->delete();
            foreach ($data['rewards'] as $reward) {
                $promotion->rewards()->create($reward);
            }

            foreach ($data['vouchers'] as $voucher) {
                $existing = DB::table('vouchers')->where('code', Str::upper($voucher['code']))->where('promotion_id', '!=', $promotion->id)->exists();
                if ($existing) {
                    throw ValidationException::withMessages(['vouchers' => "Kode {$voucher['code']} sudah digunakan."]);
                }

                $promotion->vouchers()->updateOrCreate(
                    ['code' => Str::upper($voucher['code'])],
                    [...$voucher, 'code' => Str::upper($voucher['code']), 'is_active' => true],
                );
            }

            $quantity = (int) ($data['voucher_quantity'] ?? 0);
            $prefix = Str::upper((string) ($data['voucher_prefix'] ?? 'PK'));
            for ($index = 0; $index < $quantity; $index++) {
                do {
                    $code = $prefix.Str::upper(Str::random(8));
                } while (DB::table('vouchers')->where('code', $code)->exists());

                $promotion->vouchers()->create(['code' => $code, 'is_active' => true]);
            }
        });
    }
}
