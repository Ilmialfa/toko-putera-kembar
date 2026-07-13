<?php

namespace App\Domain\HR\Controllers;

use App\Http\Controllers\Controller;
use App\Models\AttendanceCorrection;
use Illuminate\Http\Request;

class AttendanceCorrectionController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->validate([
            'employee_id' => 'required|exists:employees,id',
            'attendance_id' => 'nullable|exists:attendances,id',
            'corrected_type' => 'required|in:check_in,check_out',
            'corrected_time' => 'required|date',
            'reason' => 'required|string|max:500',
        ]);

        $data['approved_by'] = $request->user()->id; // Assume admin/HR who submits it is the approver for now

        AttendanceCorrection::create($data);

        return redirect()->back()->with('success', 'Koreksi absensi berhasil dicatat.');
    }
}
