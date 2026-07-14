import { Head } from '@inertiajs/react';
import { useForm } from '@inertiajs/react';
import { PackageOpen, CreditCard, Calendar } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/AdminLayout';

interface Debt {
    id: number;
    invoice_number: string;
    supplier?: { name: string };
    total_amount: number;
    paid_amount: number;
    due_date: string;
    payment_status: string;
    created_at: string;
}

export default function SupplierDebts({
    debts,
}: {
    debts: { data: Debt[]; current_page: number; last_page: number };
}) {
    const [selectedDebt, setSelectedDebt] = useState<Debt | null>(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        amount: '',
        payment_date: new Date().toISOString().slice(0, 10),
        payment_method: 'transfer',
        reference_number: '',
        notes: '',
    });

    const handlePay = (e: React.FormEvent) => {
        e.preventDefault();

        if (!selectedDebt) {
            return;
        }

        post(`/admin/inventory/supplier-debts/${selectedDebt.id}/pay`, {
            onSuccess: () => {
                setSelectedDebt(null);
                reset();
            },
        });
    };

    return (
        <AdminLayout title="Hutang Supplier">
            <Head title="Hutang Supplier" />

            <div className="space-y-5 p-4 sm:p-6 lg:p-8">
                <header className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 sm:flex-row sm:items-center sm:p-6">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-700 uppercase">
                            Keuangan & Persediaan
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-800">
                            Hutang Supplier
                        </h1>
                        <p className="mt-1 text-sm text-stone-500">
                            Kelola pembayaran faktur penerimaan barang yang
                            belum lunas.
                        </p>
                    </div>
                </header>

                <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                    {debts.data.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-stone-50 hover:bg-stone-50">
                                        <TableHead>Invoice</TableHead>
                                        <TableHead>Supplier</TableHead>
                                        <TableHead>
                                            Tanggal Jatuh Tempo
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Total Tagihan
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Sisa Hutang
                                        </TableHead>
                                        <TableHead className="text-right">
                                            Tindakan
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {debts.data.map((debt) => {
                                        const sisa =
                                            debt.total_amount -
                                            debt.paid_amount;
                                        const isOverdue =
                                            new Date(debt.due_date) <
                                            new Date();

                                        return (
                                            <TableRow key={debt.id}>
                                                <TableCell>
                                                    <div className="font-semibold text-stone-800">
                                                        {debt.invoice_number ||
                                                            `PB-${debt.id}`}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {debt.supplier?.name ?? '—'}
                                                </TableCell>
                                                <TableCell>
                                                    <div
                                                        className={`inline-flex items-center gap-1.5 ${isOverdue ? 'font-medium text-red-600' : 'text-stone-600'}`}
                                                    >
                                                        <Calendar className="size-4" />
                                                        {debt.due_date
                                                            ? new Date(
                                                                  debt.due_date,
                                                              ).toLocaleDateString(
                                                                  'id-ID',
                                                              )
                                                            : 'Tidak diatur'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    Rp{' '}
                                                    {Number(
                                                        debt.total_amount,
                                                    ).toLocaleString('id-ID')}
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-red-600">
                                                    Rp{' '}
                                                    {sisa.toLocaleString(
                                                        'id-ID',
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedDebt(
                                                                debt,
                                                            );
                                                            setData(
                                                                'amount',
                                                                sisa.toString(),
                                                            );
                                                        }}
                                                    >
                                                        <CreditCard className="mr-2 size-4" />
                                                        Bayar
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    ) : (
                        <div className="grid min-h-72 place-items-center p-8 text-center">
                            <div>
                                <span className="mx-auto grid size-12 place-items-center rounded-xl border border-lime-200 bg-lime-50 text-lime-700">
                                    <PackageOpen className="size-6" />
                                </span>
                                <h2 className="mt-4 font-bold text-stone-800">
                                    Semua Hutang Lunas
                                </h2>
                                <p className="mt-1 max-w-sm text-sm text-stone-500">
                                    Tidak ada faktur penerimaan barang yang
                                    berstatus hutang.
                                </p>
                            </div>
                        </div>
                    )}
                </section>
            </div>

            <Dialog
                open={!!selectedDebt}
                onOpenChange={(open) => !open && setSelectedDebt(null)}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Pembayaran Hutang</DialogTitle>
                        <DialogDescription>
                            Invoice{' '}
                            {selectedDebt?.invoice_number ||
                                `PB-${selectedDebt?.id}`}{' '}
                            - {selectedDebt?.supplier?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handlePay} className="space-y-4">
                        <div className="space-y-2">
                            <Label>Metode Pembayaran</Label>
                            <Select
                                value={data.payment_method}
                                onValueChange={(v) =>
                                    setData('payment_method', v)
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="transfer">
                                        Transfer Bank
                                    </SelectItem>
                                    <SelectItem value="cash">Tunai</SelectItem>
                                    <SelectItem value="qris">QRIS</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.payment_method && (
                                <p className="text-sm text-red-500">
                                    {errors.payment_method}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Nominal Pembayaran</Label>
                            <Input
                                type="text"
                                value={
                                    data.amount
                                        ? new Intl.NumberFormat('id-ID').format(
                                              Number(data.amount),
                                          )
                                        : ''
                                }
                                onChange={(e) => {
                                    const raw = e.target.value.replace(
                                        /\D/g,
                                        '',
                                    );
                                    setData('amount', raw);
                                }}
                            />
                            {errors.amount && (
                                <p className="text-sm text-red-500">
                                    {errors.amount}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Tanggal Pembayaran</Label>
                            <Input
                                type="date"
                                value={data.payment_date}
                                onChange={(e) =>
                                    setData('payment_date', e.target.value)
                                }
                            />
                            {errors.payment_date && (
                                <p className="text-sm text-red-500">
                                    {errors.payment_date}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Nomor Referensi (Opsional)</Label>
                            <Input
                                value={data.reference_number}
                                onChange={(e) =>
                                    setData('reference_number', e.target.value)
                                }
                                placeholder="Mis. nomor mutasi"
                            />
                            {errors.reference_number && (
                                <p className="text-sm text-red-500">
                                    {errors.reference_number}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label>Catatan (Opsional)</Label>
                            <Textarea
                                value={data.notes}
                                onChange={(e) =>
                                    setData('notes', e.target.value)
                                }
                            />
                            {errors.notes && (
                                <p className="text-sm text-red-500">
                                    {errors.notes}
                                </p>
                            )}
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setSelectedDebt(null)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing}
                                className="bg-lime-600 text-white hover:bg-lime-700"
                            >
                                {processing
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
