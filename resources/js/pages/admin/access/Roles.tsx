import { router, useForm } from '@inertiajs/react';
import { Plus, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/AdminLayout';

type Permission = { id: number; name: string };
type Role = {
    id: number;
    name: string;
    users_count: number;
    permissions: Permission[];
};

export default function Roles({
    roles,
    permissionGroups,
    systemRoles,
}: {
    roles: Role[];
    permissionGroups: Record<string, Permission[]>;
    systemRoles: string[];
}) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<Role | null>(null);
    const form = useForm({ name: '', permissions: [] as string[] });
    const begin = (role?: Role) => {
        setEditing(role ?? null);
        form.setData({
            name: role?.name ?? '',
            permissions:
                role?.permissions.map((permission) => permission.name) ?? [],
        });
        setOpen(true);
    };
    const toggle = (permission: string) =>
        form.setData(
            'permissions',
            form.data.permissions.includes(permission)
                ? form.data.permissions.filter((item) => item !== permission)
                : [...form.data.permissions, permission],
        );
    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (editing) {
            form.put(`/admin/access/roles/${editing.id}`, {
                onSuccess: () => setOpen(false),
            });
        } else {
            form.post('/admin/access/roles', {
                onSuccess: () => setOpen(false),
            });
        }
    };

    return (
        <AdminLayout title="Role & Permission">
            <div className="space-y-6 p-4 md:p-8">
                <div className="flex flex-col justify-between gap-4 rounded-2xl bg-stone-950 p-6 text-white md:flex-row md:items-center">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-400 uppercase">
                            RBAC granular
                        </p>
                        <h2 className="mt-1 text-2xl font-bold">
                            Role dan permission
                        </h2>
                        <p className="mt-1 text-sm text-stone-400">
                            Role adalah kumpulan izin; tidak ada akses yang
                            di-hardcode berdasarkan nama role.
                        </p>
                    </div>
                    <Button
                        onClick={() => begin()}
                        className="bg-lime-400 text-stone-950 hover:bg-lime-300"
                    >
                        <Plus className="mr-2 size-4" />
                        Role kustom
                    </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {roles.map((role) => (
                        <article
                            key={role.id}
                            className="rounded-2xl border border-stone-200 bg-white p-5"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex size-11 items-center justify-center rounded-xl bg-lime-100 text-lime-800">
                                    <ShieldCheck className="size-5" />
                                </div>
                                <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-600">
                                    {role.users_count} pengguna
                                </span>
                            </div>
                            <h3 className="mt-4 text-lg font-bold text-stone-950">
                                {role.name}
                            </h3>
                            <p className="mt-1 text-sm text-stone-500">
                                {role.permissions.length} permission aktif
                            </p>
                            <div className="mt-4 flex flex-wrap gap-1.5">
                                {role.permissions
                                    .slice(0, 6)
                                    .map((permission) => (
                                        <span
                                            key={permission.id}
                                            className="rounded-md bg-stone-100 px-2 py-1 text-[11px] text-stone-600"
                                        >
                                            {permission.name}
                                        </span>
                                    ))}
                                {role.permissions.length > 6 && (
                                    <span className="px-2 py-1 text-[11px] text-stone-500">
                                        +{role.permissions.length - 6} lainnya
                                    </span>
                                )}
                            </div>
                            <div className="mt-5 flex gap-2">
                                <Button
                                    className="flex-1"
                                    variant="outline"
                                    onClick={() => begin(role)}
                                >
                                    Atur izin
                                </Button>
                                {!systemRoles.includes(role.name) && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            confirm(
                                                `Hapus role ${role.name}?`,
                                            ) &&
                                            router.delete(
                                                `/admin/access/roles/${role.id}`,
                                            )
                                        }
                                    >
                                        <Trash2 className="size-4 text-red-600" />
                                    </Button>
                                )}
                            </div>
                        </article>
                    ))}
                </div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
                    <form onSubmit={submit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editing
                                    ? `Atur ${editing.name}`
                                    : 'Role kustom baru'}
                            </DialogTitle>
                            <DialogDescription>
                                Pilih izin sedetail mungkin sesuai tanggung
                                jawab pegawai.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-5">
                            <Label>Nama role</Label>
                            <Input
                                className="mt-1.5"
                                value={form.data.name}
                                disabled={
                                    editing
                                        ? systemRoles.includes(editing.name)
                                        : false
                                }
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                            />
                            {form.errors.name && (
                                <p className="mt-1 text-xs text-red-600">
                                    {form.errors.name}
                                </p>
                            )}
                            <div className="mt-5 space-y-4">
                                {Object.entries(permissionGroups).map(
                                    ([group, permissions]) => (
                                        <section
                                            key={group}
                                            className="rounded-xl border border-stone-200 p-4"
                                        >
                                            <div className="mb-3 flex items-center justify-between">
                                                <h4 className="font-bold text-stone-900 capitalize">
                                                    {group}
                                                </h4>
                                                <button
                                                    type="button"
                                                    className="text-xs font-semibold text-lime-700"
                                                    onClick={() => {
                                                        const names =
                                                            permissions.map(
                                                                (permission) =>
                                                                    permission.name,
                                                            );
                                                        const allSelected =
                                                            names.every(
                                                                (name) =>
                                                                    form.data.permissions.includes(
                                                                        name,
                                                                    ),
                                                            );
                                                        form.setData(
                                                            'permissions',
                                                            allSelected
                                                                ? form.data.permissions.filter(
                                                                      (name) =>
                                                                          !names.includes(
                                                                              name,
                                                                          ),
                                                                  )
                                                                : [
                                                                      ...new Set(
                                                                          [
                                                                              ...form
                                                                                  .data
                                                                                  .permissions,
                                                                              ...names,
                                                                          ],
                                                                      ),
                                                                  ],
                                                        );
                                                    }}
                                                >
                                                    {permissions.every(
                                                        (permission) =>
                                                            form.data.permissions.includes(
                                                                permission.name,
                                                            ),
                                                    )
                                                        ? 'Kosongkan'
                                                        : 'Pilih semua'}
                                                </button>
                                            </div>
                                            <div className="grid gap-2 md:grid-cols-2">
                                                {permissions.map(
                                                    (permission) => (
                                                        <label
                                                            key={permission.id}
                                                            className="flex cursor-pointer items-center gap-2 rounded-lg bg-stone-50 p-2.5 text-xs text-stone-700"
                                                        >
                                                            <input
                                                                type="checkbox"
                                                                className="accent-lime-600"
                                                                checked={form.data.permissions.includes(
                                                                    permission.name,
                                                                )}
                                                                onChange={() =>
                                                                    toggle(
                                                                        permission.name,
                                                                    )
                                                                }
                                                            />
                                                            {permission.name}
                                                        </label>
                                                    ),
                                                )}
                                            </div>
                                        </section>
                                    ),
                                )}
                            </div>
                            {form.errors.permissions && (
                                <p className="mt-2 text-xs text-red-600">
                                    {form.errors.permissions}
                                </p>
                            )}
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button disabled={form.processing}>
                                <Save className="mr-2 size-4" />
                                Simpan role
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
