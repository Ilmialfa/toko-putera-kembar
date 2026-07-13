import { useForm } from '@inertiajs/react';
import { Plus, UserRoundCog } from 'lucide-react';
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

export default function Employees({ employees, users, stores }: any) {
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState<any>(null);
    const form = useForm({
        store_location_id: stores[0]?.id ?? '',
        user_id: '',
        nip: '',
        name: '',
        position: '',
        phone: '',
        barcode_id: '',
        join_date: new Date().toISOString().slice(0, 10),
        is_active: true,
    });
    const begin = (employee?: any) => {
        setEditing(employee ?? null);
        form.setData(
            employee
                ? {
                      store_location_id: employee.store_location_id,
                      user_id: employee.user_id ?? '',
                      nip: employee.nip ?? '',
                      name: employee.name,
                      position: employee.position ?? '',
                      phone: employee.phone ?? '',
                      barcode_id: employee.barcode_id ?? '',
                      join_date: employee.join_date?.slice(0, 10),
                      is_active: employee.is_active,
                  }
                : {
                      store_location_id: stores[0]?.id ?? '',
                      user_id: '',
                      nip: '',
                      name: '',
                      position: '',
                      phone: '',
                      barcode_id: '',
                      join_date: new Date().toISOString().slice(0, 10),
                      is_active: true,
                  },
        );
        setOpen(true);
    };
    const submit = (event: FormEvent) => {
        event.preventDefault();

        if (editing) {
            form.put(`/admin/hr/employees/${editing.id}`, {
                onSuccess: () => setOpen(false),
            });
        } else {
            form.post('/admin/hr/employees', {
                onSuccess: () => setOpen(false),
            });
        }
    };

    return (
        <AdminLayout title="Data Pegawai">
            <div className="space-y-6 p-4 md:p-8">
                <header className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-6 text-stone-800 md:flex-row md:items-center">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-400 uppercase">
                            People operations
                        </p>
                        <h2 className="mt-1 text-2xl font-bold">
                            Pegawai & penempatan
                        </h2>
                        <p className="mt-1 text-sm text-stone-400">
                            Hubungkan profil pegawai dengan akun backoffice,
                            barcode kiosk, dan lokasi kerja.
                        </p>
                    </div>
                    <Button
                        onClick={() => begin()}
                        className="bg-lime-400 text-stone-950 hover:bg-lime-300"
                    >
                        <Plus className="mr-2 size-4" />
                        Tambah pegawai
                    </Button>
                </header>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {employees.data.map((employee: any) => (
                        <article
                            key={employee.id}
                            className="rounded-2xl border bg-white p-5"
                        >
                            <div className="flex items-start justify-between">
                                <span className="flex size-11 items-center justify-center rounded-xl bg-lime-100 text-lime-800">
                                    <UserRoundCog className="size-5" />
                                </span>
                                <span
                                    className={`rounded-full px-2 py-1 text-xs font-semibold ${employee.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                                >
                                    {employee.is_active ? 'Aktif' : 'Nonaktif'}
                                </span>
                            </div>
                            <h3 className="mt-4 font-bold text-stone-950">
                                {employee.name}
                            </h3>
                            <p className="text-sm text-stone-500">
                                {employee.position || 'Posisi belum diisi'} ·{' '}
                                {employee.store_location?.name}
                            </p>
                            <div className="mt-3 space-y-1 text-xs text-stone-500">
                                <p>NIP: {employee.nip || '—'}</p>
                                <p>
                                    Akun:{' '}
                                    {employee.user?.email || 'Belum terhubung'}
                                </p>
                                <p>Barcode: {employee.barcode_id || '—'}</p>
                            </div>
                            <Button
                                className="mt-4 w-full"
                                variant="outline"
                                onClick={() => begin(employee)}
                            >
                                Edit profil
                            </Button>
                        </article>
                    ))}
                </div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent>
                    <form onSubmit={submit}>
                        <DialogHeader>
                            <DialogTitle>
                                {editing ? 'Edit pegawai' : 'Pegawai baru'}
                            </DialogTitle>
                            <DialogDescription>
                                Akun backoffice opsional, tetapi diperlukan
                                untuk absensi foto pribadi.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-5 md:grid-cols-2">
                            <Field label="Nama">
                                <Input
                                    value={form.data.name}
                                    onChange={(e) =>
                                        form.setData('name', e.target.value)
                                    }
                                />
                            </Field>
                            <Field label="NIP">
                                <Input
                                    value={form.data.nip}
                                    onChange={(e) =>
                                        form.setData('nip', e.target.value)
                                    }
                                />
                            </Field>
                            <Field label="Posisi">
                                <Input
                                    value={form.data.position}
                                    onChange={(e) =>
                                        form.setData('position', e.target.value)
                                    }
                                />
                            </Field>
                            <Field label="Telepon">
                                <Input
                                    value={form.data.phone}
                                    onChange={(e) =>
                                        form.setData('phone', e.target.value)
                                    }
                                />
                            </Field>
                            <Field label="Lokasi">
                                <select
                                    className="h-10 w-full rounded-md border px-3"
                                    value={form.data.store_location_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'store_location_id',
                                            Number(e.target.value),
                                        )
                                    }
                                >
                                    {stores.map((store: any) => (
                                        <option key={store.id} value={store.id}>
                                            {store.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Akun backoffice">
                                <select
                                    className="h-10 w-full rounded-md border px-3"
                                    value={form.data.user_id}
                                    onChange={(e) =>
                                        form.setData('user_id', e.target.value)
                                    }
                                >
                                    <option value="">Tanpa akun</option>
                                    {editing?.user && (
                                        <option value={editing.user.id}>
                                            {editing.user.name} —{' '}
                                            {editing.user.email}
                                        </option>
                                    )}
                                    {users.map((user: any) => (
                                        <option key={user.id} value={user.id}>
                                            {user.name} — {user.email}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                            <Field label="Barcode kiosk">
                                <Input
                                    value={form.data.barcode_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'barcode_id',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field label="Tanggal masuk">
                                <Input
                                    type="date"
                                    value={form.data.join_date}
                                    onChange={(e) =>
                                        form.setData(
                                            'join_date',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <label className="flex items-center gap-2 rounded-xl border p-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.data.is_active}
                                    onChange={(e) =>
                                        form.setData(
                                            'is_active',
                                            e.target.checked,
                                        )
                                    }
                                />
                                Pegawai aktif
                            </label>
                        </div>
                        {Object.keys(form.errors).length > 0 && (
                            <p className="text-sm text-red-600">
                                {Object.values(form.errors)[0]}
                            </p>
                        )}
                        <DialogFooter>
                            <Button disabled={form.processing}>Simpan</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
        </div>
    );
}
