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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->foreignId('store_id')->constrained('store_locations')->restrictOnDelete();

            $table->string('name', 255);
            $table->string('slug', 255)->unique();
            $table->string('sku', 100)->unique();
            $table->string('barcode_primary', 100)->nullable()->unique();
            $table->string('qr_code', 150)->unique();

            $table->foreignId('category_id')->constrained('categories')->restrictOnDelete();
            $table->foreignId('brand_id')->nullable()->constrained('brands')->nullOnDelete();
            $table->foreignId('default_warehouse_id')->constrained('warehouses')->restrictOnDelete();
            $table->foreignId('primary_supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->foreignId('base_unit_id')->constrained('units')->restrictOnDelete();

            $table->string('product_type', 20)->default('physical'); // physical, digital, service
            $table->string('costing_method', 10)->default('WAC'); // WAC, FIFO

            $table->boolean('is_active')->default(true);
            $table->boolean('is_sellable')->default(true);
            $table->boolean('sellable_pos')->default(true);
            $table->boolean('sellable_online')->default(true);
            $table->boolean('is_preorder')->default(false);

            $table->unsignedSmallInteger('preorder_eta_days')->nullable();
            $table->decimal('weight_grams', 10, 2)->nullable();
            $table->decimal('length_cm', 10, 2)->nullable();
            $table->decimal('width_cm', 10, 2)->nullable();
            $table->decimal('height_cm', 10, 2)->nullable();

            $table->decimal('min_stock', 15, 3)->default(0);
            $table->decimal('max_stock', 15, 3)->default(0);
            $table->decimal('safety_stock', 15, 3)->default(0);
            $table->decimal('reorder_point', 15, 3)->default(0);

            $table->boolean('track_batch')->default(false);
            $table->boolean('track_expiry')->default(false);
            $table->boolean('track_serial_number')->default(false);

            $table->decimal('hpp_current', 15, 4)->default(0);
            $table->decimal('stok_saat_ini', 15, 3)->default(0);

            $table->string('image_primary_path', 255)->nullable();
            $table->text('description_short')->nullable();
            $table->text('description_long')->nullable();

            $table->string('seo_title', 255)->nullable();
            $table->text('seo_description')->nullable();
            $table->text('seo_keywords')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();
            $table->softDeletes();

            // Indexes
            $table->index('is_active');
            $table->index('sellable_pos');
            $table->index('sellable_online');
            $table->index('is_preorder');
            $table->index(['store_id', 'is_active', 'sellable_online'], 'idx_store_active_online');
            $table->index(['store_id', 'category_id', 'is_active'], 'idx_store_category_active');

            // Regular index instead of FULLTEXT since SQLite driver in Laravel might not support it out of the box
            $table->index(['name'], 'idx_products_name_desc');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
