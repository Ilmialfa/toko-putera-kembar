import { router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Ruler, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/AdminLayout';

interface Unit {
    id: number;
    name: string;
    symbol: string;
    is_active: boolean;
}
interface UnitIndexProps {
    units: { data: Unit[]; total?: number };
    filters: { search?: string };
}

export default function UnitIndex({ units, filters }: UnitIndexProps) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
    } = useForm({ name: '', symbol: '', is_active: true });

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get('/admin/master/units', { search }, { preserveState: true });
    };
    const closeDialog = () => {
        reset();
        setEditingUnit(null);
    };
    const saveNewUnit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/admin/master/units', {
            onSuccess: () => {
                setIsCreateOpen(false);
                closeDialog();
            },
        });
    };
    const openEdit = (unit: Unit) => {
        setEditingUnit(unit);
        setData({
            name: unit.name,
            symbol: unit.symbol ?? '',
            is_active: unit.is_active,
        });
        setIsEditOpen(true);
    };
    const saveUnit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingUnit) {
            return;
        }

        put(`/admin/master/units/${editingUnit.id}`, {
            onSuccess: () => {
                setIsEditOpen(false);
                closeDialog();
            },
        });
    };
    const removeUnit = (unit: Unit) => {
        if (confirm(`Hapus satuan "${unit.name}"?`)) {
            destroy(`/admin/master/units/${unit.id}`);
        }
    };

    const unitForm = (
        formId: string,
        submit: (event: FormEvent<HTMLFormElement>) => void,
        title: string,
    ) => (
        <form onSubmit={submit} className="space-y-5">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor={`${formId}-name`}>Nama satuan</Label>
                    <Input
                        id={`${formId}-name`}
                        value={data.name}
                        onChange={(event) =>
                            setData('name', event.target.value)
                        }
                        autoFocus
                    />
                    {errors.name && (
                        <p className="text-sm text-red-600">{errors.name}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <Label htmlFor={`${formId}-symbol`}>Simbol</Label>
                    <Input
                        id={`${formId}-symbol`}
                        value={data.symbol}
                        onChange={(event) =>
                            setData('symbol', event.target.value)
                        }
                        placeholder="Contoh: pcs, kg, dus"
                    />
                    {errors.symbol && (
                        <p className="text-sm text-red-600">{errors.symbol}</p>
                    )}
                </div>
                <label className="flex min-h-11 items-center gap-3 rounded-xl border border-stone-200 px-3 text-sm font-medium text-stone-700">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(event) =>
                            setData('is_active', event.target.checked)
                        }
                    />
                    Satuan aktif
                </label>
            </div>
            <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        setIsCreateOpen(false);
                        setIsEditOpen(false);
                    }}
                >
                    Batal
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Menyimpan...' : 'Simpan satuan'}
                </Button>
            </DialogFooter>
        </form>
    );

    return (
        <AdminLayout title="Satuan">
            <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-700 uppercase">
                            Master data
                        </p>
                        <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
                            Satuan penjualan
                        </h2>
                        <p className="mt-1 text-sm text-stone-500">
                            Tetapkan satuan dasar dan simbol yang dipakai pada
                            produk serta transaksi.
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-11 px-4">
                                <Plus className="size-4" /> Tambah satuan
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            {unitForm('new-unit', saveNewUnit, 'Tambah satuan')}
                        </DialogContent>
                    </Dialog>
                </header>
                <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                    <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <form
                            onSubmit={handleSearch}
                            className="flex w-full max-w-md gap-2"
                        >
                            <div className="relative min-w-0 flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
                                <Input
                                    placeholder="Cari satuan"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="h-10 w-full pl-9"
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="outline"
                                className="h-10"
                            >
                                Cari
                            </Button>
                        </form>
                        <span className="inline-flex items-center gap-2 text-sm text-stone-500">
                            <Ruler className="size-4 text-lime-700" />
                            {units.total ?? units.data.length} satuan
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Simbol</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Tindakan
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {units.data.length > 0 ? (
                                    units.data.map((unit) => (
                                        <TableRow key={unit.id}>
                                            <TableCell className="font-semibold text-stone-800">
                                                {unit.name}
                                            </TableCell>
                                            <TableCell>
                                                <span className="rounded-lg border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-xs text-stone-700">
                                                    {unit.symbol}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${unit.is_active ? 'border-lime-200 bg-lime-50 text-lime-800' : 'border-stone-200 bg-stone-50 text-stone-600'}`}
                                                >
                                                    {unit.is_active
                                                        ? 'Aktif'
                                                        : 'Nonaktif'}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            openEdit(unit)
                                                        }
                                                    >
                                                        <Pencil className="size-3.5" />{' '}
                                                        Ubah
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        onClick={() =>
                                                            removeUnit(unit)
                                                        }
                                                    >
                                                        <Trash2 className="size-3.5" />{' '}
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="h-48 text-center text-sm text-stone-500"
                                        >
                                            Satuan belum ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </section>
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                        {unitForm('edit-unit', saveUnit, 'Ubah satuan')}
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
