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
            $table->boolean('storefront_visible')->default(true)->after('is_active');
            $table->string('storefront_title')->nullable()->after('name');
            $table->text('storefront_summary')->nullable()->after('description');
            $table->string('storefront_image_path')->nullable()->after('storefront_summary');
            $table->string('storefront_badge', 50)->nullable()->after('storefront_image_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('promotions', function (Blueprint $table) {
            $table->dropColumn([
                'storefront_visible',
                'storefront_title',
                'storefront_summary',
                'storefront_image_path',
                'storefront_badge',
            ]);
        });
    }
};
