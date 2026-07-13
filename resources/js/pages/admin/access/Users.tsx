import { Link, router, useForm } from '@inertiajs/react';
import { KeyRound, Plus, Search, ShieldOff, UserCog } from 'lucide-react';
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

type Option = { id: number; name: string };
type UserRow = {
    id: number;
    name: string;
    email: string;
    phone?: string;
    store_id: number;
    is_active: boolean;
    must_change_password: boolean;
    roles: Option[];
};
type PaginatedUsers = {
    data: UserRow[];
    links: Array<{ url: string | null; label: string; active: boolean }>;
    total: number;
};

export default function Users({
    users,
    roles,
    stores,
    filters,
}: {
    users: PaginatedUsers;
    roles: Option[];
    stores: Option[];
    filters: { search?: string };
}) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<UserRow | null>(null);
    const [passwordUser, setPasswordUser] = useState<UserRow | null>(null);
    const userForm = useForm({
        name: '',
        email: '',
        phone: '',
        store_id: stores[0]?.id ?? '',
        role: roles[0]?.name ?? '',
        password: '',
        is_active: true,
    });
    const passwordForm = useForm({ password: '', password_confirmation: '' });

    const openCreate = () => {
        setEditing(null);
        userForm.reset();
        userForm.setData({
            name: '',
            email: '',
            phone: '',
            store_id: stores[0]?.id ?? '',
            role: roles[0]?.name ?? '',
            password: '',
            is_active: true,
        });
        setOpen(true);
    };
    const openEdit = (user: UserRow) => {
        setEditing(user);
        userForm.setData({
            name: user.name,
            email: user.email,
            phone: user.phone ?? '',
            store_id: user.store_id,
            role: user.roles[0]?.name ?? '',
            password: '',
            is_active: user.is_active,
        });
        setOpen(true);
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (editing) {
            userForm.put(`/admin/access/users/${editing.id}`, {
                onSuccess: () => setOpen(false),
            });
        } else {
            userForm.post('/admin/access/users', {
                onSuccess: () => setOpen(false),
            });
        }
    };
    const resetPassword = (event: FormEvent) => {
        event.preventDefault();

        if (!passwordUser) {
            return;
        }

        passwordForm.put(`/admin/access/users/${passwordUser.id}/password`, {
            onSuccess: () => {
                setPasswordUser(null);
                passwordForm.reset();
            },
        });
    };

    return (
        <AdminLayout title="Pengguna">
            <div className="space-y-6 p-4 md:p-8">
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-6 text-stone-800 md:flex-row md:items-center">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-400 uppercase">
                            Kontrol akses
                        </p>
                        <h2 className="mt-1 text-2xl font-bold">
                            Pengguna internal
                        </h2>
                        <p className="mt-1 text-sm text-stone-400">
                            Kelola akun, role, status, password awal, dan sesi
                            perangkat.
                        </p>
                    </div>
                    <Button
                        onClick={openCreate}
                        className="bg-lime-400 text-stone-950 hover:bg-lime-300"
                    >
                        <Plus className="mr-2 size-4" />
                        Tambah pengguna
                    </Button>
                </div>
                <div className="flex flex-col justify-between gap-3 rounded-2xl border bg-white p-4 md:flex-row md:items-center">
                    <form
                        onSubmit={(event) => {
                            event.preventDefault();
                            router.get(
                                '/admin/access/users',
                                { search },
                                { preserveState: true },
                            );
                        }}
                        className="flex w-full max-w-lg gap-2"
                    >
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari nama atau email…"
                        />
                        <Button variant="outline">
                            <Search className="size-4" />
                        </Button>
                    </form>
                    <span className="text-sm text-stone-500">
                        {users.total} pengguna
                    </span>
                </div>
                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-stone-50 text-left text-xs tracking-wide text-stone-500 uppercase">
                                <tr>
                                    <th className="px-5 py-4">Pengguna</th>
                                    <th className="px-5 py-4">Role</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4 text-right">
                                        Tindakan
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100">
                                {users.data.map((user) => (
                                    <tr
                                        key={user.id}
                                        className="hover:bg-stone-50/70"
                                    >
                                        <td className="px-5 py-4">
                                            <div className="font-semibold text-stone-900">
                                                {user.name}
                                            </div>
                                            <div className="text-xs text-stone-500">
                                                {user.email}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className="rounded-full bg-lime-100 px-2.5 py-1 text-xs font-semibold text-lime-800">
                                                {user.roles[0]?.name ??
                                                    'Tanpa role'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${user.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                                                >
                                                    {user.is_active
                                                        ? 'Aktif'
                                                        : 'Nonaktif'}
                                                </span>
                                                {user.must_change_password && (
                                                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
                                                        Ganti password
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className="flex justify-end gap-1">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        openEdit(user)
                                                    }
                                                >
                                                    <UserCog className="mr-1.5 size-4" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        setPasswordUser(user)
                                                    }
                                                >
                                                    <KeyRound className="mr-1.5 size-4" />
                                                    Password
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() =>
                                                        confirm(
                                                            `Cabut semua sesi ${user.name}?`,
                                                        ) &&
                                                        router.delete(
                                                            `/admin/access/users/${user.id}/sessions`,
                                                        )
                                                    }
                                                >
                                                    <ShieldOff className="mr-1.5 size-4" />
                                                    Sesi
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex flex-wrap gap-1 border-t p-4">
                        {users.links.map((link) =>
                            link.url ? (
                                <Link
                                    key={link.label}
                                    href={link.url}
                                    className={`rounded-lg px-3 py-1.5 text-xs ${link.active ? 'bg-lime-200 text-lime-950' : 'border text-stone-600'}`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : null,
                        )}
                    </div>
                </div>
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <form onSubmit={submit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editing ? 'Edit pengguna' : 'Pengguna baru'}
                            </DialogTitle>
                            <DialogDescription>
                                Akun pegawai menggunakan guard backoffice dan
                                wajib memiliki satu role.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-5 md:grid-cols-2">
                            <FormField
                                label="Nama"
                                error={userForm.errors.name}
                            >
                                <Input
                                    value={userForm.data.name}
                                    onChange={(e) =>
                                        userForm.setData('name', e.target.value)
                                    }
                                />
                            </FormField>
                            <FormField
                                label="Email"
                                error={userForm.errors.email}
                            >
                                <Input
                                    type="email"
                                    value={userForm.data.email}
                                    onChange={(e) =>
                                        userForm.setData(
                                            'email',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                            <FormField label="Telepon">
                                <Input
                                    value={userForm.data.phone}
                                    onChange={(e) =>
                                        userForm.setData(
                                            'phone',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                            <FormField label="Toko">
                                <select
                                    className="h-10 w-full rounded-md border px-3"
                                    value={userForm.data.store_id}
                                    onChange={(e) =>
                                        userForm.setData(
                                            'store_id',
                                            Number(e.target.value),
                                        )
                                    }
                                >
                                    {stores.map((store) => (
                                        <option key={store.id} value={store.id}>
                                            {store.name}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                            <FormField
                                label="Role"
                                error={userForm.errors.role}
                            >
                                <select
                                    className="h-10 w-full rounded-md border px-3"
                                    value={userForm.data.role}
                                    onChange={(e) =>
                                        userForm.setData('role', e.target.value)
                                    }
                                >
                                    {roles.map((role) => (
                                        <option key={role.id} value={role.name}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>
                            </FormField>
                            {!editing && (
                                <FormField
                                    label="Password awal"
                                    error={userForm.errors.password}
                                >
                                    <Input
                                        type="password"
                                        value={userForm.data.password}
                                        onChange={(e) =>
                                            userForm.setData(
                                                'password',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </FormField>
                            )}
                            {editing && (
                                <label className="flex items-center gap-2 self-end rounded-xl border p-3 text-sm">
                                    <input
                                        type="checkbox"
                                        checked={userForm.data.is_active}
                                        onChange={(e) =>
                                            userForm.setData(
                                                'is_active',
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    Akun aktif
                                </label>
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
                            <Button disabled={userForm.processing}>
                                Simpan
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog
                open={Boolean(passwordUser)}
                onOpenChange={(value) => !value && setPasswordUser(null)}
            >
                <DialogContent>
                    <form onSubmit={resetPassword}>
                        <DialogHeader>
                            <DialogTitle>
                                Reset password {passwordUser?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Seluruh sesi akan dicabut dan pengguna wajib
                                mengganti password setelah masuk.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-5">
                            <FormField
                                label="Password baru"
                                error={passwordForm.errors.password}
                            >
                                <Input
                                    type="password"
                                    value={passwordForm.data.password}
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                            <FormField label="Konfirmasi password">
                                <Input
                                    type="password"
                                    value={
                                        passwordForm.data.password_confirmation
                                    }
                                    onChange={(e) =>
                                        passwordForm.setData(
                                            'password_confirmation',
                                            e.target.value,
                                        )
                                    }
                                />
                            </FormField>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setPasswordUser(null)}
                            >
                                Batal
                            </Button>
                            <Button disabled={passwordForm.processing}>
                                Reset dan cabut sesi
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}

function FormField({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}
