<?php

namespace App\Domain\Identity\Controllers;

use App\Enums\AuditLogAction;
use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\StoreLocation;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserManagementController extends Controller
{
    public function index(Request $request): Response
    {
        $users = User::query()
            ->with('roles:id,name')
            ->when($request->string('search')->toString(), function ($query, string $search): void {
                $query->where(fn ($filter) => $filter
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%"));
            })
            ->latest()
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/access/Users', [
            'users' => $users,
            'roles' => Role::query()->orderBy('name')->get(['id', 'name']),
            'stores' => StoreLocation::query()->where('is_active', true)->get(['id', 'name']),
            'filters' => $request->only('search'),
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:20'],
            'store_id' => ['required', 'integer', 'exists:store_locations,id'],
            'role' => ['required', 'string', 'exists:roles,name'],
            'password' => ['required', Password::min(8)->letters()->numbers()],
        ]);

        $user = DB::transaction(function () use ($data): User {
            $user = User::query()->create([
                ...collect($data)->except('role')->all(),
                'must_change_password' => true,
                'email_verified_at' => now(),
                'is_active' => true,
            ]);
            $user->syncRoles($data['role']);

            return $user;
        });

        $this->audit($request, $user, ['created' => true, 'role' => $data['role']]);

        return back()->with('success', 'Pengguna berhasil dibuat.');
    }

    public function update(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:150'],
            'email' => ['required', 'email', 'max:150', Rule::unique('users', 'email')->ignore($user)],
            'phone' => ['nullable', 'string', 'max:20'],
            'store_id' => ['required', 'integer', 'exists:store_locations,id'],
            'role' => ['required', 'string', 'exists:roles,name'],
            'is_active' => ['required', 'boolean'],
        ]);

        $this->protectLastOwner($user, (bool) $data['is_active'], $data['role']);

        DB::transaction(function () use ($user, $data): void {
            $user->update(collect($data)->except('role')->all());
            $user->syncRoles($data['role']);
        });

        $this->audit($request, $user, collect($data)->except('email')->all());

        return back()->with('success', 'Pengguna berhasil diperbarui.');
    }

    public function resetPassword(Request $request, User $user): RedirectResponse
    {
        $data = $request->validate([
            'password' => ['required', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user->forceFill([
            'password' => Hash::make($data['password']),
            'must_change_password' => true,
        ])->save();
        DB::table('sessions')->where('user_id', $user->id)->delete();
        $this->audit($request, $user, ['password_reset' => true, 'sessions_revoked' => true]);

        return back()->with('success', 'Kata sandi direset dan seluruh sesi pengguna dicabut.');
    }

    public function revokeSessions(Request $request, User $user): RedirectResponse
    {
        DB::table('sessions')->where('user_id', $user->id)->delete();
        $this->audit($request, $user, ['sessions_revoked' => true]);

        return back()->with('success', 'Seluruh sesi pengguna berhasil dicabut.');
    }

    private function protectLastOwner(User $user, bool $isActive, string $role): void
    {
        if (! $user->hasRole('Owner') || ($isActive && $role === 'Owner')) {
            return;
        }

        $activeOwners = User::query()->where('is_active', true)->role('Owner')->count();

        if ($activeOwners <= 1) {
            throw ValidationException::withMessages(['role' => 'Sistem harus memiliki minimal satu Owner aktif.']);
        }
    }

    /** @param array<string, mixed> $values */
    private function audit(Request $request, User $subject, array $values): void
    {
        AuditLog::query()->create([
            'store_id' => $subject->store_id,
            'user_id' => $request->user()->id,
            'action' => AuditLogAction::UPDATE,
            'auditable_type' => $subject->getMorphClass(),
            'auditable_id' => $subject->id,
            'new_values' => $values,
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
        ]);
    }
}
