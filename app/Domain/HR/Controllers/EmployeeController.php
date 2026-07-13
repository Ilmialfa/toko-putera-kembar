<?php

namespace App\Domain\HR\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\StoreLocation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('admin/hr/employees/Index', [
            'employees' => Employee::query()->with(['user.roles:id,name', 'storeLocation:id,name'])->latest()->paginate(20),
            'users' => User::query()->where('is_active', true)->whereDoesntHave('employee')->orderBy('name')->get(['id', 'name', 'email']),
            'stores' => StoreLocation::query()->where('is_active', true)->get(['id', 'name']),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        DB::transaction(function () use ($data): void {
            $employee = Employee::query()->create($data);
            if ($employee->user_id !== null) {
                User::query()->whereKey($employee->user_id)->update(['employee_id' => $employee->id]);
            }
        });

        return back()->with('success', 'Data pegawai berhasil dibuat.');
    }

    public function update(Request $request, Employee $employee): RedirectResponse
    {
        $data = $this->validated($request, $employee);
        DB::transaction(function () use ($data, $employee): void {
            User::query()->where('employee_id', $employee->id)->update(['employee_id' => null]);
            $employee->update($data);
            if ($employee->user_id !== null) {
                User::query()->whereKey($employee->user_id)->update(['employee_id' => $employee->id]);
            }
        });

        return back()->with('success', 'Data pegawai berhasil diperbarui.');
    }

    /** @return array<string,mixed> */
    private function validated(Request $request, ?Employee $employee = null): array
    {
        return $request->validate([
            'store_location_id' => ['required', 'exists:store_locations,id'],
            'user_id' => ['nullable', 'exists:users,id', Rule::unique('employees', 'user_id')->ignore($employee)],
            'nip' => ['nullable', 'string', 'max:50', Rule::unique('employees', 'nip')->ignore($employee)],
            'name' => ['required', 'string', 'max:150'], 'position' => ['nullable', 'string', 'max:50'],
            'phone' => ['nullable', 'string', 'max:20'], 'barcode_id' => ['nullable', 'string', 'max:50', Rule::unique('employees', 'barcode_id')->ignore($employee)],
            'join_date' => ['required', 'date'], 'is_active' => ['required', 'boolean'],
        ]);
    }
}
