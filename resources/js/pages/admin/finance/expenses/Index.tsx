import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { PlusCircle, Receipt } from 'lucide-react';
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

interface Expense {
    id: number;
    date: string;
    amount: number;
    notes: string | null;
    expense_category: { name: string } | null;
    cash_account: { name: string } | null;
}

interface Props {
    expenses: {
        data: Expense[];
        current_page: number;
        last_page: number;
        total: number;
    };
    categories: { id: number; name: string }[];
    cashAccounts: { id: number; name: string }[];
}

export default function ExpensesIndex({
    expenses,
    categories,
    cashAccounts,
}: Props) {
    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        expense_category_id: '',
        cash_account_id: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
    });

    const formatRupiah = (value: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(value);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post('/admin/finance/expenses', form, {
            onFinish: () => {
                setIsSubmitting(false);
                setIsOpen(false);
                setForm({
                    expense_category_id: '',
                    cash_account_id: '',
                    amount: '',
                    date: new Date().toISOString().split('T')[0],
                    notes: '',
                });
            },
        });
    };

    const totalExpense = expenses.data.reduce((sum, e) => sum + e.amount, 0);

    return (
        <AdminLayout title="Kas & Pengeluaran">
            <Head title="Kas & Pengeluaran" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-foreground">
                            Kas & Pengeluaran
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Kelola semua pengeluaran operasional toko
                        </p>
                    </div>
                    <Button onClick={() => setIsOpen(true)} className="gap-2">
                        <PlusCircle className="h-4 w-4" />
                        Catat Pengeluaran
                    </Button>
                </div>

                {/* Summary Card */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div className="rounded-xl border border-border bg-card p-5">
                        <p className="mb-1 text-sm text-muted-foreground">
                            Total Pengeluaran (Halaman Ini)
                        </p>
                        <p className="text-2xl font-bold text-destructive">
                            {formatRupiah(totalExpense)}
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-5">
                        <p className="mb-1 text-sm text-muted-foreground">
                            Total Transaksi
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                            {expenses.total}
                        </p>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-5">
                        <p className="mb-1 text-sm text-muted-foreground">
                            Kategori Tersedia
                        </p>
                        <p className="text-2xl font-bold text-foreground">
                            {categories.length}
                        </p>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-hidden rounded-xl border border-border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Tanggal</TableHead>
                                <TableHead>Kategori</TableHead>
                                <TableHead>Akun Kas</TableHead>
                                <TableHead>Keterangan</TableHead>
                                <TableHead className="text-right">
                                    Jumlah
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {expenses.data.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="py-12 text-center text-muted-foreground"
                                    >
                                        <Receipt className="mx-auto mb-3 h-10 w-10 opacity-30" />
                                        <p>Belum ada data pengeluaran</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                expenses.data.map((expense) => (
                                    <TableRow key={expense.id}>
                                        <TableCell className="text-sm">
                                            {format(
                                                new Date(expense.date),
                                                'dd MMM yyyy',
                                                { locale: idLocale },
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm">
                                            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                                                {expense.expense_category
                                                    ?.name ?? '-'}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-sm text-muted-foreground">
                                            {expense.cash_account?.name ?? '-'}
                                        </TableCell>
                                        <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                                            {expense.notes ?? '-'}
                                        </TableCell>
                                        <TableCell className="text-right font-semibold text-destructive">
                                            {formatRupiah(expense.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Pagination */}
                {expenses.last_page > 1 && (
                    <div className="flex justify-center gap-2">
                        {Array.from(
                            { length: expenses.last_page },
                            (_, i) => i + 1,
                        ).map((page) => (
                            <Button
                                key={page}
                                variant={
                                    page === expenses.current_page
                                        ? 'default'
                                        : 'outline'
                                }
                                size="sm"
                                onClick={() =>
                                    router.get(
                                        '/admin/finance/expenses',
                                        { page },
                                        { preserveState: true },
                                    )
                                }
                            >
                                {page}
                            </Button>
                        ))}
                    </div>
                )}
            </div>

            {/* Dialog: Catat Pengeluaran */}
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Catat Pengeluaran Baru</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-1.5">
                            <Label>Kategori Pengeluaran</Label>
                            <select
                                required
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                value={form.expense_category_id}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        expense_category_id: e.target.value,
                                    })
                                }
                            >
                                <option value="">Pilih Kategori</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <Label>Akun Kas</Label>
                            <select
                                required
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                                value={form.cash_account_id}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
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
                            <Label>Tanggal</Label>
                            <Input
                                type="date"
                                required
                                value={form.date}
                                onChange={(e) =>
                                    setForm({ ...form, date: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Jumlah (Rp)</Label>
                            <Input
                                type="number"
                                required
                                min="1"
                                placeholder="0"
                                value={form.amount}
                                onChange={(e) =>
                                    setForm({ ...form, amount: e.target.value })
                                }
                            />
                        </div>

                        <div className="space-y-1.5">
                            <Label>Keterangan</Label>
                            <Input
                                placeholder="Keterangan pengeluaran..."
                                value={form.notes}
                                onChange={(e) =>
                                    setForm({ ...form, notes: e.target.value })
                                }
                            />
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
