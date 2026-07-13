<?php

namespace App\Domain\HR\Controllers;

use App\Domain\HR\Actions\RecordAttendanceAction;
use App\Http\Controllers\Controller;
use App\Http\Requests\HR\RecordAttendanceRequest;
use App\Models\Attendance;
use App\Models\Employee;
use Illuminate\Http\JsonResponse;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController extends Controller
{
    public function index(): Response
    {
        $attendances = Attendance::with(['employee', 'storeLocation'])
            ->latest('captured_at_server')
            ->paginate(15);

        return Inertia::render('admin/hr/attendances/Index', [
            'attendances' => $attendances,
        ]);
    }

    public function create(): Response
    {
        $employees = Employee::query()->where('is_active', true)
            ->orderBy('name')
            ->get(['id', 'name', 'position']);

        return Inertia::render('attendance/Index', [
            'employees' => $employees,
            'serverTime' => now()->toIso8601String(),
        ]);
    }

    public function record(RecordAttendanceRequest $request, RecordAttendanceAction $action): JsonResponse
    {
        $data = $request->validated();

        if ($data['attendance_method'] === 'barcode_kiosk') {
            $employee = Employee::where('barcode_id', $data['employee_barcode'])->firstOrFail();
            $data['employee_id'] = $employee->id;
        }

        $attendance = $action->execute($data);

        return response()->json([
            'message' => 'Attendance recorded successfully',
            'attendance' => $attendance,
        ]);
    }
}
