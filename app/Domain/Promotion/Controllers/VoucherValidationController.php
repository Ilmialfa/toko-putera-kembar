<?php

namespace App\Domain\Promotion\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Voucher;
use Illuminate\Http\Request;

class VoucherValidationController extends Controller
{
    public function validateVoucher(Request $request)
    {
        $validated = $request->validate([
            'code' => 'required|string',
            'store_id' => 'required|exists:store_locations,id',
        ]);

        $voucher = Voucher::where('code', $validated['code'])
            ->where('is_active', true)
            ->whereHas('promotion', function ($query) use ($validated) {
                $query->where('store_id', $validated['store_id'])
                    ->where('is_active', true)
                    ->where('start_date', '<=', now())
                    ->where('end_date', '>=', now());
            })
            ->with('promotion.rewards')
            ->first();

        if (! $voucher) {
            return response()->json(['valid' => false, 'message' => 'Invalid or expired voucher code.'], 404);
        }

        return response()->json([
            'valid' => true,
            'voucher' => $voucher,
            'promotion' => $voucher->promotion,
        ]);
    }
}
