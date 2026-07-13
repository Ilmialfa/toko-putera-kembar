<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('promotion_rewards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('promotion_id')->constrained('promotions')->cascadeOnDelete();
            $table->string('reward_type', 20); // percent_discount, fixed_discount, free_product, cashback, point_multiplier
            $table->decimal('value', 15, 2);
            $table->foreignId('free_product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->decimal('free_product_qty', 15, 3)->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promotion_rewards');
    }
};
