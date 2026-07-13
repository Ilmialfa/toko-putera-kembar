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
        Schema::create('promotions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('store_locations')->cascadeOnDelete();
            $table->string('name');
            $table->string('type', 20); // discount_item, discount_category, voucher, bundling, bxgy, cashback, loyalty_point
            $table->dateTime('start_date');
            $table->dateTime('end_date');
            $table->string('channel', 10)->default('both'); // pos, online, both
            $table->boolean('is_active')->default(true);
            $table->boolean('is_stackable')->default(false);
            $table->integer('priority')->default(0);
            $table->integer('usage_limit_total')->nullable();
            $table->integer('usage_limit_per_customer')->nullable();
            $table->decimal('min_purchase_amount', 15, 2)->nullable();
            $table->string('applicable_scope', 20)->default('all'); // all, category, product, brand
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promotions');
    }
};
