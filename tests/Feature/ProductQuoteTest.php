<?php

use App\Models\Product;
use App\Models\ProductPrice;

it('menghasilkan quotation harga dari server', function () {
    $product = Product::factory()->create();
    ProductPrice::factory()->create([
        'product_id' => $product->id,
        'store_id' => $product->store_id,
        'unit_id' => $product->base_unit_id,
        'price' => 3000,
        'channel' => 'both',
    ]);

    $this->postJson('/price-quote', [
        'product_id' => $product->id,
        'unit_id' => $product->base_unit_id,
        'quantity' => 3,
        'channel' => 'online',
    ])->assertSuccessful()
        ->assertJsonPath('data.unit_price', 3000)
        ->assertJsonPath('data.subtotal', 9000)
        ->assertJsonPath('data.source', 'configured');
});
