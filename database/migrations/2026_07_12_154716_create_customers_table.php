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
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('email', 150)->nullable()->unique();
            $table->string('phone', 20)->unique();
            $table->string('password')->nullable();
            $table->foreignId('customer_group_id')->nullable()->constrained('customer_groups')->onDelete('restrict');
            $table->unsignedInteger('loyalty_point_balance')->default(0);
            $table->boolean('is_guest')->default(false);
            $table->string('guest_token', 64)->nullable()->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->timestamp('phone_verified_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};
