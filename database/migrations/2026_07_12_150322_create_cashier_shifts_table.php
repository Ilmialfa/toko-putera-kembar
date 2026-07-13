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
        Schema::create('cashier_shifts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('store_locations')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();

            $table->decimal('opening_balance', 15, 2)->default(0);

            $table->decimal('closing_balance_system', 15, 2)->nullable();
            $table->decimal('closing_balance_actual', 15, 2)->nullable();
            $table->decimal('selisih_kas', 15, 2)->nullable();

            $table->string('status', 20)->default('open'); // open, closed

            $table->timestamp('opening_at')->useCurrent();
            $table->timestamp('closing_at')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cashier_shifts');
    }
};
