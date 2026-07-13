<?php

namespace App\Domain\Sales\Controllers;

use App\Domain\Sales\Actions\CheckoutPosAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\Sales\CheckoutPosRequest;
use Illuminate\Http\JsonResponse;

class CheckoutController extends Controller
{
    public function store(CheckoutPosRequest $request, CheckoutPosAction $action): JsonResponse
    {
        $validated = $request->validated();

        $sale = $action->execute(
            $validated,
            $request->user()->id,
            $request->user()->store_id,
            $validated['warehouse_id']
        );

        return response()->json([
            'message' => 'Checkout berhasil diproses.',
            'sale' => $sale,
        ]);
    }
}
