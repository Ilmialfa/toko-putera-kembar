import { router, useForm } from '@inertiajs/react';
import { BadgeCheck, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useConfirmation } from '@/components/confirmation-dialog';
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

interface Brand {
    id: number;
    name: string;
    slug: string;
    is_active: boolean;
}
interface BrandIndexProps {
    brands: { data: Brand[]; total?: number };
    filters: { search?: string };
}

export default function BrandIndex({ brands, filters }: BrandIndexProps) {
    const confirm = useConfirmation();
    const [search, setSearch] = useState(filters.search ?? '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
    } = useForm({ name: '', is_active: true });

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get('/admin/master/brands', { search }, { preserveState: true });
    };

    const closeDialog = () => {
        reset();
        setEditingBrand(null);
    };

    const saveNewBrand = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/admin/master/brands', {
            onSuccess: () => {
                setIsCreateOpen(false);
                closeDialog();
            },
        });
    };

    const openEdit = (brand: Brand) => {
        setEditingBrand(brand);
        setData({ name: brand.name, is_active: brand.is_active });
        setIsEditOpen(true);
    };

    const saveBrand = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingBrand) {
            return;
        }

        put(`/admin/master/brands/${editingBrand.id}`, {
            onSuccess: () => {
                setIsEditOpen(false);
                closeDialog();
            },
        });
    };

    const removeBrand = async (brand: Brand) => {
        if (
            await confirm({
                title: `Hapus merek ${brand.name}?`,
                description: 'Merek akan dihapus dari katalog produk.',
                confirmLabel: 'Hapus merek',
                destructive: true,
            })
        ) {
            destroy(`/admin/master/brands/${brand.id}`);
        }
    };

    const brandForm = (
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
                    <Label htmlFor={`${formId}-name`}>Nama merek</Label>
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
                <label className="flex min-h-11 items-center gap-3 rounded-xl border border-stone-200 px-3 text-sm font-medium text-stone-700">
                    <input
                        type="checkbox"
                        checked={data.is_active}
                        onChange={(event) =>
                            setData('is_active', event.target.checked)
                        }
                    />
                    Merek aktif
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
                    {processing ? 'Menyimpan...' : 'Simpan merek'}
                </Button>
            </DialogFooter>
        </form>
    );

    return (
        <AdminLayout title="Merek">
            <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-700 uppercase">
                            Master data
                        </p>
                        <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
                            Merek produk
                        </h2>
                        <p className="mt-1 text-sm text-stone-500">
                            Simpan merek agar pencarian dan katalog produk tetap
                            konsisten.
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-11 px-4">
                                <Plus className="size-4" /> Tambah merek
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            {brandForm(
                                'new-brand',
                                saveNewBrand,
                                'Tambah merek',
                            )}
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
                                    placeholder="Cari merek"
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
                            <BadgeCheck className="size-4 text-lime-700" />
                            {brands.total ?? brands.data.length} merek
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Tindakan
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {brands.data.length > 0 ? (
                                    brands.data.map((brand) => (
                                        <TableRow key={brand.id}>
                                            <TableCell className="font-semibold text-stone-800">
                                                {brand.name}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-stone-500">
                                                {brand.slug}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${brand.is_active ? 'border-lime-200 bg-lime-50 text-lime-800' : 'border-stone-200 bg-stone-50 text-stone-600'}`}
                                                >
                                                    {brand.is_active
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
                                                            openEdit(brand)
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
                                                            removeBrand(brand)
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
                                            Merek belum ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </section>
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                        {brandForm('edit-brand', saveBrand, 'Ubah merek')}
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
