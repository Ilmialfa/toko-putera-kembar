<?php

namespace App\Domain\HR\Actions;

use App\Models\Attendance;
use App\Models\Employee;
use App\Models\StoreLocation;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class RecordAttendanceAction
{
    /** @param array<string, mixed> $data */
    public function execute(array $data): Attendance
    {
        $employee = Employee::query()->findOrFail($data['employee_id']);
        $storeLocation = StoreLocation::query()->findOrFail($employee->store_location_id);

        $now = now();
        $deviceTime = CarbonImmutable::parse($data['device_time']);

        // Time drift validation (e.g. 5 minutes max)
        if ($now->diffInMinutes($deviceTime) > 5) {
            $data['device_info'] = Str::limit(($data['device_info'] ?? '').' | Time drift: '.$now->diffInSeconds($deviceTime).'s', 255);
        }

        $distance = null;
        $isWithinRadius = null;

        if (isset($data['latitude']) && isset($data['longitude'])) {
            $distance = $this->calculateDistance(
                $storeLocation->latitude,
                $storeLocation->longitude,
                $data['latitude'],
                $data['longitude']
            );

            $settings = $storeLocation->getAttribute('settings');
            $radius = (float) (is_array($settings) ? ($settings['attendance_radius_meters'] ?? 100) : 100);
            $isWithinRadius = $distance !== null && $distance <= $radius;

            if (! $isWithinRadius && ! Auth::user()?->can('attendance.remote.allowed')) {
                throw ValidationException::withMessages([
                    'latitude' => 'Anda berada di luar radius toko. Hubungi admin jika memerlukan pengecualian.',
                ]);
            }
        }

        $hasDuplicate = Attendance::query()
            ->where('employee_id', $employee->id)
            ->where('type', $data['type'])
            ->where('captured_at_server', '>=', now()->subMinute())
            ->exists();

        if ($hasDuplicate) {
            throw ValidationException::withMessages(['type' => 'Absensi yang sama baru saja direkam.']);
        }

        $photoPath = null;

        if (! empty($data['photo_base64'])) {
            [, $encodedImage] = explode(';base64,', $data['photo_base64'], 2);
            $imageBase64 = base64_decode($encodedImage, true);

            if ($imageBase64 === false || strlen($imageBase64) > 5 * 1024 * 1024) {
                throw ValidationException::withMessages(['photo_base64' => 'Foto absensi tidak valid atau terlalu besar.']);
            }

            $fileName = 'attendances/'.$employee->id.'/'.Str::uuid().'.jpg';
            Storage::disk('local')->put($fileName, $imageBase64);
            $photoPath = $fileName;
        }

        return Attendance::create([
            'employee_id' => $employee->id,
            'store_location_id' => $employee->store_location_id,
            'type' => $data['type'],
            'attendance_method' => $data['attendance_method'],
            'photo_path' => $photoPath,
            'captured_at_server' => $now,
            'captured_at_device' => $deviceTime,
            'latitude' => $data['latitude'] ?? null,
            'longitude' => $data['longitude'] ?? null,
            'accuracy_meters' => $data['accuracy_meters'] ?? null,
            'matched_store_location_id' => $employee->store_location_id,
            'distance_from_store_meters' => $distance,
            'is_within_radius' => $isWithinRadius,
            'device_info' => $data['device_info'] ?? null,
        ]);
    }

    private function calculateDistance(mixed $lat1, mixed $lon1, mixed $lat2, mixed $lon2): ?float
    {
        if ($lat1 === null || $lon1 === null || $lat2 === null || $lon2 === null) {
            return null;
        }

        $earthRadius = 6371000; // meters
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);

        $a = sin($dLat / 2) * sin($dLat / 2) +
             cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
             sin($dLon / 2) * sin($dLon / 2);

        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return round($earthRadius * $c, 2);
    }
}
