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
        Schema::table('purchase_orders', function (Blueprint $table) {
            $table->text('notes')->nullable()->after('expected_date');
        });
        Schema::table('stock_transfers', function (Blueprint $table) {
            $table->string('transfer_number', 100)->nullable()->unique()->after('store_id');
            $table->text('notes')->nullable()->after('status');
        });
        Schema::table('stock_opnames', function (Blueprint $table) {
            $table->string('opname_number', 100)->nullable()->unique()->after('store_id');
            $table->text('notes')->nullable()->after('scope_ids');
        });
        Schema::table('stock_out_adjustments', function (Blueprint $table) {
            $table->string('status', 20)->default('pending')->after('reason_type')->index();
        });
        Schema::table('supplier_returns', function (Blueprint $table) {
            $table->string('return_number', 100)->nullable()->unique()->after('store_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('supplier_returns', fn (Blueprint $table) => $table->dropColumn('return_number'));
        Schema::table('stock_out_adjustments', function (Blueprint $table) {
            $table->dropIndex(['status']);
            $table->dropColumn('status');
        });
        Schema::table('stock_opnames', fn (Blueprint $table) => $table->dropColumn(['opname_number', 'notes']));
        Schema::table('stock_transfers', fn (Blueprint $table) => $table->dropColumn(['transfer_number', 'notes']));
        Schema::table('purchase_orders', fn (Blueprint $table) => $table->dropColumn('notes'));
    }
};
