import { Head, Link } from '@inertiajs/react';
import { ReceiptText, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/AdminLayout';

type ReturnRecord = {
    id: number;
    type: 'return' | 'exchange';
    status: string;
    total_refund_amount: string | number;
    created_at: string;
    sale?: { sale_number: string } | null;
    creator?: { name: string } | null;
};

export default function Returns({
    returns,
}: {
    returns: { data: ReturnRecord[]; total?: number };
}) {
    return (
        <AdminLayout title="Retur Penjualan">
            <Head title="Retur Penjualan" />
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-700 uppercase">
                            Penjualan
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
                            Retur penjualan
                        </h1>
                        <p className="mt-1 text-sm text-stone-500">
                            Pantau seluruh pengajuan retur dan penukaran dari
                            transaksi toko ini.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-end gap-2">
                        <Button
                            variant="outline"
                            asChild
                            size="sm"
                            className="h-9"
                        >
                            <Link href="/admin/sales/transactions">
                                <ReceiptText className="mr-2 size-4" /> Riwayat
                                transaksi
                            </Link>
                        </Button>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                    {returns.data.length === 0 ? (
                        <div className="flex flex-col items-center px-6 py-20 text-center">
                            <RotateCcw className="mb-3 size-10 text-muted-foreground/40" />
                            <h2 className="font-semibold text-stone-800">
                                Belum ada retur
                            </h2>
                            <p className="mt-1 text-sm text-stone-500">
                                Pengajuan retur akan muncul setelah dibuat dari
                                transaksi yang telah selesai.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-[#f8faf5] text-xs text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-5 py-4">
                                            Transaksi asal
                                        </th>
                                        <th className="px-5 py-4">Jenis</th>
                                        <th className="px-5 py-4">Status</th>
                                        <th className="px-5 py-4">
                                            Diajukan oleh
                                        </th>
                                        <th className="px-5 py-4 text-right">
                                            Nilai retur
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {returns.data.map((saleReturn) => (
                                        <tr
                                            key={saleReturn.id}
                                            className="hover:bg-lime-50/40"
                                        >
                                            <td className="px-5 py-4 font-bold text-stone-800">
                                                {saleReturn.sale?.sale_number ??
                                                    '—'}
                                            </td>
                                            <td className="px-5 py-4">
                                                {saleReturn.type === 'exchange'
                                                    ? 'Tukar barang'
                                                    : 'Retur'}
                                            </td>
                                            <td className="px-5 py-4 capitalize">
                                                {saleReturn.status.replaceAll(
                                                    '_',
                                                    ' ',
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                {saleReturn.creator?.name ??
                                                    '—'}
                                            </td>
                                            <td className="px-5 py-4 text-right font-bold text-stone-900">
                                                Rp{' '}
                                                {new Intl.NumberFormat(
                                                    'id-ID',
                                                ).format(
                                                    Number(
                                                        saleReturn.total_refund_amount,
                                                    ),
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </AdminLayout>
    );
}
