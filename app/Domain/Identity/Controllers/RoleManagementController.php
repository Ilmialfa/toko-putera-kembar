<?php

namespace App\Domain\Identity\Controllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleManagementController extends Controller
{
    /** @var array<int, string> */
    private const SYSTEM_ROLES = ['Owner', 'Admin', 'Kasir', 'Staff Gudang', 'Staff Online'];

    public function index(): Response
    {
        $permissions = Permission::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('admin/access/Roles', [
            'roles' => Role::query()->with('permissions:id,name')->withCount('users')->orderBy('name')->get(),
            'permissionGroups' => $permissions->groupBy(fn (Permission $permission): string => str($permission->name)->before('.')->before(' ')->toString()),
            'systemRoles' => self::SYSTEM_ROLES,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validated($request);
        $role = Role::query()->create(['name' => $data['name'], 'guard_name' => 'web']);
        $role->syncPermissions($data['permissions']);

        return back()->with('success', 'Role kustom berhasil dibuat.');
    }

    public function update(Request $request, Role $role): RedirectResponse
    {
        $data = $this->validated($request, $role);

        if ($role->name === 'Owner' && ! in_array('roles.manage', $data['permissions'], true)) {
            throw ValidationException::withMessages(['permissions' => 'Owner wajib memiliki permission pengelolaan role.']);
        }

        $role->update(['name' => $data['name']]);
        $role->syncPermissions($data['permissions']);

        return back()->with('success', 'Role dan permission berhasil diperbarui.');
    }

    public function destroy(Role $role): RedirectResponse
    {
        if (in_array($role->name, self::SYSTEM_ROLES, true) || $role->users()->exists()) {
            throw ValidationException::withMessages(['role' => 'Role sistem atau role yang masih dipakai tidak dapat dihapus.']);
        }

        $role->delete();

        return back()->with('success', 'Role kustom berhasil dihapus.');
    }

    /** @return array{name:string,permissions:array<int,string>} */
    private function validated(Request $request, ?Role $role = null): array
    {
        return $request->validate([
            'name' => ['required', 'string', 'max:100', Rule::unique('roles', 'name')->ignore($role)],
            'permissions' => ['required', 'array', 'min:1'],
            'permissions.*' => ['required', 'string', 'exists:permissions,name'],
        ]);
    }
}
