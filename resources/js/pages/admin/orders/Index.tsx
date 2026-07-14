import { Link, router } from '@inertiajs/react';
import { Search, ShoppingBag } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import {
    index as orderIndex,
    show as showOrder,
} from '@/actions/App/Domain/Storefront/Controllers/AdminOrderController';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/AdminLayout';

interface OrderSummary {
    id: number;
    order_number: string;
    recipient_name: string;
    recipient_phone: string;
    total_amount: string;
    status: string;
    payment_method: string;
    items_count: number;
    created_at: string;
}

interface Props {
    orders: {
        data: OrderSummary[];
        links: Array<{ url: string | null; label: string; active: boolean }>;
    };
    filters: { status?: string; search?: string };
    statuses: Array<{ value: string; label: string }>;
}

const statusLabels: Record<string, string> = {
    pending_payment: 'Menunggu Pembayaran',
    payment_verification: 'Verifikasi Pembayaran',
    confirmed: 'Dikonfirmasi',
    preparing: 'Disiapkan',
    ready_for_pickup: 'Siap Diambil',
    out_for_delivery: 'Dalam Pengiriman',
    completed: 'Selesai',
    cancelled: 'Dibatalkan',
    refunded: 'Dikembalikan',
};

const statusColors: Record<string, string> = {
    pending_payment: 'bg-yellow-100 text-yellow-800',
    payment_verification: 'bg-amber-100 text-amber-800',
    confirmed: 'bg-lime-100 text-lime-800',
    preparing: 'bg-blue-100 text-blue-800',
    ready_for_pickup: 'bg-indigo-100 text-indigo-800',
    out_for_delivery: 'bg-cyan-100 text-cyan-800',
    completed: 'bg-emerald-100 text-emerald-800',
    cancelled: 'bg-red-100 text-red-700',
    refunded: 'bg-stone-100 text-stone-600',
};

export default function OrderIndex({ orders, filters, statuses }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');

    const filter = (event: FormEvent) => {
        event.preventDefault();
        router.get(
            orderIndex.url(),
            { search, status },
            { preserveState: true, replace: true },
        );
    };

    return (
        <AdminLayout title="Pesanan Online">
            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-700 uppercase">
                            Omnichannel
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight">
                            Pesanan Online
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Verifikasi pembayaran dan pantau proses pemenuhan.
                        </p>
                    </div>
                    <form onSubmit={filter} className="flex flex-wrap gap-2">
                        <Input
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="Nomor, nama, atau telepon"
                            className="w-64 bg-white"
                        />
                        <select
                            value={status}
                            onChange={(event) => setStatus(event.target.value)}
                            className="h-9 rounded-md border bg-white px-3 text-sm"
                        >
                            <option value="">Semua status</option>
                            {statuses.map((item) => (
                                <option key={item.value} value={item.value}>
                                    {statusLabels[item.value] ?? item.label}
                                </option>
                            ))}
                        </select>
                        <Button type="submit" size="sm">
                            <Search className="size-4" /> Cari
                        </Button>
                    </form>
                </div>

                <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                    {orders.data.length === 0 ? (
                        <div className="flex flex-col items-center px-6 py-20 text-center">
                            <ShoppingBag className="mb-3 size-10 text-muted-foreground/40" />
                            <p className="font-semibold">Belum ada pesanan</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Pesanan dari storefront akan muncul di sini.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="border-b bg-[#f8faf5] text-xs text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-5 py-4">Pesanan</th>
                                        <th className="px-5 py-4">Penerima</th>
                                        <th className="px-5 py-4">Status</th>
                                        <th className="px-5 py-4 text-right">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {orders.data.map((order) => (
                                        <tr
                                            key={order.id}
                                            className="hover:bg-lime-50/40"
                                        >
                                            <td className="px-5 py-4">
                                                <Link
                                                    href={showOrder(order.id)}
                                                    className="font-bold hover:text-lime-700"
                                                >
                                                    {order.order_number}
                                                </Link>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {order.items_count} item •{' '}
                                                    {new Date(
                                                        order.created_at,
                                                    ).toLocaleString('id-ID')}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <p className="font-medium">
                                                    {order.recipient_name}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {order.recipient_phone}
                                                </p>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusColors[order.status] ?? 'bg-gray-100 text-gray-700'}`}
                                                >
                                                    {statusLabels[
                                                        order.status
                                                    ] ?? order.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right font-bold">
                                                Rp{' '}
                                                {Number(
                                                    order.total_amount,
                                                ).toLocaleString('id-ID')}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                    {orders.links.map((link) => (
                        <Button
                            key={link.label}
                            variant={link.active ? 'default' : 'outline'}
                            size="sm"
                            disabled={!link.url}
                            asChild={Boolean(link.url)}
                        >
                            {link.url ? (
                                <Link
                                    href={link.url}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label
                                            .replace('&laquo;', '‹')
                                            .replace('&raquo;', '›')
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
        </AdminLayout>
    );
}
