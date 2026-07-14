import { router, useForm } from '@inertiajs/react';
import { Plus, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useConfirmation } from '@/components/confirmation-dialog';
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

const roleLabels: Record<string, string> = {
    Owner: 'Pemilik',
    Admin: 'Administrator',
    Kasir: 'Kasir',
    'Staff Gudang': 'Petugas Gudang',
    'Staff Online': 'Petugas Online',
};

const permissionGroupGuides: Record<
    string,
    { title: string; description: string }
> = {
    attendance: {
        title: 'Absensi',
        description: 'Atur cara pegawai melakukan dan memperbaiki absensi.',
    },
    audit_log: {
        title: 'Riwayat aktivitas',
        description: 'Melihat jejak perubahan penting di sistem.',
    },
    cms: {
        title: 'Konten website',
        description: 'Mengelola artikel, halaman, dan informasi di website.',
    },
    customers: {
        title: 'Pelanggan',
        description: 'Melihat dan mengelola data pelanggan.',
    },
    finance: {
        title: 'Keuangan',
        description: 'Mengakses pencatatan dan pengelolaan keuangan.',
    },
    hr: {
        title: 'SDM',
        description: 'Melihat dan mengelola data pegawai.',
    },
    inventory: {
        title: 'Persediaan',
        description: 'Mengelola stok, gudang, dan operasional persediaan.',
    },
    orders: {
        title: 'Pesanan online',
        description: 'Melihat dan memproses pesanan dari website.',
    },
    pos: {
        title: 'Kasir (POS)',
        description: 'Mengatur transaksi dan operasional kasir.',
    },
    products: {
        title: 'Produk',
        description: 'Mengelola katalog, harga, dan informasi produk.',
    },
    promotions: {
        title: 'Promo & voucher',
        description: 'Melihat dan mengelola program promo.',
    },
    reports: {
        title: 'Laporan',
        description: 'Mengakses laporan operasional toko.',
    },
    roles: {
        title: 'Peran & hak akses',
        description: 'Mengatur peran dan hak akses pengguna.',
    },
    settings: {
        title: 'Pengaturan toko',
        description: 'Mengubah pengaturan operasional toko.',
    },
    users: {
        title: 'Akun pengguna',
        description: 'Mengelola akun staf dan aksesnya.',
    },
    legacy: {
        title: 'Akses dasar',
        description:
            'Akses sistem lama yang tetap dipakai agar fitur berjalan normal.',
    },
};

const permissionActions: Record<string, string> = {
    view: 'Lihat',
    create: 'Tambah',
    edit: 'Ubah',
    delete: 'Hapus',
    manage: 'Kelola',
    receive: 'Terima barang',
    transfer: 'Pindahkan stok',
    opname: 'Stock opname',
    use: 'Gunakan',
    self: 'Absen sendiri',
    correct: 'Koreksi',
    allowed: 'Izinkan',
    approve: 'Setujui',
    manual: 'Atur manual',
    own: 'Batalkan transaksi sendiri',
    any: 'Batalkan semua transaksi',
};

function roleLabel(name: string): string {
    return roleLabels[name] ?? name;
}

function permissionPresentation(name: string): {
    title: string;
    description: string;
} {
    const special: Record<string, { title: string; description: string }> = {
        'attendance.remote.allowed': {
            title: 'Izinkan absen di luar lokasi',
            description:
                'Pegawai dapat absen ketika berada di luar lokasi toko.',
        },
        'attendance.correct': {
            title: 'Koreksi absensi',
            description: 'Memperbaiki catatan absensi yang perlu ditinjau.',
        },
        'products.view_hpp': {
            title: 'Lihat harga modal',
            description: 'Melihat HPP atau harga modal produk.',
        },
        'products.prices.edit': {
            title: 'Ubah harga jual',
            description: 'Mengatur harga dan tingkatan harga produk.',
        },
        'inventory.adjustment.create': {
            title: 'Buat penyesuaian stok',
            description: 'Mengajukan penambahan atau pengurangan stok.',
        },
        'inventory.adjustment.approve': {
            title: 'Setujui penyesuaian stok',
            description: 'Menyetujui perubahan stok yang diajukan.',
        },
        'inventory.reports.view': {
            title: 'Lihat laporan stok',
            description: 'Melihat nilai dan pergerakan stok.',
        },
        'pos.shift.manage': {
            title: 'Kelola shift kasir',
            description: 'Membuka dan menutup shift kasir.',
        },
        'pos.discount.override_limit': {
            title: 'Lewati batas diskon',
            description: 'Memberi diskon di atas batas yang ditentukan.',
        },
        'pos.discount.manual': {
            title: 'Beri diskon manual',
            description: 'Memberi potongan harga saat transaksi kasir.',
        },
        'pos.retur.create': {
            title: 'Buat retur penjualan',
            description: 'Mencatat pengembalian barang dari pelanggan.',
        },
        'pos.retur.approve': {
            title: 'Setujui retur penjualan',
            description: 'Menyetujui retur yang memerlukan persetujuan.',
        },
        'pos.void.own': {
            title: 'Batalkan transaksi sendiri',
            description: 'Membatalkan transaksi yang dibuat oleh akun ini.',
        },
        'pos.void.any': {
            title: 'Batalkan semua transaksi',
            description: 'Membatalkan transaksi kasir dari seluruh staf.',
        },
    };
    const legacy: Record<string, { title: string; description: string }> = {
        'manage pos': {
            title: 'Akses kasir',
            description:
                'Membuka fitur kasir yang masih menggunakan akses dasar.',
        },
        'manage inventory': {
            title: 'Akses persediaan',
            description:
                'Membuka fitur persediaan yang masih menggunakan akses dasar.',
        },
        'manage catalog': {
            title: 'Akses katalog',
            description:
                'Membuka fitur katalog yang masih menggunakan akses dasar.',
        },
        'manage finance': {
            title: 'Akses keuangan',
            description:
                'Membuka fitur keuangan yang masih menggunakan akses dasar.',
        },
        'manage settings': {
            title: 'Akses pengaturan',
            description:
                'Membuka pengaturan toko yang masih menggunakan akses dasar.',
        },
        'manage hr': {
            title: 'Akses SDM',
            description:
                'Membuka fitur SDM yang masih menggunakan akses dasar.',
        },
        'manage users': {
            title: 'Akses pengguna',
            description:
                'Membuka fitur pengguna yang masih menggunakan akses dasar.',
        },
        'view reports': {
            title: 'Akses laporan',
            description: 'Membuka laporan yang masih menggunakan akses dasar.',
        },
    };

    if (special[name]) {
        return special[name];
    }

    if (legacy[name]) {
        return legacy[name];
    }

    const [group, action] = name.split('.');
    const groupTitle = permissionGroupGuides[group]?.title ?? 'Fitur toko';
    const actionTitle = permissionActions[action] ?? 'Gunakan';

    return {
        title: `${actionTitle} ${groupTitle.toLowerCase()}`,
        description: `Mengizinkan pengguna untuk ${actionTitle.toLowerCase()} ${groupTitle.toLowerCase()}.`,
    };
}

export default function Roles({
    roles,
    permissionGroups,
    systemRoles,
}: {
    roles: Role[];
    permissionGroups: Record<string, Permission[]>;
    systemRoles: string[];
}) {
    const confirm = useConfirmation();
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
        <AdminLayout title="Peran & Hak Akses">
            <div className="space-y-6 p-4 md:p-8">
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-6 text-stone-800 md:flex-row md:items-center">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-400 uppercase">
                            RBAC granular
                        </p>
                        <h2 className="mt-1 text-2xl font-bold">
                            Peran dan hak akses
                        </h2>
                        <p className="mt-1 text-sm text-stone-400">
                            Tentukan apa yang boleh dilakukan setiap pegawai.
                            Pilih hanya akses yang benar-benar dibutuhkan.
                        </p>
                    </div>
                    <Button
                        onClick={() => begin()}
                        className="bg-lime-400 text-stone-950 hover:bg-lime-300"
                    >
                        <Plus className="mr-2 size-4" />
                        Peran kustom
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
                                {roleLabel(role.name)}
                            </h3>
                            <p className="mt-1 text-sm text-stone-500">
                                {role.permissions.length} hak akses aktif
                            </p>
                            <div className="mt-4 flex flex-wrap gap-1.5">
                                {role.permissions
                                    .slice(0, 6)
                                    .map((permission) => (
                                        <span
                                            key={permission.id}
                                            className="rounded-md bg-stone-100 px-2 py-1 text-[11px] text-stone-600"
                                        >
                                            {
                                                permissionPresentation(
                                                    permission.name,
                                                ).title
                                            }
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
                                        onClick={async () => {
                                            if (
                                                await confirm({
                                                    title: `Hapus role ${role.name}?`,
                                                    description:
                                                        'Role kustom ini akan dihapus dari pengaturan akses.',
                                                    confirmLabel: 'Hapus role',
                                                    destructive: true,
                                                })
                                            ) {
                                                router.delete(
                                                    `/admin/access/roles/${role.id}`,
                                                );
                                            }
                                        }}
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
                                    ? `Atur ${roleLabel(editing.name)}`
                                    : 'Peran kustom baru'}
                            </DialogTitle>
                            <DialogDescription>
                                Centang hanya tugas yang memang dikerjakan oleh
                                pegawai dengan peran ini.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-5">
                            <Label>Nama peran</Label>
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
                                                <div>
                                                    <h4 className="font-bold text-stone-900">
                                                        {permissionGroupGuides[
                                                            group
                                                        ]?.title ?? group}
                                                    </h4>
                                                    <p className="mt-0.5 text-xs text-stone-500">
                                                        {
                                                            permissionGroupGuides[
                                                                group
                                                            ]?.description
                                                        }
                                                    </p>
                                                </div>
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
                                                            className="flex cursor-pointer items-start gap-2 rounded-lg bg-stone-50 p-2.5 text-stone-700"
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
                                                            <span>
                                                                <span className="block text-xs font-semibold text-stone-800">
                                                                    {
                                                                        permissionPresentation(
                                                                            permission.name,
                                                                        ).title
                                                                    }
                                                                </span>
                                                                <span className="mt-0.5 block text-[11px] leading-relaxed text-stone-500">
                                                                    {
                                                                        permissionPresentation(
                                                                            permission.name,
                                                                        )
                                                                            .description
                                                                    }
                                                                </span>
                                                            </span>
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
