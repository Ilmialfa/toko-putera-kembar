import { Head, router } from '@inertiajs/react';
import { Boxes, PackageSearch } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/AdminLayout';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface Category {
    id: number;
    name: string;
}

interface InventoryProduct {
    id: number;
    sku: string;
    name: string;
    stok_saat_ini: number | string;
    hpp_current: number | string;
    category?: { name: string };
    base_unit?: { symbol: string };
}

interface InventoryReportProps {
    products: {
        data: InventoryProduct[];
        from?: number;
        to?: number;
        total?: number;
    };
    categories: Category[];
    filters: { category_id?: string | number };
}

export default function InventoryReport({
    products,
    categories,
    filters,
}: InventoryReportProps) {
    const handleCategoryChange = (value: string) => {
        router.get(
            '/admin/inventory/reports',
            { category_id: value === 'all' ? undefined : value },
            { preserveState: true, replace: true },
        );
    };

    const totalValuation = products.data.reduce(
        (total, product) =>
            total + Number(product.stok_saat_ini) * Number(product.hpp_current),
        0,
    );

    return (
        <AdminLayout title="Laporan Stok">
            <Head title="Laporan Stok" />

            <div className="space-y-5 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-700 uppercase">
                            Persediaan
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-800">
                            Laporan Stok
                        </h1>
                        <p className="mt-1 text-sm text-stone-500">
                            Pantau jumlah persediaan, HPP berjalan, dan valuasi
                            setiap produk.
                        </p>
                    </div>
                    <div className="flex min-w-52 items-center gap-3 rounded-xl border border-lime-200 bg-lime-50 px-4 py-3">
                        <Boxes className="size-5 text-lime-700" />
                        <div>
                            <p className="text-xs font-medium text-stone-500">
                                Valuasi halaman ini
                            </p>
                            <p className="font-bold text-stone-800">
                                {formatCurrency(totalValuation)}
                            </p>
                        </div>
                    </div>
                </header>

                <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                    <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-end sm:justify-between sm:p-5">
                        <div className="w-full sm:w-64">
                            <label className="mb-2 block text-sm font-semibold text-stone-700">
                                Filter kategori
                            </label>
                            <Select
                                onValueChange={handleCategoryChange}
                                value={String(filters.category_id || 'all')}
                            >
                                <SelectTrigger className="h-11 w-full bg-white">
                                    <SelectValue placeholder="Semua kategori" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">
                                        Semua kategori
                                    </SelectItem>
                                    {categories.map((category) => (
                                        <SelectItem
                                            key={category.id}
                                            value={String(category.id)}
                                        >
                                            {category.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <p className="text-sm text-stone-500">
                            {products.total ?? products.data.length} produk
                            ditemukan
                        </p>
                    </div>

                    {products.data.length > 0 ? (
                        <>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-stone-50 hover:bg-stone-50">
                                            <TableHead>Produk</TableHead>
                                            <TableHead>Kategori</TableHead>
                                            <TableHead className="text-right">
                                                Stok Saat Ini
                                            </TableHead>
                                            <TableHead>Satuan</TableHead>
                                            <TableHead className="text-right">
                                                HPP Berjalan
                                            </TableHead>
                                            <TableHead className="text-right">
                                                Nilai Persediaan
                                            </TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {products.data.map((product) => {
                                            const stock = Number(
                                                product.stok_saat_ini,
                                            );
                                            const cost = Number(
                                                product.hpp_current,
                                            );

                                            return (
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
                                                        {product.category
                                                            ?.name ?? '—'}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold tabular-nums">
                                                        {formatNumber(stock)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {product.base_unit
                                                            ?.symbol ?? '—'}
                                                    </TableCell>
                                                    <TableCell className="text-right tabular-nums">
                                                        {formatCurrency(cost)}
                                                    </TableCell>
                                                    <TableCell className="text-right font-semibold text-stone-800 tabular-nums">
                                                        {formatCurrency(
                                                            stock * cost,
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </div>
                            <footer className="border-t border-stone-200 px-4 py-3 text-sm text-stone-500">
                                Menampilkan {products.from ?? 1}–
                                {products.to ?? products.data.length} dari{' '}
                                {products.total ?? products.data.length} produk
                            </footer>
                        </>
                    ) : (
                        <div className="grid min-h-72 place-items-center p-8 text-center">
                            <div>
                                <span className="mx-auto grid size-12 place-items-center rounded-xl border border-stone-200 bg-stone-50 text-stone-500">
                                    <PackageSearch className="size-6" />
                                </span>
                                <h2 className="mt-4 font-bold text-stone-800">
                                    Data stok tidak ditemukan
                                </h2>
                                <p className="mt-1 text-sm text-stone-500">
                                    Pilih kategori lain atau tambahkan produk
                                    terlebih dahulu.
                                </p>
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </AdminLayout>
    );
}
