import { Head, router } from '@inertiajs/react';
import React from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import AppLayout from '@/layouts/app-layout';
import { formatCurrency, formatNumber } from '@/lib/utils';
import type { BreadcrumbItem } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Inventory Reports',
        href: '/inventory/reports',
    },
];

export default function Index({ products, categories, filters }: any) {
    const handleCategoryChange = (val: string) => {
        router.get(
            '/inventory/reports',
            { ...filters, category_id: val === 'all' ? '' : val },
            { preserveState: true },
        );
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inventory Reports" />

            <div className="flex h-full flex-1 flex-col gap-4 p-4">
                <Card>
                    <CardHeader>
                        <CardTitle>Inventory Report</CardTitle>
                        <CardDescription>
                            Current stock levels and valuation.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 flex items-center gap-4">
                            <div className="w-[200px]">
                                <Select
                                    onValueChange={handleCategoryChange}
                                    defaultValue={filters.category_id || 'all'}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All Categories
                                        </SelectItem>
                                        {categories.map((c: any) => (
                                            <SelectItem
                                                key={c.id}
                                                value={String(c.id)}
                                            >
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>SKU</TableHead>
                                    <TableHead>Product Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead className="text-right">
                                        Current Stock
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Unit
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Current WAC (HPP)
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Total Value
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {products.data.map((product: any) => (
                                    <TableRow key={product.id}>
                                        <TableCell>{product.sku}</TableCell>
                                        <TableCell>{product.name}</TableCell>
                                        <TableCell>
                                            {product.category?.name}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatNumber(
                                                product.stok_saat_ini,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {product.base_unit?.symbol}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(
                                                product.hpp_current,
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {formatCurrency(
                                                Number(product.stok_saat_ini) *
                                                    Number(product.hpp_current),
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
