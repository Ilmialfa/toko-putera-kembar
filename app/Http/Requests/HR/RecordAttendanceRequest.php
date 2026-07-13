<?php

namespace App\Http\Requests\HR;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecordAttendanceRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();

        if ($user === null) {
            return false;
        }

        if ($this->string('attendance_method')->toString() === 'barcode_kiosk') {
            return $user->tokenCan('attendance:write') || $user->can('manage hr');
        }

        return $user->can('manage hr') || (int) $user->employee_id === $this->integer('employee_id');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'employee_barcode' => ['required_if:attendance_method,barcode_kiosk', 'nullable', 'string', 'max:50'],
            'employee_id' => ['required_if:attendance_method,photo_geo', 'nullable', 'integer', 'exists:employees,id'],
            'type' => ['required', Rule::in(['check_in', 'check_out'])],
            'attendance_method' => ['required', Rule::in(['photo_geo', 'barcode_kiosk'])],
            'photo_base64' => ['required_if:attendance_method,photo_geo', 'nullable', 'string', 'max:7000000', 'regex:/^data:image\/(jpeg|png|webp);base64,/'],
            'latitude' => ['required_if:attendance_method,photo_geo', 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => ['required_if:attendance_method,photo_geo', 'nullable', 'numeric', 'between:-180,180'],
            'accuracy_meters' => ['required_if:attendance_method,photo_geo', 'nullable', 'numeric', 'min:0', 'max:500'],
            'device_time' => ['required', 'date'],
            'device_info' => ['nullable', 'string', 'max:255'],
        ];
    }
}
