import { Form, Head } from '@inertiajs/react';
import { Clock3, LogOut, PackageCheck } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import StorefrontLayout from '@/layouts/StorefrontLayout';

interface Order {
    id: number;
    order_number: string;
    status: string;
    total_amount: string;
    created_at: string;
}

export default function Account({ orders }: { orders: Order[] }) {
    return (
        <StorefrontLayout>
            <Head title="Akun Saya" />
            <main className="mx-auto max-w-5xl px-4 py-10">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-primary uppercase">
                            Akun pelanggan
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight">
                            Pesanan saya
                        </h1>
                    </div>
                    <Form action="/akun/keluar" method="post">
                        <Button variant="outline">
                            <LogOut className="size-4" /> Keluar
                        </Button>
                    </Form>
                </div>

                <section className="mt-8 space-y-3">
                    {orders.length === 0 ? (
                        <div className="rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
                            <PackageCheck className="mx-auto size-10 text-primary" />
                            <h2 className="mt-4 text-lg font-bold">
                                Belum ada pesanan
                            </h2>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Pesanan online Anda akan tampil dan dapat
                                dilacak di sini.
                            </p>
                        </div>
                    ) : (
                        orders.map((order) => (
                            <article
                                key={order.id}
                                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5"
                            >
                                <div>
                                    <p className="font-bold">
                                        {order.order_number}
                                    </p>
                                    <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                                        <Clock3 className="size-3" />{' '}
                                        {new Date(
                                            order.created_at,
                                        ).toLocaleString('id-ID')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <Badge>
                                        {order.status.replaceAll('_', ' ')}
                                    </Badge>
                                    <p className="mt-2 font-bold tabular-nums">
                                        {new Intl.NumberFormat('id-ID', {
                                            style: 'currency',
                                            currency: 'IDR',
                                            maximumFractionDigits: 0,
                                        }).format(Number(order.total_amount))}
                                    </p>
                                </div>
                            </article>
                        ))
                    )}
                </section>
            </main>
        </StorefrontLayout>
    );
}
