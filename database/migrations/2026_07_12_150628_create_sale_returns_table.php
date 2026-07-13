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
        Schema::create('sale_returns', function (Blueprint $table) {
            $table->id();

            $table->foreignId('sale_id')->constrained('sales')->cascadeOnDelete();

            $table->string('type', 10)->default('return'); // return, exchange
            $table->string('status', 20)->default('pending_approval'); // pending_approval, approved, rejected

            $table->unsignedBigInteger('approved_by')->nullable();

            $table->decimal('total_refund_amount', 15, 2)->default(0);

            $table->unsignedBigInteger('exchange_sale_id')->nullable();

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_returns');
    }
};
