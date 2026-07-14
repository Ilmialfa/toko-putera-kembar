import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, MapPin, PackageCheck, ReceiptText } from 'lucide-react';

import StorefrontLayout from '@/layouts/StorefrontLayout';

const money = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

export default function OrderDetail({ order }: any) {
    return (
        <StorefrontLayout title={`Pesanan ${order.order_number}`}>
            <Head>
                <meta name="robots" content="noindex" />
            </Head>
            <main className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
                <Link
                    href="/akun"
                    className="inline-flex items-center gap-2 text-sm font-bold text-lime-700"
                >
                    <ArrowLeft className="size-4" />
                    Kembali ke akun
                </Link>
                <section className="mt-5 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                            <p className="text-xs font-bold tracking-[0.14em] text-stone-500 uppercase">
                                Pesanan
                            </p>
                            <h1 className="mt-2 text-2xl font-black">
                                {order.order_number}
                            </h1>
                            <p className="mt-2 text-sm text-stone-500">
                                Dibuat{' '}
                                {new Date(order.created_at).toLocaleString(
                                    'id-ID',
                                )}
                            </p>
                        </div>
                        <span className="rounded-full border border-lime-300 bg-white px-3 py-1.5 text-sm font-bold text-lime-800">
                            {order.status.replaceAll('_', ' ')}
                        </span>
                    </div>
                    <div className="mt-8 divide-y divide-stone-100 border-y border-stone-100">
                        {order.items.map((item: any) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between gap-4 py-4"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="grid size-11 place-items-center rounded-xl bg-stone-50">
                                        <PackageCheck className="size-5 text-lime-700" />
                                    </div>
                                    <div>
                                        <p className="font-bold">
                                            {item.product?.name ?? 'Produk'}
                                        </p>
                                        <p className="mt-1 text-xs text-stone-500">
                                            {item.qty} {item.unit?.symbol ?? ''}{' '}
                                            ×{' '}
                                            {money.format(
                                                Number(item.price_per_unit),
                                            )}
                                        </p>
                                    </div>
                                </div>
                                <p className="font-black">
                                    {money.format(Number(item.subtotal))}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-6 space-y-2 text-sm">
                        <div className="flex justify-between text-stone-600">
                            <span>Subtotal</span>
                            <span>{money.format(Number(order.subtotal))}</span>
                        </div>
                        <div className="flex justify-between text-stone-600">
                            <span>Ongkir</span>
                            <span>
                                {money.format(Number(order.delivery_fee))}
                            </span>
                        </div>
                        <div className="flex justify-between border-t border-stone-200 pt-3 text-lg font-black">
                            <span>Total</span>
                            <span className="text-lime-700">
                                {money.format(Number(order.total_amount))}
                            </span>
                        </div>
                    </div>
                </section>
                {order.address && (
                    <section className="mt-5 rounded-2xl border border-stone-200 bg-stone-50 p-5">
                        <div className="flex gap-3">
                            <MapPin className="size-5 shrink-0 text-lime-700" />
                            <div>
                                <p className="font-black">Alamat pengantaran</p>
                                <p className="mt-2 text-sm font-semibold">
                                    {order.address.recipient_name} ·{' '}
                                    {order.address.phone}
                                </p>
                                <p className="mt-1 text-sm leading-6 text-stone-600">
                                    {order.address.full_address}
                                </p>
                            </div>
                        </div>
                    </section>
                )}
                <section className="mt-5 rounded-2xl border border-stone-200 bg-white p-5">
                    <div className="flex items-center gap-3">
                        <ReceiptText className="size-5 text-lime-700" />
                        <div>
                            <h2 className="font-black">Status pesanan</h2>
                            <p className="mt-1 text-sm text-stone-500">
                                Kami akan memperbarui status saat pesanan
                                diproses.
                            </p>
                        </div>
                    </div>
                </section>
            </main>
        </StorefrontLayout>
    );
}
