import { Head, Link, router } from '@inertiajs/react';
import {
    FileText,
    ReceiptText,
    Search,
    ShoppingBag,
    ShoppingCart,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/AdminLayout';
import ReturnDialog from './ReturnDialog';

type Transaction = {
    id: number;
    sale_number: string;
    channel: 'pos' | 'online';
    status: 'completed' | 'voided' | 'refunded' | 'partially_refunded';
    payment_status: string;
    total_amount: string | number;
    created_at: string;
    customer?: { name: string; phone?: string | null } | null;
    creator?: { name: string } | null;
};

type TransactionPage = {
    data: Transaction[];
    from?: number;
    to?: number;
    total?: number;
    links: { url: string | null; label: string; active: boolean }[];
};

const transactionStatus: Record<Transaction['status'], string> = {
    completed: 'Selesai',
    voided: 'Dibatalkan',
    refunded: 'Diretur',
    partially_refunded: 'Retur sebagian',
};

export default function Transactions({
    transactions,
    filters,
}: {
    transactions: TransactionPage;
    filters: { search: string; channel: string; status: string };
}) {
    const [search, setSearch] = useState(filters.search);
    const [channel, setChannel] = useState(filters.channel);
    const [status, setStatus] = useState(filters.status);

    const [returnDialogSaleId, setReturnDialogSaleId] = useState<number | null>(
        null,
    );
    const [isReturnDialogOpen, setIsReturnDialogOpen] = useState(false);

    const openReturnDialog = (saleId: number) => {
        setReturnDialogSaleId(saleId);
        setIsReturnDialogOpen(true);
    };

    const applyFilters = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get(
            '/admin/sales/transactions',
            { search, channel, status },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AdminLayout title="Riwayat Transaksi">
            <Head title="Riwayat Transaksi" />
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-700 uppercase">
                            Penjualan
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
                            Riwayat transaksi
                        </h1>
                        <p className="mt-1 text-sm text-stone-500">
                            Satu riwayat untuk transaksi kasir dan pesanan
                            online.
                        </p>
                    </div>
                    <form
                        onSubmit={applyFilters}
                        className="flex flex-wrap items-end gap-2"
                    >
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Cari transaksi atau pelanggan..."
                            className="w-64 bg-white"
                        />
                        <select
                            value={channel}
                            onChange={(event) => setChannel(event.target.value)}
                            className="h-9 rounded-md border border-input bg-white px-3 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <option value="all">Semua kanal</option>
                            <option value="pos">Kasir (POS)</option>
                            <option value="online">Pesanan online</option>
                        </select>
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="h-9 rounded-md border border-input bg-white px-3 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <option value="all">Semua status</option>
                            <option value="completed">Selesai</option>
                            <option value="partially_refunded">
                                Retur sebagian
                            </option>
                            <option value="refunded">Diretur</option>
                            <option value="voided">Dibatalkan</option>
                        </select>
                        <Button type="submit" size="sm" className="h-9">
                            <Search className="mr-2 size-4" /> Cari
                        </Button>
                        <Button
                            variant="outline"
                            asChild
                            size="sm"
                            className="h-9"
                        >
                            <Link href="/admin/pos/sale-returns">
                                <ReceiptText className="mr-2 size-4" /> Retur
                                penjualan
                            </Link>
                        </Button>
                    </form>
                </div>

                <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                    {transactions.data.length === 0 ? (
                        <div className="flex flex-col items-center px-6 py-20 text-center">
                            <FileText className="mb-3 size-10 text-muted-foreground/40" />
                            <h2 className="font-semibold text-stone-800">
                                Belum ada transaksi
                            </h2>
                            <p className="mt-1 text-sm text-stone-500">
                                Transaksi kasir dan pesanan online yang telah
                                dikonfirmasi akan tampil di sini.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-[#f8faf5] text-xs text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-5 py-4">Transaksi</th>
                                        <th className="px-5 py-4">Kanal</th>
                                        <th className="px-5 py-4">Pelanggan</th>
                                        <th className="px-5 py-4">Status</th>
                                        <th className="px-5 py-4">
                                            Pembayaran
                                        </th>
                                        <th className="px-5 py-4 text-right">
                                            Total
                                        </th>
                                        <th className="px-5 py-4 text-right">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {transactions.data.map((transaction) => (
                                        <tr
                                            key={transaction.id}
                                            className="hover:bg-lime-50/40"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-stone-800">
                                                    {transaction.sale_number}
                                                </p>
                                                <p className="mt-1 text-xs text-stone-500">
                                                    {transaction.created_at
                                                        ? new Date(
                                                              transaction.created_at,
                                                          ).toLocaleString(
                                                              'id-ID',
                                                          )
                                                        : '—'}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1.5 font-medium text-stone-700">
                                                    {transaction.channel ===
                                                    'online' ? (
                                                        <ShoppingBag className="size-4 text-lime-700" />
                                                    ) : (
                                                        <ShoppingCart className="size-4 text-lime-700" />
                                                    )}
                                                    {transaction.channel ===
                                                    'online'
                                                        ? 'Online'
                                                        : 'Kasir'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-medium text-stone-800">
                                                    {transaction.customer
                                                        ?.name ??
                                                        'Pelanggan umum'}
                                                </p>
                                                {transaction.customer
                                                    ?.phone && (
                                                    <p className="text-xs text-stone-500">
                                                        {
                                                            transaction.customer
                                                                .phone
                                                        }
                                                    </p>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex rounded-full bg-stone-100 px-2.5 py-1 text-xs font-semibold text-stone-700">
                                                    {
                                                        transactionStatus[
                                                            transaction.status
                                                        ]
                                                    }
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-stone-600 capitalize">
                                                {transaction.payment_status}
                                            </td>
                                            <td className="px-5 py-4 text-right font-bold text-stone-900">
                                                Rp{' '}
                                                {new Intl.NumberFormat(
                                                    'id-ID',
                                                ).format(
                                                    Number(
                                                        transaction.total_amount,
                                                    ),
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                {(transaction.status ===
                                                    'completed' ||
                                                    transaction.status ===
                                                        'partially_refunded') && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            openReturnDialog(
                                                                transaction.id,
                                                            )
                                                        }
                                                    >
                                                        Retur
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {transactions.links.map((link, index) => (
                        <Button
                            key={`${link.label}-${index}`}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={!link.url}
                            asChild={Boolean(link.url)}
                        >
                            {link.url ? (
                                <Link
                                    href={link.url}
                                    preserveScroll
                                    dangerouslySetInnerHTML={{
                                        __html: link.label
                                            .replace('&laquo;', '‹')
                                            .replace('&raquo;', '›')
                                            .replace('Previous', 'Sebelumnya')
                                            .replace('Next', 'Berikutnya')
                                            .replace(
                                                'pagination.previous',
                                                '‹ Sebelumnya',
                                            )
                                            .replace(
                                                'pagination.next',
                                                'Berikutnya ›',
                                            ),
                                    }}
                                />
                            ) : (
                                <span
                                    dangerouslySetInnerHTML={{
                                        __html: link.label
                                            .replace('&laquo;', '‹')
                                            .replace('&raquo;', '›')
                                            .replace('Previous', 'Sebelumnya')
                                            .replace('Next', 'Berikutnya')
                                            .replace(
                                                'pagination.previous',
                                                '‹ Sebelumnya',
                                            )
                                            .replace(
                                                'pagination.next',
                                                'Berikutnya ›',
                                            ),
                                    }}
                                />
                            )}
                        </Button>
                    ))}
                </div>
            </div>

            <ReturnDialog
                saleId={returnDialogSaleId}
                isOpen={isReturnDialogOpen}
                onOpenChange={setIsReturnDialogOpen}
            />
        </AdminLayout>
    );
}
