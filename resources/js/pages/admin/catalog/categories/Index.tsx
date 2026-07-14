import { router, useForm } from '@inertiajs/react';
import {
    ImagePlus,
    LayoutList,
    PackageOpen,
    Pencil,
    Plus,
    Search,
    Trash2,
} from 'lucide-react';
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

interface Category {
    id: number;
    name: string;
    slug: string;
    display_order: number;
    is_active: boolean;
    icon: string | null;
    image_path: string | null;
}

interface CategoryIndexProps {
    categories: { data: Category[]; total?: number };
    filters: { search?: string };
}

const statusClass =
    'inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold';

export default function CategoryIndex({
    categories,
    filters,
}: CategoryIndexProps) {
    const confirm = useConfirmation();
    const [search, setSearch] = useState(filters.search ?? '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState<Category | null>(
        null,
    );
    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
    } = useForm({
        name: '',
        display_order: 0,
        is_active: true,
        parent_id: '',
        icon: 'package-open',
        image: null as File | null,
    });

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/admin/master/categories',
            { search },
            { preserveState: true },
        );
    };

    const resetDialog = () => {
        reset();
        setEditingCategory(null);
    };

    const handleCreateSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/admin/master/categories', {
            onSuccess: () => {
                setIsCreateOpen(false);
                resetDialog();
            },
        });
    };

    const openEdit = (category: Category) => {
        setEditingCategory(category);
        setData({
            name: category.name,
            display_order: category.display_order,
            is_active: category.is_active,
            parent_id: '',
            icon: category.icon ?? 'package-open',
            image: null,
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingCategory) {
            return;
        }

        put(`/admin/master/categories/${editingCategory.id}`, {
            onSuccess: () => {
                setIsEditOpen(false);
                resetDialog();
            },
        });
    };

    const handleDelete = async (category: Category) => {
        if (
            await confirm({
                title: `Hapus kategori ${category.name}?`,
                description: 'Kategori akan dihapus dari katalog produk.',
                confirmLabel: 'Hapus kategori',
                destructive: true,
            })
        ) {
            destroy(`/admin/master/categories/${category.id}`);
        }
    };

    return (
        <AdminLayout title="Kategori">
            <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-700 uppercase">
                            Master data
                        </p>
                        <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
                            Kategori produk
                        </h2>
                        <p className="mt-1 text-sm text-stone-500">
                            Kelompokkan produk agar katalog dan kasir lebih
                            mudah digunakan.
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-11 px-4">
                                <Plus className="size-4" /> Tambah kategori
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <form
                                onSubmit={handleCreateSubmit}
                                className="space-y-5"
                            >
                                <DialogHeader>
                                    <DialogTitle>Tambah kategori</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category-name">
                                            Nama kategori
                                        </Label>
                                        <Input
                                            id="category-name"
                                            value={data.name}
                                            onChange={(event) =>
                                                setData(
                                                    'name',
                                                    event.target.value,
                                                )
                                            }
                                            autoFocus
                                        />
                                        {errors.name && (
                                            <p className="text-sm text-red-600">
                                                {errors.name}
                                            </p>
                                        )}
                                    </div>
                                    <CategoryAppearanceFields
                                        icon={data.icon}
                                        image={data.image}
                                        onIconChange={(icon) =>
                                            setData('icon', icon)
                                        }
                                        onImageChange={(image) =>
                                            setData('image', image)
                                        }
                                        error={errors.image}
                                    />
                                    <div className="space-y-2">
                                        <Label htmlFor="category-order">
                                            Urutan tampil
                                        </Label>
                                        <Input
                                            id="category-order"
                                            type="number"
                                            min="0"
                                            value={data.display_order}
                                            onChange={(event) =>
                                                setData(
                                                    'display_order',
                                                    Number(
                                                        event.target.value,
                                                    ) || 0,
                                                )
                                            }
                                        />
                                    </div>
                                    <label className="flex min-h-11 items-center gap-3 rounded-xl border border-stone-200 px-3 text-sm font-medium text-stone-700">
                                        <input
                                            type="checkbox"
                                            checked={data.is_active}
                                            onChange={(event) =>
                                                setData(
                                                    'is_active',
                                                    event.target.checked,
                                                )
                                            }
                                        />
                                        Kategori aktif
                                    </label>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setIsCreateOpen(false)}
                                    >
                                        Batal
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing
                                            ? 'Menyimpan...'
                                            : 'Simpan kategori'}
                                    </Button>
                                </DialogFooter>
                            </form>
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
                                    placeholder="Cari kategori"
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
                            <LayoutList className="size-4 text-lime-700" />
                            {categories.total ?? categories.data.length}{' '}
                            kategori
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead>Urutan</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">
                                        Tindakan
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {categories.data.length > 0 ? (
                                    categories.data.map((category) => (
                                        <TableRow key={category.id}>
                                            <TableCell className="font-semibold text-stone-800">
                                                <span className="flex items-center gap-3">
                                                    {category.image_path ? (
                                                        <img
                                                            src={`/storage/${category.image_path}`}
                                                            alt=""
                                                            className="size-9 rounded-xl object-cover"
                                                        />
                                                    ) : (
                                                        <span className="grid size-9 place-items-center rounded-xl bg-lime-100 text-lime-800">
                                                            <PackageOpen className="size-4" />
                                                        </span>
                                                    )}
                                                    {category.name}
                                                </span>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-stone-500">
                                                {category.slug}
                                            </TableCell>
                                            <TableCell>
                                                {category.display_order}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`${statusClass} ${category.is_active ? 'border-lime-200 bg-lime-50 text-lime-800' : 'border-stone-200 bg-stone-50 text-stone-600'}`}
                                                >
                                                    {category.is_active
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
                                                            openEdit(category)
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
                                                            handleDelete(
                                                                category,
                                                            )
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
                                            colSpan={5}
                                            className="h-48 text-center text-sm text-stone-500"
                                        >
                                            Kategori belum ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </section>

                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                        <form onSubmit={handleEditSubmit} className="space-y-5">
                            <DialogHeader>
                                <DialogTitle>Ubah kategori</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="edit-category-name">
                                        Nama kategori
                                    </Label>
                                    <Input
                                        id="edit-category-name"
                                        value={data.name}
                                        onChange={(event) =>
                                            setData('name', event.target.value)
                                        }
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-600">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>
                                <CategoryAppearanceFields
                                    icon={data.icon}
                                    image={data.image}
                                    currentImagePath={
                                        editingCategory?.image_path
                                    }
                                    onIconChange={(icon) =>
                                        setData('icon', icon)
                                    }
                                    onImageChange={(image) =>
                                        setData('image', image)
                                    }
                                    error={errors.image}
                                />
                                <div className="space-y-2">
                                    <Label htmlFor="edit-category-order">
                                        Urutan tampil
                                    </Label>
                                    <Input
                                        id="edit-category-order"
                                        type="number"
                                        min="0"
                                        value={data.display_order}
                                        onChange={(event) =>
                                            setData(
                                                'display_order',
                                                Number(event.target.value) || 0,
                                            )
                                        }
                                    />
                                </div>
                                <label className="flex min-h-11 items-center gap-3 rounded-xl border border-stone-200 px-3 text-sm font-medium text-stone-700">
                                    <input
                                        type="checkbox"
                                        checked={data.is_active}
                                        onChange={(event) =>
                                            setData(
                                                'is_active',
                                                event.target.checked,
                                            )
                                        }
                                    />
                                    Kategori aktif
                                </label>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing
                                        ? 'Menyimpan...'
                                        : 'Simpan perubahan'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}

const categoryIconOptions = [
    { value: 'package-open', label: 'Paket umum' },
    { value: 'utensils-crossed', label: 'Makanan' },
    { value: 'milk', label: 'Minuman' },
    { value: 'shopping-basket', label: 'Sembako' },
    { value: 'spray-can', label: 'Kebersihan' },
    { value: 'heart-pulse', label: 'Perawatan diri' },
    { value: 'baby', label: 'Bayi & anak' },
    { value: 'cigarette', label: 'Rokok' },
    { value: 'snowflake', label: 'Makanan beku' },
    { value: 'cooking-pot', label: 'Bumbu & masak' },
];

function CategoryAppearanceFields({
    icon,
    image,
    currentImagePath,
    onIconChange,
    onImageChange,
    error,
}: {
    icon: string;
    image: File | null;
    currentImagePath?: string | null;
    onIconChange: (value: string) => void;
    onImageChange: (value: File | null) => void;
    error?: string;
}) {
    return (
        <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
                <Label>Ikon kategori</Label>
                <select
                    value={icon}
                    onChange={(event) => onIconChange(event.target.value)}
                    className="h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-stone-800 outline-none focus:border-lime-400"
                >
                    {categoryIconOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                <p className="text-xs leading-5 text-stone-500">
                    Dipakai bila kategori belum memiliki gambar.
                </p>
            </div>
            <div className="space-y-2">
                <Label htmlFor="category-image">
                    Gambar kategori (opsional)
                </Label>
                <label
                    htmlFor="category-image"
                    className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-dashed border-stone-300 px-3 text-sm text-stone-600 transition hover:border-lime-400 hover:bg-lime-50"
                >
                    <ImagePlus className="size-4 text-lime-700" />
                    <span className="truncate">
                        {image?.name ??
                            (currentImagePath
                                ? 'Ganti gambar kategori'
                                : 'Pilih gambar')}
                    </span>
                </label>
                <Input
                    id="category-image"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    className="sr-only"
                    onChange={(event) =>
                        onImageChange(event.target.files?.[0] ?? null)
                    }
                />
                <p className="text-xs leading-5 text-stone-500">
                    JPG, PNG, atau WebP, maksimal 5 MB.
                </p>
                {error && <p className="text-sm text-red-600">{error}</p>}
            </div>
        </div>
    );
}
