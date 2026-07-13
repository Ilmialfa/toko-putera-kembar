import { Head, Link } from '@inertiajs/react';
import { Plus, Eye } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/AdminLayout';
import * as stockInRoutes from '@/routes/admin/inventory/stock-ins';
interface StockIn {
    id: number;
    invoice_number: string | null;
    status: string;
    total_amount: number;
    payment_status: string;
    received_at: string;
    supplier?: { id: number; name: string };
    warehouse?: { id: number; name: string };
    creator?: { id: number; name: string };
}

interface Props {
    stockIns: {
        data: StockIn[];
        links: any[];
        current_page: number;
        last_page: number;
    };
}

export default function Index({ stockIns }: Props) {
    return (
        <AdminLayout>
            <Head title="Barang Masuk" />

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Barang Masuk (Stock In)
                        </h1>
                        <p className="text-muted-foreground">
                            Kelola penerimaan barang dari supplier
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={stockInRoutes.create.url()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Catat Barang Masuk
                        </Link>
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Riwayat Barang Masuk</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Waktu Masuk</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>Gudang</TableHead>
                                        <TableHead>No. Invoice</TableHead>
                                        <TableHead>Total (Rp)</TableHead>
                                        <TableHead>Status Pembayaran</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">
                                            Aksi
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {stockIns.data.length === 0 ? (
                                        <TableRow>
                                            <TableCell
                                                colSpan={8}
                                                className="h-24 text-center text-muted-foreground"
                                            >
                                                Belum ada data barang masuk.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        stockIns.data.map((item) => (
                                            <TableRow key={item.id}>
                                                <TableCell>
                                                    {new Date(
                                                        item.received_at,
                                                    ).toLocaleString('id-ID')}
                                                </TableCell>
                                                <TableCell>
                                                    {item.supplier?.name || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {item.warehouse?.name ||
                                                        '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {item.invoice_number || '-'}
                                                </TableCell>
                                                <TableCell>
                                                    {new Intl.NumberFormat(
                                                        'id-ID',
                                                    ).format(item.total_amount)}
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`rounded px-2 py-1 text-xs font-medium ${
                                                            item.payment_status ===
                                                            'paid'
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                : item.payment_status ===
                                                                    'partial'
                                                                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                                        }`}
                                                    >
                                                        {item.payment_status.toUpperCase()}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <span
                                                        className={`rounded px-2 py-1 text-xs font-medium ${
                                                            item.status ===
                                                            'completed'
                                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                                : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                                        }`}
                                                    >
                                                        {item.status.toUpperCase()}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={stockInRoutes.show.url(
                                                                item.id,
                                                            )}
                                                        >
                                                            <Eye className="h-4 w-4" />
                                                        </Link>
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
