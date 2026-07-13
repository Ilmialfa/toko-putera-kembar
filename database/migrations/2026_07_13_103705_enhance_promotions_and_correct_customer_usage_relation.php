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
        Schema::table('promotions', function (Blueprint $table) {
            $table->text('description')->nullable()->after('name');
            $table->string('status', 20)->default('active')->after('type')->index();
            $table->foreignId('customer_group_id')->nullable()->after('channel')->constrained('customer_groups')->nullOnDelete();
            $table->decimal('max_discount_amount', 15, 2)->nullable()->after('min_purchase_amount');
            $table->string('exclusive_group', 50)->nullable()->after('is_stackable');
        });

        Schema::table('vouchers', function (Blueprint $table) {
            $table->unsignedInteger('max_uses')->nullable()->after('code');
            $table->timestamp('expires_at')->nullable()->after('max_uses');
        });

        Schema::table('promotion_usages', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->foreign('customer_id')->references('id')->on('customers')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('promotion_usages', function (Blueprint $table) {
            $table->dropForeign(['customer_id']);
            $table->foreign('customer_id')->references('id')->on('users')->nullOnDelete();
        });

        Schema::table('vouchers', function (Blueprint $table) {
            $table->dropColumn(['max_uses', 'expires_at']);
        });

        Schema::table('promotions', function (Blueprint $table) {
            $table->dropConstrainedForeignId('customer_group_id');
            $table->dropIndex(['status']);
            $table->dropColumn(['description', 'status', 'max_discount_amount', 'exclusive_group']);
        });
    }
};
