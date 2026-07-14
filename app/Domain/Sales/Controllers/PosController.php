<?php

namespace App\Domain\Sales\Controllers;

use App\Domain\Promotion\Services\LoyaltySettingsService;
use App\Http\Controllers\Controller;
use App\Models\CashierShift;
use App\Models\Category;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PosController extends Controller
{
    public function index(Request $request, LoyaltySettingsService $loyaltySettings): Response
    {
        $storeId = (int) $request->user()->store_id;

        $shift = CashierShift::query()
            ->where('user_id', $request->user()->id)
            ->where('store_id', $storeId)
            ->where('status', 'open')
            ->first();

        return Inertia::render('pos/Index', [
            'currentShift' => $shift,
            'categories' => Category::query()
                ->where('is_active', true)
                ->orderBy('display_order')
                ->orderBy('name')
                ->get(['id', 'name']),
            'customers' => Customer::query()
                ->orderBy('name')
                ->limit(100)
                ->get(['id', 'name', 'phone', 'loyalty_point_balance']),
            'cashier' => [
                'id' => (int) $request->user()->id,
                'name' => $request->user()->name,
            ],
            'loyaltySettings' => $loyaltySettings->forStore(
                $request->user()->store,
            ),
        ]);
    }
}
