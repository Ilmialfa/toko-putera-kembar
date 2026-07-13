import { useForm } from '@inertiajs/react';
import {
    ArrowDownLeft,
    ArrowUpRight,
    Landmark,
    Plus,
    ReceiptText,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
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
import AdminLayout from '@/layouts/AdminLayout';

const money = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});
export default function FinanceOperations({
    accounts,
    movements,
    payables,
    receivables,
    journals,
}: any) {
    const [movementOpen, setMovementOpen] = useState(false);
    const [payable, setPayable] = useState<any>(null);
    const movement = useForm({
        cash_account_id: accounts[0]?.id ?? '',
        type: 'in',
        amount: '',
        reason: '',
    });
    const payment = useForm({
        cash_account_id: accounts[0]?.id ?? '',
        amount: '',
        paid_at: new Date().toISOString().slice(0, 16),
    });
    const submitMovement = (event: FormEvent) => {
        event.preventDefault();
        movement.post('/admin/finance/cash-movements', {
            onSuccess: () => {
                setMovementOpen(false);
                movement.reset('amount', 'reason');
            },
        });
    };
    const submitPayment = (event: FormEvent) => {
        event.preventDefault();

        if (!payable) {
            return;
        }

        payment.post(`/admin/finance/payables/${payable.id}/payment`, {
            onSuccess: () => {
                setPayable(null);
                payment.reset('amount');
            },
        });
    };

    return (
        <AdminLayout title="Kas, Bank & Hutang">
            <div className="space-y-6 p-4 md:p-8">
                <header className="flex flex-col justify-between gap-4 rounded-2xl bg-stone-950 p-6 text-white md:flex-row md:items-center">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-400 uppercase">
                            Finance workspace
                        </p>
                        <h2 className="mt-1 text-2xl font-bold">
                            Kas, bank, hutang & jurnal
                        </h2>
                        <p className="mt-1 text-sm text-stone-400">
                            Pembayaran hutang otomatis membentuk mutasi kas dan
                            jurnal double-entry.
                        </p>
                    </div>
                    <Button
                        onClick={() => setMovementOpen(true)}
                        className="bg-lime-400 text-stone-950 hover:bg-lime-300"
                    >
                        <Plus className="mr-2 size-4" />
                        Mutasi manual
                    </Button>
                </header>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {accounts.map((account: any) => (
                        <div
                            key={account.id}
                            className="rounded-2xl border bg-white p-5"
                        >
                            <div className="flex items-center justify-between">
                                <span className="flex size-10 items-center justify-center rounded-xl bg-lime-100 text-lime-800">
                                    <Landmark className="size-5" />
                                </span>
                                <span className="rounded-full bg-stone-100 px-2 py-1 text-xs uppercase">
                                    {account.type}
                                </span>
                            </div>
                            <p className="mt-4 text-sm text-stone-500">
                                {account.name}
                            </p>
                            <p className="mt-1 text-2xl font-bold">
                                {money.format(account.calculated_balance)}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                    <Section title="Hutang supplier">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-stone-500 uppercase">
                                    <th className="py-3">Supplier</th>
                                    <th>Sisa</th>
                                    <th>Jatuh tempo</th>
                                    <th />
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {payables.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="py-3 font-semibold">
                                            {item.supplier?.name}
                                        </td>
                                        <td>
                                            {money.format(
                                                Number(item.amount) -
                                                    Number(item.paid_amount),
                                            )}
                                        </td>
                                        <td>{item.due_date}</td>
                                        <td className="text-right">
                                            {item.status !== 'paid' && (
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        setPayable(item);
                                                        payment.setData(
                                                            'amount',
                                                            String(
                                                                Number(
                                                                    item.amount,
                                                                ) -
                                                                    Number(
                                                                        item.paid_amount,
                                                                    ),
                                                            ),
                                                        );
                                                    }}
                                                >
                                                    Bayar
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Section>
                    <Section title="Piutang pelanggan">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-xs text-stone-500 uppercase">
                                    <th className="py-3">Pelanggan</th>
                                    <th>Sisa</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {receivables.map((item: any) => (
                                    <tr key={item.id}>
                                        <td className="py-3 font-semibold">
                                            {item.customer?.name}
                                        </td>
                                        <td>
                                            {money.format(
                                                Number(item.amount) -
                                                    Number(item.paid_amount),
                                            )}
                                        </td>
                                        <td>{item.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Section>
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                    <Section title="Mutasi terbaru">
                        <div className="space-y-2">
                            {movements.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-3 rounded-xl bg-stone-50 p-3"
                                >
                                    <span
                                        className={`flex size-9 items-center justify-center rounded-lg ${item.type === 'in' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}
                                    >
                                        {item.type === 'in' ? (
                                            <ArrowDownLeft className="size-4" />
                                        ) : (
                                            <ArrowUpRight className="size-4" />
                                        )}
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-semibold">
                                            {item.reason}
                                        </p>
                                        <p className="text-xs text-stone-500">
                                            {item.cash_account?.name}
                                        </p>
                                    </div>
                                    <span className="font-semibold">
                                        {item.type === 'in' ? '+' : '-'}
                                        {money.format(item.amount)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Section>
                    <Section title="Jurnal terbaru">
                        <div className="space-y-2">
                            {journals.map((journal: any) => (
                                <details
                                    key={journal.id}
                                    className="rounded-xl border bg-stone-50 p-3"
                                >
                                    <summary className="cursor-pointer text-sm font-semibold">
                                        {journal.description} ·{' '}
                                        {journal.entry_date}
                                    </summary>
                                    <div className="mt-3 space-y-1 text-xs">
                                        {journal.lines.map((line: any) => (
                                            <div
                                                key={line.id}
                                                className="flex justify-between"
                                            >
                                                <span>
                                                    {
                                                        line.chart_of_account
                                                            ?.code
                                                    }{' '}
                                                    —{' '}
                                                    {
                                                        line.chart_of_account
                                                            ?.name
                                                    }
                                                </span>
                                                <span>
                                                    D {money.format(line.debit)}{' '}
                                                    · K{' '}
                                                    {money.format(line.credit)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </Section>
                </div>
            </div>
            <Dialog open={movementOpen} onOpenChange={setMovementOpen}>
                <DialogContent>
                    <form onSubmit={submitMovement}>
                        <DialogHeader>
                            <DialogTitle>Mutasi kas/bank manual</DialogTitle>
                            <DialogDescription>
                                Gunakan untuk setor modal, transfer antar-kas,
                                atau pengeluaran yang bukan expense.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-5">
                            <Select
                                label="Akun"
                                value={movement.data.cash_account_id}
                                options={accounts}
                                onChange={(value) =>
                                    movement.setData('cash_account_id', value)
                                }
                            />
                            <Select
                                label="Jenis"
                                value={movement.data.type}
                                options={[
                                    { id: 'in', name: 'Kas masuk' },
                                    { id: 'out', name: 'Kas keluar' },
                                ]}
                                onChange={(value) =>
                                    movement.setData('type', String(value))
                                }
                            />
                            <Input
                                type="number"
                                min="1"
                                value={movement.data.amount}
                                onChange={(e) =>
                                    movement.setData('amount', e.target.value)
                                }
                                placeholder="Nominal"
                            />
                            <Input
                                value={movement.data.reason}
                                onChange={(e) =>
                                    movement.setData('reason', e.target.value)
                                }
                                placeholder="Keterangan"
                            />
                        </div>
                        <DialogFooter>
                            <Button disabled={movement.processing}>
                                Simpan mutasi
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <Dialog
                open={Boolean(payable)}
                onOpenChange={(value) => !value && setPayable(null)}
            >
                <DialogContent>
                    <form onSubmit={submitPayment}>
                        <DialogHeader>
                            <DialogTitle>
                                Bayar hutang {payable?.supplier?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Sisa hutang{' '}
                                {money.format(
                                    Number(payable?.amount ?? 0) -
                                        Number(payable?.paid_amount ?? 0),
                                )}
                                .
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-5">
                            <Select
                                label="Sumber dana"
                                value={payment.data.cash_account_id}
                                options={accounts}
                                onChange={(value) =>
                                    payment.setData('cash_account_id', value)
                                }
                            />
                            <Input
                                type="number"
                                min="1"
                                value={payment.data.amount}
                                onChange={(e) =>
                                    payment.setData('amount', e.target.value)
                                }
                            />
                            <Input
                                type="datetime-local"
                                value={payment.data.paid_at}
                                onChange={(e) =>
                                    payment.setData('paid_at', e.target.value)
                                }
                            />
                        </div>
                        <DialogFooter>
                            <Button disabled={payment.processing}>
                                <ReceiptText className="mr-2 size-4" />
                                Catat pembayaran
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
function Section({
    title,
    children,
}: {
    title: string;
    children: React.ReactNode;
}) {
    return (
        <section className="overflow-hidden rounded-2xl border bg-white p-5">
            <h3 className="mb-3 font-bold">{title}</h3>
            <div className="overflow-x-auto">{children}</div>
        </section>
    );
}
function Select({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string | number;
    options: any[];
    onChange: (value: string | number) => void;
}) {
    return (
        <div>
            <Label>{label}</Label>
            <select
                className="mt-1 h-10 w-full rounded-md border px-3"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            >
                {options.map((option) => (
                    <option key={option.id} value={option.id}>
                        {option.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
