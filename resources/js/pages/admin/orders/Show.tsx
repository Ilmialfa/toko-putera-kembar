import { Link, router } from '@inertiajs/react';
import { ArrowLeft, FileCheck2, MapPin, PackageCheck } from 'lucide-react';
import { useState } from 'react';
import {
    confirm as confirmOrder,
    index as orderIndex,
    paymentProof,
    updateStatus,
} from '@/actions/App/Domain/Storefront/Controllers/AdminOrderController';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/AdminLayout';

interface Props {
    order: {
        id: number;
        order_number: string;
        recipient_name: string;
        recipient_phone: string;
        delivery_address: string;
        distance_km: string;
        subtotal: string;
        delivery_fee: string;
        total_amount: string;
        payment_method: string;
        payment_proof_path: string | null;
        status: string;
        items: Array<{
            id: number;
            qty: string;
            price_per_unit: string;
            subtotal: string;
            product: { name: string; sku: string };
            unit: { name: string };
        }>;
        status_histories: Array<{
            id: number;
            status: string;
            notes: string | null;
            created_at: string;
            changed_by: { name: string } | null;
        }>;
    };
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
};

const nextStatuses: Record<string, string[]> = {
    confirmed: ['preparing'],
    preparing: ['ready_for_pickup'],
    ready_for_pickup: ['out_for_delivery', 'completed'],
    out_for_delivery: ['completed'],
    pending_payment: ['cancelled'],
    payment_verification: ['cancelled'],
};

export default function OrderShow({ order }: Props) {
    const [processing, setProcessing] = useState(false);

    const confirm = () => {
        setProcessing(true);
        router.post(
            confirmOrder(order.id).url,
            {},
            { onFinish: () => setProcessing(false) },
        );
    };

    const changeStatus = (status: string) => {
        router.patch(updateStatus(order.id).url, { status });
    };

    return (
        <AdminLayout title={`Pesanan ${order.order_number}`}>
            <div className="p-4 sm:p-6 lg:p-8">
                <Link
                    href={orderIndex()}
                    className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                    <ArrowLeft className="size-4" /> Kembali ke pesanan
                </Link>
                <div className="mb-6 flex flex-col justify-between gap-4 rounded-2xl bg-[#171a15] p-6 text-white sm:flex-row sm:items-center">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-400 uppercase">
                            Detail pesanan
                        </p>
                        <h1 className="mt-2 text-2xl font-bold">
                            {order.order_number}
                        </h1>
                        <p className="mt-1 text-sm text-white/55">
                            {statusLabels[order.status] ?? order.status}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {order.payment_proof_path && (
                            <Button
                                variant="outline"
                                className="border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                                asChild
                            >
                                <a href={paymentProof(order.id).url}>
                                    <FileCheck2 className="size-4" /> Lihat
                                    Bukti
                                </a>
                            </Button>
                        )}
                        {order.status === 'payment_verification' && (
                            <Button onClick={confirm} disabled={processing}>
                                <PackageCheck className="size-4" />{' '}
                                {processing
                                    ? 'Memproses...'
                                    : 'Verifikasi & Konfirmasi'}
                            </Button>
                        )}
                        {(nextStatuses[order.status] ?? []).map((status) => (
                            <Button
                                key={status}
                                variant="secondary"
                                onClick={() => changeStatus(status)}
                            >
                                {statusLabels[status]}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="overflow-hidden rounded-2xl border bg-white shadow-sm lg:col-span-2">
                        <div className="border-b px-5 py-4">
                            <h2 className="font-bold">Item Pesanan</h2>
                        </div>
                        <div className="divide-y">
                            {order.items.map((item) => (
                                <div
                                    key={item.id}
                                    className="flex items-center justify-between gap-4 px-5 py-4"
                                >
                                    <div>
                                        <p className="font-semibold">
                                            {item.product.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {item.product.sku} •{' '}
                                            {Number(item.qty).toLocaleString(
                                                'id-ID',
                                            )}{' '}
                                            {item.unit.name}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold">
                                            Rp{' '}
                                            {Number(
                                                item.subtotal,
                                            ).toLocaleString('id-ID')}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            @ Rp{' '}
                                            {Number(
                                                item.price_per_unit,
                                            ).toLocaleString('id-ID')}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2 border-t bg-[#f8faf5] px-5 py-4 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>
                                    Rp{' '}
                                    {Number(order.subtotal).toLocaleString(
                                        'id-ID',
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Ongkir</span>
                                <span>
                                    Rp{' '}
                                    {Number(order.delivery_fee).toLocaleString(
                                        'id-ID',
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between border-t pt-3 text-lg font-bold">
                                <span>Total</span>
                                <span>
                                    Rp{' '}
                                    {Number(order.total_amount).toLocaleString(
                                        'id-ID',
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-2xl border bg-white p-5 shadow-sm">
                            <h2 className="mb-4 flex items-center gap-2 font-bold">
                                <MapPin className="size-4 text-lime-700" />{' '}
                                Pengiriman
                            </h2>
                            <p className="font-semibold">
                                {order.recipient_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                                {order.recipient_phone}
                            </p>
                            <p className="mt-3 text-sm leading-6">
                                {order.delivery_address}
                            </p>
                            <p className="mt-2 text-xs text-muted-foreground">
                                Jarak {order.distance_km} km
                            </p>
                        </div>
                        <div className="rounded-2xl border bg-white p-5 shadow-sm">
                            <h2 className="mb-4 font-bold">Riwayat Status</h2>
                            <div className="space-y-4">
                                {order.status_histories.map((history) => (
                                    <div
                                        key={history.id}
                                        className="border-l-2 border-lime-400 pl-3"
                                    >
                                        <p className="text-sm font-semibold">
                                            {statusLabels[history.status] ??
                                                history.status}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(
                                                history.created_at,
                                            ).toLocaleString('id-ID')}{' '}
                                            {history.changed_by
                                                ? `• ${history.changed_by.name}`
                                                : ''}
                                        </p>
                                        {history.notes && (
                                            <p className="mt-1 text-xs">
                                                {history.notes}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
