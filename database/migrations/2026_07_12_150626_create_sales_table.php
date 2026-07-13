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
        Schema::create('sales', function (Blueprint $table) {
            $table->id();

            $table->foreignId('store_id')->constrained('store_locations')->cascadeOnDelete();
            // In our system store_id points to store_locations. We'll use just store_id to avoid duplication
            // if store_location_id was intended as a separate thing, we'll follow Phase 1 which uses store_id -> store_locations

            $table->string('sale_number', 50)->unique();
            $table->foreignId('cashier_shift_id')->nullable()->constrained('cashier_shifts')->nullOnDelete();

            // Assuming customers table will be created later, so we just use foreignId without constraint for now
            // Wait, we can constrain it to users for now, or just leave it unconstrained if customers table doesn't exist yet
            // Looking at docs, customer might refer to users table (role: customer) or customers table.
            // Phase 1 used suppliers, but let's use constrained('users') assuming customers are users, or nullable without constraint.
            $table->unsignedBigInteger('customer_id')->nullable();

            $table->string('channel', 10)->default('pos'); // pos, online

            // Order ID for online orders
            $table->unsignedBigInteger('order_id')->nullable();

            $table->string('status', 20)->default('completed'); // completed, parked, voided, refunded, partially_refunded

            $table->decimal('subtotal', 15, 2)->default(0);
            $table->decimal('discount_total', 15, 2)->default(0);
            $table->decimal('tax_total', 15, 2)->default(0);
            $table->decimal('total_amount', 15, 2)->default(0);

            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->decimal('change_amount', 15, 2)->default(0);

            $table->string('payment_status', 20)->default('paid'); // paid, unpaid, partial

            $table->unsignedBigInteger('voided_by')->nullable();
            $table->timestamp('voided_at')->nullable();
            $table->string('void_reason')->nullable();

            $table->foreignId('created_by')->constrained('users')->cascadeOnDelete();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};
