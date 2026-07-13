<?php

namespace App\Domain\Sales\Controllers;

use App\Domain\Sales\Actions\CloseCashierShiftAction;
use App\Domain\Sales\Actions\OpenShiftAction;
use App\Http\Controllers\Controller;
use App\Models\CashierShift;
use Illuminate\Http\Request;

class CashierShiftController extends Controller
{
    public function current(Request $request)
    {
        $shift = CashierShift::where('user_id', $request->user()->id)
            ->where('store_id', $request->user()->store_id)
            ->where('status', 'open')
            ->first();

        return response()->json(['shift' => $shift]);
    }

    public function open(Request $request, OpenShiftAction $action)
    {
        $validated = $request->validate([
            'opening_balance' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $action->execute(
            $request->user()->id,
            $request->user()->store_id,
            $validated['opening_balance'],
            $validated['notes']
        );

        return redirect()->back()->with('success', 'Shift opened successfully.');
    }

    public function close(Request $request, CloseCashierShiftAction $action)
    {
        $shift = CashierShift::where('user_id', $request->user()->id)
            ->where('store_id', $request->user()->store_id)
            ->where('status', 'open')
            ->firstOrFail();

        $validated = $request->validate([
            'closing_balance_actual' => 'required|numeric|min:0',
            'notes' => 'nullable|string',
        ]);

        $action->execute($shift, $validated['closing_balance_actual'], $validated['notes']);

        return redirect()->route('pos.index')->with('success', 'Shift closed successfully.');
    }
}
