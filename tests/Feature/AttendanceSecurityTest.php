<?php

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\StoreLocation;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;

uses(RefreshDatabase::class);

it('requires authentication to record attendance', function () {
    $this->postJson('/api/hr/attendances/record', [])->assertUnauthorized();
});

it('rejects photo attendance outside the configured store radius', function () {
    Storage::fake('local');
    $store = StoreLocation::factory()->create([
        'latitude' => 0.5071,
        'longitude' => 101.4478,
        'settings' => ['attendance_radius_meters' => 100],
        'is_main' => true,
    ]);
    $user = User::factory()->create(['store_id' => $store->id]);
    $employee = Employee::create([
        'store_location_id' => $store->id,
        'user_id' => $user->id,
        'nip' => 'EMP-SEC-001',
        'name' => 'Pegawai Aman',
        'position' => 'Kasir',
        'join_date' => now()->toDateString(),
        'is_active' => true,
    ]);
    $user->update(['employee_id' => $employee->id]);

    $this->actingAs($user)
        ->postJson('/api/hr/attendances/record', [
            'employee_id' => $employee->id,
            'type' => 'check_in',
            'attendance_method' => 'photo_geo',
            'photo_base64' => 'data:image/jpeg;base64,'.base64_encode('image-bytes'),
            'latitude' => 0.60,
            'longitude' => 101.60,
            'accuracy_meters' => 5,
            'device_time' => now()->toIso8601String(),
        ])
        ->assertUnprocessable()
        ->assertJsonValidationErrors('latitude');

    expect(Attendance::query()->count())->toBe(0);
    Storage::disk('local')->assertDirectoryEmpty('attendances');
});

it('does not expose attendance update or delete endpoints', function () {
    $this->putJson('/api/hr/attendances/1', [])->assertNotFound();
    $this->deleteJson('/api/hr/attendances/1')->assertNotFound();
});
