import { Head, router } from '@inertiajs/react';
import { CreditCard } from 'lucide-react';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
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

interface Receivable {
    id: number;
    amount: number;
    paid_amount: number;
    due_date: string | null;
    status: 'unpaid' | 'partial' | 'paid';
    customer: { name: string } | null;
    sale: { invoice_number: string } | null;
}

interface Props {
    receivables: {
        data: Receivable[];
        current_page: number;
        last_page: number;
        total: number;
    };
    cashAccounts: { id: number; name: string }[];
}

const statusConfig = {
    unpaid: {
        label: 'Belum Bayar',
        className: 'bg-destructive/10 text-destructive',
    },
    partial: {
        label: 'Sebagian',
        className: 'bg-yellow-500/10 text-yellow-700',
    },
    paid: { label: 'Lunas', className: 'bg-green-500/10 text-green-700' },
};

export default function ReceivablesIndex({ receivables, cashAccounts }: Props) {
    const [payDialog, setPayDialog] = useState<{
        open: boolean;
        receivable: Receivable | null;
    }>({ open: false, receivable: null });
    const [payForm, setPayForm] = useState({ amount: '', cash_account_id: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const formatRupiah = (value: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(value);

    const openPayDialog = (receivable: Receivable) => {
        setPayDialog({ open: true, receivable });
        setPayForm({
            amount: String(receivable.amount - receivable.paid_amount),
            cash_account_id: '',
        });
    };

    const handlePay = (e: React.FormEvent) => {
        e.preventDefault();

        if (!payDialog.receivable) {
            return;
        }

        setIsSubmitting(true);
        router.post(
            `/admin/finance/receivables/${payDialog.receivable.id}/payment`,
            payForm,
            {
                onFinish: () => {
                    setIsSubmitting(false);
                    setPayDialog({ open: false, receivable: null });
                },
            },
        );
    };

    const totalUnpaid = receivables.data
        .filter((r) => r.status !== 'paid')
        .reduce((sum, r) => sum + (r.amount - r.paid_amount), 0);

    return (
        <AdminLayout title="Piutang & Hutang">
            <Head title="Piutang & Hutang" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Piutang Pelanggan
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Pantau dan catat pembayaran piutang pelanggan
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-5">
                        <p className="mb-1 text-sm text-muted-foreground">
                            Total Piutang Belum Lunas
                        </p>
                        <p className="text-2xl font-bold text-orange-600">
                            {formatRupiah(totalUnpaid)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-5">
                        <p className="mb-1 text-sm text-muted-foreground">
                            Total Transaksi
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                            {receivables.total}
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-5">
                        <p className="mb-1 text-sm text-muted-foreground">
                            Sudah Lunas
                        </p>
                        <p className="text-2xl font-bold text-green-600">
                            {
                                receivables.data.filter(
                                    (r) => r.status === 'paid',
                                ).length
                            }
                        </p>
                    </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Pelanggan</TableHead>
                                <TableHead>Invoice</TableHead>
                                <TableHead>Total Piutang</TableHead>
                                <TableHead>Sudah Dibayar</TableHead>
                                <TableHead>Sisa</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {receivables.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="py-12 text-center text-muted-foreground"
                                    >
                                        <CreditCard className="mx-auto mb-3 h-10 w-10 opacity-30" />
                                        <p>Belum ada data piutang</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                receivables.data.map((receivable) => {
                                    const remaining =
                                        receivable.amount -
                                        receivable.paid_amount;
                                    const status =
                                        statusConfig[receivable.status];

                                    return (
                                        <TableRow key={receivable.id}>
                                            <TableCell className="font-medium">
                                                {receivable.customer?.name ??
                                                    '-'}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {receivable.sale
                                                    ?.invoice_number ?? '-'}
                                            </TableCell>
                                            <TableCell>
                                                {formatRupiah(
                                                    receivable.amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="text-green-600">
                                                {formatRupiah(
                                                    receivable.paid_amount,
                                                )}
                                            </TableCell>
                                            <TableCell className="font-semibold text-orange-600">
                                                {formatRupiah(remaining)}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${status.className}`}
                                                >
                                                    {status.label}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                {receivable.status !==
                                                    'paid' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() =>
                                                            openPayDialog(
                                                                receivable,
                                                            )
                                                        }
                                                    >
                                                        Bayar
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog
                open={payDialog.open}
                onOpenChange={(open) => setPayDialog({ ...payDialog, open })}
            >
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Catat Pembayaran Piutang</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handlePay} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Akun Kas Penerima</Label>
                            <select
                                required
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                value={payForm.cash_account_id}
                                onChange={(e) =>
                                    setPayForm({
                                        ...payForm,
                                        cash_account_id: e.target.value,
                                    })
                                }
                            >
                                <option value="">Pilih Akun</option>
                                {cashAccounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label>Jumlah Pembayaran (Rp)</Label>
                            <Input
                                type="number"
                                required
                                min="1"
                                value={payForm.amount}
                                onChange={(e) =>
                                    setPayForm({
                                        ...payForm,
                                        amount: e.target.value,
                                    })
                                }
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    setPayDialog({
                                        open: false,
                                        receivable: null,
                                    })
                                }
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting
                                    ? 'Memproses...'
                                    : 'Simpan Pembayaran'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
