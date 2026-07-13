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
        Schema::create('attendances', function (Blueprint $table) {
            $table->id(); // Use unsignedBigInteger by default in modern Laravel
            $table->foreignId('employee_id')->constrained('employees')->cascadeOnDelete();
            $table->foreignId('store_location_id')->constrained('store_locations')->cascadeOnDelete();
            $table->string('type', 10); // check_in, check_out
            $table->string('attendance_method', 15); // photo_geo, barcode_kiosk
            $table->string('photo_path', 255)->nullable();
            $table->timestamp('captured_at_server');
            $table->timestamp('captured_at_device')->nullable();
            $table->decimal('latitude', 10, 7)->nullable();
            $table->decimal('longitude', 10, 7)->nullable();
            $table->decimal('accuracy_meters', 8, 2)->nullable();
            $table->foreignId('matched_store_location_id')->nullable()->constrained('store_locations')->nullOnDelete();
            $table->decimal('distance_from_store_meters', 10, 2)->nullable();
            $table->boolean('is_within_radius')->nullable();
            $table->string('device_info', 255)->nullable();

            // Immutable: only created_at is present
            $table->timestamp('created_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
