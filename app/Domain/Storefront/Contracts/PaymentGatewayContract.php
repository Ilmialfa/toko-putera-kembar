<?php

namespace App\Domain\Storefront\Contracts;

use App\Models\Order;

interface PaymentGatewayContract
{
    /** @return array<string, mixed> */
    public function createPayment(Order $order): array;

    /** @param array<string, mixed> $payload */
    public function verifyWebhook(array $payload, ?string $signature): bool;
}
