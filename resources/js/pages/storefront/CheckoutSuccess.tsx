import { Link } from '@inertiajs/react';
import { CheckCircle2, Copy, FileText, ShoppingBag } from 'lucide-react';
import React, { useState } from 'react';

import StorefrontLayout from '@/layouts/StorefrontLayout';

export default function CheckoutSuccess({ order }: any) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(order.order_number);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <StorefrontLayout title="Pesanan Berhasil">
            <div className="mx-auto max-w-3xl px-4 py-12 md:py-20">
                <div className="rounded-3xl border bg-card p-8 text-center shadow-sm md:p-12">
                    <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-full bg-emerald-100">
                        <CheckCircle2 className="size-10 text-emerald-600" />
                    </div>
                    <h1 className="mb-2 text-3xl font-bold tracking-tight">
                        Pesanan Berhasil Dibuat!
                    </h1>
                    <p className="mb-8 text-muted-foreground">
                        Terima kasih telah berbelanja di Toko Putera Kembar.
                        Pesanan Anda sedang kami proses.
                    </p>

                    <div className="mx-auto mb-8 max-w-sm rounded-2xl bg-secondary p-6">
                        <div className="text-sm text-muted-foreground">
                            Nomor Pesanan
                        </div>
                        <div className="mt-1 flex items-center justify-center gap-2">
                            <span className="font-mono text-xl font-bold">
                                {order.order_number}
                            </span>
                            <button
                                onClick={handleCopy}
                                className="rounded-lg p-1.5 text-muted-foreground hover:bg-black/5 hover:text-foreground"
                                title="Salin nomor pesanan"
                            >
                                {copied ? (
                                    <span className="text-xs font-semibold text-emerald-600">
                                        Disalin!
                                    </span>
                                ) : (
                                    <Copy className="size-4" />
                                )}
                            </button>
                        </div>
                        <div className="mt-4 border-t border-border/50 pt-4">
                            <div className="text-sm text-muted-foreground">
                                Total Tagihan
                            </div>
                            <div className="text-lg font-bold">
                                Rp{' '}
                                {Number(order.total_amount).toLocaleString(
                                    'id-ID',
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                        <Link
                            href="/"
                            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl border border-border bg-background px-6 font-semibold transition hover:bg-secondary sm:w-auto"
                        >
                            <ShoppingBag className="size-4" /> Belanja Lagi
                        </Link>
                        {order.customer_id && (
                            <Link
                                href="/akun"
                                className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-6 font-bold text-stone-950 transition hover:bg-lime-300 sm:w-auto"
                            >
                                <FileText className="size-4" /> Lihat Status
                                Pesanan
                            </Link>
                        )}
                    </div>

                    {!order.customer_id && (
                        <p className="mt-8 text-xs text-muted-foreground">
                            Kami akan segera memproses dan jika perlu
                            menghubungi Anda melalui WhatsApp untuk konfirmasi
                            pengiriman pesanan Anda.
                        </p>
                    )}
                </div>
            </div>
        </StorefrontLayout>
    );
}
