import { Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
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
    baseUnit?: { name: string };
    is_active: boolean;
    stok_saat_ini: number;
}

export default function ProductIndex({ products, categories, filters }: any) {
    const [search, setSearch] = useState(filters.search || '');
    const [categoryId, setCategoryId] = useState(filters.category_id || '');

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/catalog/products',
            { search, category_id: categoryId },
            { preserveState: true },
        );
    };

    const handleDelete = (product: Product) => {
        if (confirm(`Are you sure you want to delete ${product.name}?`)) {
            router.delete(`/admin/catalog/products/${product.id}`);
        }
    };

    return (
        <AdminLayout title="Products">
            <div className="mb-6 flex items-center justify-between">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        placeholder="Search products..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-64"
                    />
                    <select
                        className="h-10 rounded-md border border-input bg-transparent px-3"
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                    >
                        <option value="">All Categories</option>
                        {categories.map((cat: any) => (
                            <option key={cat.id} value={cat.id}>
                                {cat.name}
                            </option>
                        ))}
                    </select>
                    <Button type="submit" variant="secondary">
                        Search
                    </Button>
                </form>

                <Button asChild>
                    <Link href="/admin/catalog/products/create">
                        Add Product
                    </Link>
                </Button>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>SKU</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Brand</TableHead>
                            <TableHead>Stock</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {products.data.map((product: Product) => (
                            <TableRow key={product.id}>
                                <TableCell>{product.sku}</TableCell>
                                <TableCell className="font-medium">
                                    {product.name}
                                </TableCell>
                                <TableCell>{product.category?.name}</TableCell>
                                <TableCell>
                                    {product.brand?.name || '-'}
                                </TableCell>
                                <TableCell>
                                    {product.stok_saat_ini}{' '}
                                    {product.baseUnit?.name}
                                </TableCell>
                                <TableCell>
                                    {product.is_active ? 'Active' : 'Inactive'}
                                </TableCell>
                                <TableCell className="gap-2 text-right">
                                    <Button variant="ghost" size="sm" asChild>
                                        <Link
                                            href={`/admin/catalog/products/${product.id}/edit`}
                                        >
                                            Edit
                                        </Link>
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500"
                                        onClick={() => handleDelete(product)}
                                    >
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        </AdminLayout>
    );
}
