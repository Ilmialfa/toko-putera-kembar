<?php

namespace App\Domain\Storefront\Controllers;

use App\Domain\Storefront\Actions\ConfirmOnlineOrderAction;
use App\Enums\OrderStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Storefront\UpdateOrderStatusRequest;
use App\Models\Order;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminOrderController extends Controller
{
    public function index(Request $request): Response
    {
        $orders = Order::query()
            ->with('customer:id,name,phone')
            ->withCount('items')
            ->when($request->string('status')->isNotEmpty(), fn ($query) => $query->where('status', $request->string('status')->toString()))
            ->when($request->string('search')->isNotEmpty(), function ($query) use ($request): void {
                $search = '%'.$request->string('search')->toString().'%';
                $query->where(fn ($nested) => $nested
                    ->where('order_number', 'like', $search)
                    ->orWhere('recipient_name', 'like', $search)
                    ->orWhere('recipient_phone', 'like', $search));
            })
            ->latest()
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('admin/orders/Index', [
            'orders' => $orders,
            'filters' => $request->only(['status', 'search']),
            'statuses' => collect(OrderStatus::cases())->map(fn (OrderStatus $status): array => [
                'value' => $status->value,
                'label' => str($status->value)->replace('_', ' ')->title()->toString(),
            ]),
        ]);
    }

    public function show(Order $order): Response
    {
        return Inertia::render('admin/orders/Show', [
            'order' => $order->load(['customer', 'items.product', 'items.unit', 'statusHistories.changedBy']),
        ]);
    }

    public function confirm(Request $request, Order $order, ConfirmOnlineOrderAction $action): RedirectResponse
    {
        $action->execute($order, (int) $request->user()->id);

        return back()->with('success', 'Pembayaran telah diverifikasi dan pesanan dikonfirmasi.');
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): RedirectResponse
    {
        $nextStatus = OrderStatus::from($request->string('status')->toString());
        $currentStatus = OrderStatus::from((string) $order->getRawOriginal('status'));
        $allowedTransitions = [
            OrderStatus::CONFIRMED->value => [OrderStatus::PREPARING],
            OrderStatus::PREPARING->value => [OrderStatus::READY_FOR_PICKUP],
            OrderStatus::READY_FOR_PICKUP->value => [OrderStatus::OUT_FOR_DELIVERY, OrderStatus::COMPLETED],
            OrderStatus::OUT_FOR_DELIVERY->value => [OrderStatus::COMPLETED],
            OrderStatus::PENDING_PAYMENT->value => [OrderStatus::CANCELLED],
            OrderStatus::PAYMENT_VERIFICATION->value => [OrderStatus::CANCELLED],
        ];

        if (! in_array($nextStatus, $allowedTransitions[$currentStatus->value] ?? [], true)) {
            throw ValidationException::withMessages(['status' => 'Perubahan status pesanan tidak diizinkan.']);
        }

        $order->update(['status' => $nextStatus]);
        $order->statusHistories()->create([
            'status' => $nextStatus->value,
            'changed_by' => $request->user()->id,
            'notes' => $request->string('notes')->toString() ?: null,
        ]);

        if ($nextStatus === OrderStatus::CANCELLED) {
            $order->reservations()->where('status', 'active')->update(['status' => 'released']);
        }

        return back()->with('success', 'Status pesanan berhasil diperbarui.');
    }

    public function paymentProof(Order $order): StreamedResponse
    {
        abort_if($order->payment_proof_path === null, 404);

        return Storage::disk('local')->download($order->payment_proof_path, "bukti-{$order->order_number}.jpg");
    }
}
