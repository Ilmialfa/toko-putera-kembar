import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
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

interface StockInDetail {
    id: number;
    qty: string;
    purchase_price_per_unit: string;
    batch_number: string | null;
    expiry_date: string | null;
    product?: { id: number; name: string; sku: string };
    unit?: { id: number; name: string };
}

interface StockIn {
    id: number;
    invoice_number: string | null;
    status: string;
    total_amount: string;
    payment_status: string;
    received_at: string;
    supplier?: { id: number; name: string };
    warehouse?: { id: number; name: string };
    creator?: { id: number; name: string };
    details: StockInDetail[];
}

interface Props {
    stockIn: StockIn;
}

export default function Show({ stockIn }: Props) {
    return (
        <AdminLayout>
            <Head title={`Detail Barang Masuk #${stockIn.id}`} />

            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="outline" size="icon" asChild>
                            <Link href={stockInRoutes.index.url()}>
                                <ArrowLeft className="h-4 w-4" />
                            </Link>
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold tracking-tight">
                                Detail Barang Masuk
                            </h1>
                            <p className="text-muted-foreground">
                                ID: #{stockIn.id} • Diterima pada{' '}
                                {new Date(stockIn.received_at).toLocaleString(
                                    'id-ID',
                                )}
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" onClick={() => window.print()}>
                        <Printer className="mr-2 h-4 w-4" />
                        Cetak Tanda Terima
                    </Button>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div className="space-y-6 md:col-span-1">
                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Penerimaan</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4 text-sm">
                                <div className="grid grid-cols-2 gap-2">
                                    <span className="text-muted-foreground">
                                        Supplier:
                                    </span>
                                    <span className="text-right font-medium">
                                        {stockIn.supplier?.name || '-'}
                                    </span>

                                    <span className="text-muted-foreground">
                                        Gudang Tujuan:
                                    </span>
                                    <span className="text-right font-medium">
                                        {stockIn.warehouse?.name || '-'}
                                    </span>

                                    <span className="text-muted-foreground">
                                        No. Invoice:
                                    </span>
                                    <span className="text-right font-medium">
                                        {stockIn.invoice_number || '-'}
                                    </span>

                                    <span className="text-muted-foreground">
                                        Status Penerimaan:
                                    </span>
                                    <span className="text-right font-medium uppercase">
                                        {stockIn.status}
                                    </span>

                                    <span className="text-muted-foreground">
                                        Status Pembayaran:
                                    </span>
                                    <span className="text-right font-medium uppercase">
                                        {stockIn.payment_status}
                                    </span>

                                    <span className="text-muted-foreground">
                                        Dibuat Oleh:
                                    </span>
                                    <span className="text-right font-medium">
                                        {stockIn.creator?.name || '-'}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Ringkasan Tagihan</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold">
                                    Rp{' '}
                                    {new Intl.NumberFormat('id-ID').format(
                                        parseFloat(stockIn.total_amount),
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="md:col-span-2">
                        <Card>
                            <CardHeader>
                                <CardTitle>Detail Produk</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto rounded-md border">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>Produk</TableHead>
                                                <TableHead>Qty</TableHead>
                                                <TableHead>Satuan</TableHead>
                                                <TableHead className="text-right">
                                                    Harga Satuan (Rp)
                                                </TableHead>
                                                <TableHead className="text-right">
                                                    Subtotal (Rp)
                                                </TableHead>
                                                <TableHead>Batch</TableHead>
                                                <TableHead>Exp Date</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {stockIn.details.map((detail) => (
                                                <TableRow key={detail.id}>
                                                    <TableCell>
                                                        <div>
                                                            <div className="font-medium">
                                                                {
                                                                    detail
                                                                        .product
                                                                        ?.name
                                                                }
                                                            </div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {
                                                                    detail
                                                                        .product
                                                                        ?.sku
                                                                }
                                                            </div>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {parseFloat(detail.qty)}
                                                    </TableCell>
                                                    <TableCell>
                                                        {detail.unit?.name}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        {new Intl.NumberFormat(
                                                            'id-ID',
                                                        ).format(
                                                            parseFloat(
                                                                detail.purchase_price_per_unit,
                                                            ),
                                                        )}
                                                    </TableCell>
                                                    <TableCell className="text-right font-medium">
                                                        {new Intl.NumberFormat(
                                                            'id-ID',
                                                        ).format(
                                                            parseFloat(
                                                                detail.qty,
                                                            ) *
                                                                parseFloat(
                                                                    detail.purchase_price_per_unit,
                                                                ),
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {detail.batch_number ||
                                                            '-'}
                                                    </TableCell>
                                                    <TableCell>
                                                        {detail.expiry_date
                                                            ? new Date(
                                                                  detail.expiry_date,
                                                              ).toLocaleDateString(
                                                                  'id-ID',
                                                              )
                                                            : '-'}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
