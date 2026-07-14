import { Head, Link, router } from '@inertiajs/react';
import { PackageOpen, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useConfirmation } from '@/components/confirmation-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/AdminLayout';

interface Product {
    id: number;
    name: string;
    sku: string;
    category?: { name: string };
    brand?: { name: string };
    baseUnit?: { name: string; symbol?: string };
    is_active: boolean;
    stok_saat_ini: number;
}

interface Category {
    id: number;
    name: string;
}

interface ProductPage {
    data: Product[];
    from?: number;
    to?: number;
    total?: number;
    links?: { url: string | null; label: string; active: boolean }[];
}

interface ProductIndexProps {
    products: ProductPage;
    categories: Category[];
    filters: { search?: string; category_id?: string | number };
}

export default function ProductIndex({
    products,
    categories,
    filters,
}: ProductIndexProps) {
    const confirm = useConfirmation();
    const [search, setSearch] = useState(filters.search ?? '');
    const [categoryId, setCategoryId] = useState(
        String(filters.category_id ?? ''),
    );

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/admin/master/products',
            { search, category_id: categoryId },
            { preserveState: true, replace: true },
        );
    };

    const handleDelete = async (product: Product) => {
        if (
            await confirm({
                title: `Hapus produk ${product.name}?`,
                description:
                    'Produk dan pengaturan harganya tidak dapat dipulihkan setelah dihapus.',
                confirmLabel: 'Hapus produk',
                destructive: true,
            })
        ) {
            router.delete(`/admin/master/products/${product.id}`, {
                preserveScroll: true,
            });
        }
    };

    return (
        <AdminLayout title="Produk">
            <Head title="Produk" />

            <div className="space-y-5 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-700 uppercase">
                            Master data
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-800">
                            Daftar Produk
                        </h1>
                        <p className="mt-1 text-sm text-stone-500">
                            Kelola katalog, satuan jual, harga, dan ketersediaan
                            produk.
                        </p>
                    </div>
                    <Button asChild className="h-11 px-5">
                        <Link href="/admin/master/products/create">
                            <Plus className="size-4" />
                            Tambah Produk
                        </Link>
                    </Button>
                </header>

                <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                    <form
                        onSubmit={handleSearch}
                        className="grid gap-3 border-b border-stone-200 p-4 sm:grid-cols-[minmax(260px,1fr)_220px_auto] sm:p-5"
                    >
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
                            <Input
                                aria-label="Cari produk"
                                placeholder="Cari nama atau SKU produk"
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                className="h-11 pl-9"
                            />
                        </div>
                        <select
                            aria-label="Filter kategori"
                            className="h-11 w-full rounded-lg border border-input bg-white px-3 text-sm text-stone-700"
                            value={categoryId}
                            onChange={(event) =>
                                setCategoryId(event.target.value)
                            }
                        >
                            <option value="">Semua kategori</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
                        </select>
                        <Button
                            type="submit"
                            variant="outline"
                            className="h-11"
                        >
                            Terapkan Filter
                        </Button>
                    </form>

                    {products.data.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-stone-50 hover:bg-stone-50">
                                            <TableHead>Produk</TableHead>
                                            <TableHead>Kategori</TableHead>
                                            <TableHead>Merek</TableHead>
                                            <TableHead>Stok</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-right">
                                                Tindakan
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.data.map((product) => (
                                            <TableRow key={product.id}>
                                                <TableCell>
                                                    <p className="font-semibold text-stone-800">
                                                        {product.name}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-stone-500">
                                                        SKU {product.sku}
                                                    </p>
                                                </TableCell>
                                                <TableCell>
                                                    {product.category?.name ??
                                                        '—'}
                                                </TableCell>
                                                <TableCell>
                                                    {product.brand?.name ?? '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-semibold text-stone-800">
                                                        {product.stok_saat_ini}
                                                    </span>{' '}
                                                    <span className="text-stone-500">
                                                        {product.baseUnit
                                                            ?.symbol ??
                                                            product.baseUnit
                                                                ?.name ??
                                                            ''}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${
                                                            product.is_active
                                                                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                : 'border-stone-200 bg-stone-50 text-stone-500'
                                                        }`}
                                                    >
                                                        {product.is_active
                                                            ? 'Aktif'
                                                            : 'Nonaktif'}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            asChild
                                                        >
                                                            <Link
                                                                href={`/admin/master/products/${product.id}/edit`}
                                                            >
                                                                <Pencil className="size-4" />
                                                                Ubah
                                                            </Link>
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    product,
                                                                )
                                                            }
                                                        >
                                                            <Trash2 className="size-4" />
                                                            Hapus
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>

                            <footer className="flex flex-col gap-3 border-t border-stone-200 px-4 py-3 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
                                <span>
                                    Menampilkan {products.from ?? 1}–
                                    {products.to ?? products.data.length} dari{' '}
                                    {products.total ?? products.data.length}{' '}
                                    produk
                                </span>
                                {products.links &&
                                    products.links.length > 3 && (
                                        <nav
                                            aria-label="Paginasi produk"
                                            className="flex flex-wrap gap-1"
                                        >
                                            {products.links.map(
                                                (link, index) => (
                                                    <Button
                                                        key={`${link.label}-${index}`}
                                                        variant={
                                                            link.active
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        size="sm"
                                                        disabled={!link.url}
                                                        onClick={() =>
                                                            link.url &&
                                                            router.get(
                                                                link.url,
                                                                {},
                                                                {
                                                                    preserveState: true,
                                                                    preserveScroll: true,
                                                                },
                                                            )
                                                        }
                                                    >
                                                        {link.label
                                                            .replace(
                                                                '&laquo;',
                                                                '‹',
                                                            )
                                                            .replace(
                                                                '&raquo;',
                                                                '›',
                                                            )
                                                            .replace(
                                                                'Previous',
                                                                'Sebelumnya',
                                                            )
                                                            .replace(
                                                                'Next',
                                                                'Berikutnya',
                                                            )}
                                                    </Button>
                                                ),
                                            )}
                                        </nav>
                                    )}
                            </footer>
                        </>
                    ) : (
                        <div className="grid min-h-72 place-items-center p-8 text-center">
                            <div>
                                <span className="mx-auto grid size-12 place-items-center rounded-xl border border-lime-200 bg-lime-50 text-lime-700">
                                    <PackageOpen className="size-6" />
                                </span>
                                <h2 className="mt-4 font-bold text-stone-800">
                                    Produk belum ditemukan
                                </h2>
                                <p className="mt-1 max-w-sm text-sm text-stone-500">
                                    Ubah filter pencarian atau tambahkan produk
                                    pertama untuk mulai mengelola katalog.
                                </p>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
