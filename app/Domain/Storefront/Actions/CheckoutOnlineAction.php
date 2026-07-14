<?php

namespace App\Domain\Storefront\Actions;

use App\Domain\Catalog\Services\PriceResolutionService;
use App\Domain\Promotion\Services\PromotionEngine;
use App\Enums\OrderStatus;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\CustomerAddress;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\PromotionUsage;
use App\Models\StockReservation;
use App\Models\StoreLocation;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;

class CheckoutOnlineAction
{
    public function __construct(
        private PriceResolutionService $priceResolutionService,
        private PromotionEngine $promotionEngine,
    ) {}

    /**
     * @param  array<string, mixed>  $data
     */
    public function execute(Cart $cart, StoreLocation $store, array $data, ?int $customerId, string $sessionId, ?UploadedFile $paymentProof = null): Order
    {
        return DB::transaction(function () use ($cart, $store, $data, $customerId, $sessionId, $paymentProof): Order {
            $cartItems = CartItem::query()
                ->with(['product', 'unit'])
                ->where('cart_id', $cart->id)
                ->get();

            if ($cartItems->isEmpty()) {
                throw new RuntimeException('Keranjang belanja kosong.');
            }

            $deliveryMethod = $data['delivery_method'] ?? 'delivery';
            $isPickup = $deliveryMethod === 'pickup';

            $address = $isPickup ? null : $this->resolveAddress($data, $customerId);

            if ($isPickup) {
                $latitude = (float) $store->latitude;
                $longitude = (float) $store->longitude;
                $distance = 0.0;
            } else {
                $latitude = (float) ($address === null ? $data['latitude'] : $address->latitude);
                $longitude = (float) ($address === null ? $data['longitude'] : $address->longitude);
                $distance = $this->distanceInKilometres((float) $store->latitude, (float) $store->longitude, $latitude, $longitude);
            }

            $settingsAttribute = $store->getAttribute('settings');
            $storeSettings = is_array($settingsAttribute) ? $settingsAttribute : [];
            $maximumRadius = (float) ($storeSettings['max_delivery_radius_km'] ?? $store->delivery_radius_km ?? 3);

            if (! $isPickup && $distance > $maximumRadius) {
                throw new RuntimeException("Alamat berada di luar jangkauan pengiriman {$maximumRadius} km. Silakan pilih ambil di toko.");
            }

            $paymentProofPath = $paymentProof?->store('payment-proofs', 'local');
            $order = Order::create([
                'store_id' => $store->id,
                'order_number' => 'ORD-'.now()->format('Ym').'-'.Str::upper(Str::random(8)),
                'customer_id' => $customerId,
                'guest_token' => $customerId === null ? Str::random(64) : null,
                'customer_address_id' => $address?->id,
                'recipient_name' => $isPickup ? $data['recipient_name'] : ($address === null ? $data['recipient_name'] : $address->recipient_name),
                'recipient_phone' => $isPickup ? $data['phone'] : ($address === null ? $data['phone'] : $address->phone),
                'delivery_address' => $isPickup ? 'Ambil di Toko' : ($address === null ? $data['full_address'] : $address->full_address),
                'delivery_method' => $deliveryMethod,
                'delivery_latitude' => $latitude,
                'delivery_longitude' => $longitude,
                'distance_km' => $distance,
                'delivery_fee' => $this->deliveryFee($distance, $store, $isPickup),
                'subtotal' => 0,
                'discount_total' => 0,
                'total_amount' => 0,
                'payment_method' => $data['payment_method'],
                'payment_proof_path' => $paymentProofPath,
                'status' => $paymentProofPath === null ? OrderStatus::PENDING_PAYMENT : OrderStatus::PAYMENT_VERIFICATION,
                'qr_tracking_code' => (string) Str::ulid(),
            ]);

            $subtotal = 0.0;

            foreach ($cartItems as $cartItem) {
                $product = Product::query()->lockForUpdate()->findOrFail($cartItem->product_id);
                $conversionQuantity = $this->conversionQuantity($product, $cartItem->unit_id);
                $baseQuantity = round((float) $cartItem->qty * $conversionQuantity, 3);
                $reservedQuantity = (float) StockReservation::query()
                    ->where('product_id', $product->id)
                    ->where('status', 'active')
                    ->where('expires_at', '>', now())
                    ->sum('qty');

                if (! $product->is_preorder && (float) $product->stok_saat_ini - $reservedQuantity < $baseQuantity) {
                    throw new RuntimeException("Stok {$product->name} tidak mencukupi.");
                }

                $resolvedPrice = $this->priceResolutionService->resolve($product, $store->id, $cartItem->unit_id, (float) $cartItem->qty);

                if ($resolvedPrice === null) {
                    throw new RuntimeException("Harga {$product->name} belum dikonfigurasi.");
                }

                $price = (float) $resolvedPrice->price;

                if ((int) $resolvedPrice->unit_id !== (int) $cartItem->unit_id) {
                    $price *= $conversionQuantity;
                }

                $lineSubtotal = round($price * (float) $cartItem->qty, 2);
                $subtotal += $lineSubtotal;
                $order->items()->create([
                    'product_id' => $product->id,
                    'unit_id' => $cartItem->unit_id,
                    'qty' => $cartItem->qty,
                    'qty_base_unit' => $baseQuantity,
                    'price_per_unit' => $price,
                    'discount_amount' => 0,
                    'subtotal' => $lineSubtotal,
                ]);
                $order->reservations()->create([
                    'store_id' => $store->id,
                    'product_id' => $product->id,
                    'session_id' => $sessionId,
                    'qty' => $baseQuantity,
                    'status' => 'active',
                    'expires_at' => now()->addMinutes(15),
                ]);
            }

            if (! $isPickup && $subtotal < 150000) {
                throw new RuntimeException('Minimal belanja untuk pengiriman adalah Rp 150.000. Silakan pilih ambil di toko atau tambah pesanan.');
            }

            $order->load('items.product');
            $promotionResult = $this->promotionEngine->calculate(
                $store->id,
                'online',
                $order->items->map(fn ($item): array => [
                    'product_id' => $item->product_id,
                    'category_id' => $item->product->category_id,
                    'brand_id' => $item->product->brand_id,
                    'qty' => (float) $item->qty,
                    'price_per_unit' => (float) $item->price_per_unit,
                    'subtotal' => (float) $item->subtotal,
                ])->all(),
                $subtotal,
                $data['voucher_code'] ?? null,
                $customerId,
            );
            foreach ($order->items as $index => $orderItem) {
                $discount = (float) ($promotionResult['items'][$index]['discount_amount'] ?? 0);
                $orderItem->update([
                    'discount_amount' => $discount,
                    'subtotal' => round((float) $orderItem->subtotal - $discount, 2),
                ]);
            }
            foreach ($promotionResult['applied_promotions'] as $promotion) {
                PromotionUsage::query()->create([
                    'promotion_id' => $promotion['promotion_id'],
                    'voucher_id' => $promotion['voucher_id'] ?? null,
                    'usable_type' => Order::class,
                    'usable_id' => $order->id,
                    'customer_id' => $customerId,
                    'discount_amount_applied' => $promotion['amount'],
                    'used_at' => now(),
                ]);
            }

            $order->update([
                'subtotal' => round($subtotal, 2),
                'discount_total' => $promotionResult['discount_total'],
                'total_amount' => round($subtotal - $promotionResult['discount_total'] + (float) $order->delivery_fee, 2),
            ]);
            $order->statusHistories()->create(['status' => $order->getRawOriginal('status')]);
            CartItem::query()->where('cart_id', $cart->id)->delete();

            return $order->load(['items.product', 'statusHistories']);
        }, attempts: 3);
    }

    /** @param array<string, mixed> $data */
    private function resolveAddress(array $data, ?int $customerId): ?CustomerAddress
    {
        if (isset($data['address_id'])) {
            return CustomerAddress::query()->whereKey($data['address_id'])->where('customer_id', $customerId)->firstOrFail();
        }

        if ($customerId === null) {
            return null;
        }

        return CustomerAddress::create([
            'customer_id' => $customerId,
            'label' => 'Alamat checkout',
            'recipient_name' => $data['recipient_name'],
            'phone' => $data['phone'],
            'full_address' => $data['full_address'],
            'latitude' => $data['latitude'],
            'longitude' => $data['longitude'],
        ]);
    }

    private function conversionQuantity(Product $product, int $unitId): float
    {
        if ($unitId === (int) $product->base_unit_id) {
            return 1.0;
        }

        $conversion = ProductUnit::query()
            ->where('product_id', $product->id)
            ->where('unit_id', $unitId)
            ->where('is_sales_unit', true)
            ->value('conversion_qty');

        if ($conversion === null) {
            throw new RuntimeException("Satuan penjualan {$product->name} tidak valid.");
        }

        return (float) $conversion;
    }

    private function distanceInKilometres(float $latitudeA, float $longitudeA, float $latitudeB, float $longitudeB): float
    {
        $earthRadius = 6371;
        $latitudeDelta = deg2rad($latitudeB - $latitudeA);
        $longitudeDelta = deg2rad($longitudeB - $longitudeA);
        $value = sin($latitudeDelta / 2) ** 2 + cos(deg2rad($latitudeA)) * cos(deg2rad($latitudeB)) * sin($longitudeDelta / 2) ** 2;

        return round($earthRadius * 2 * atan2(sqrt($value), sqrt(1 - $value)), 2);
    }

    private function deliveryFee(float $distance, StoreLocation $store, bool $isPickup): float
    {
        // Gratis ongkir maksimal 3 km jika memenuhi syarat belanja.
        return 0.0;
    }
}
