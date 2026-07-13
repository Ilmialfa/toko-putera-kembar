<?php

namespace App\Domain\Sales\Controllers;

use App\Domain\Sales\Actions\CloseCashierShiftAction;
use App\Domain\Sales\Actions\OpenShiftAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\CloseCashierShiftRequest;
use App\Http\Requests\Sales\OpenCashierShiftRequest;
use App\Models\CashierShift;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class CashierShiftController extends Controller
{
    public function current(Request $request): JsonResponse
    {
        $shift = CashierShift::where('user_id', $request->user()->id)
            ->where('store_id', $request->user()->store_id)
            ->where('status', 'open')
            ->first();

        return response()->json(['shift' => $shift]);
    }

    public function open(OpenCashierShiftRequest $request, OpenShiftAction $action): RedirectResponse
    {
        $validated = $request->validated();

        $action->execute(
            $request->user()->id,
            $request->user()->store_id,
            (float) $validated['opening_balance'],
            $validated['notes'] ?? null,
        );

        return back()->with('success', 'Shift kasir berhasil dibuka.');
    }

    public function close(CloseCashierShiftRequest $request, CloseCashierShiftAction $action): RedirectResponse
    {
        $shift = CashierShift::where('user_id', $request->user()->id)
            ->where('store_id', $request->user()->store_id)
            ->where('status', 'open')
            ->firstOrFail();

        $validated = $request->validated();

        $action->execute($shift, (float) $validated['closing_balance_actual'], $validated['notes'] ?? null);

        return redirect()->route('admin.pos.index')->with('success', 'Shift kasir berhasil ditutup.');
    }
}
