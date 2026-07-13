import { Link, router } from '@inertiajs/react';
import React from 'react';
import StorefrontLayout from '@/layouts/StorefrontLayout';

export default function Cart({ cart }: any) {
    const handleUpdateQty = (itemId: number, newQty: number) => {
        if (newQty < 1) {
            router.delete(`/cart/${itemId}`, { preserveScroll: true });
        } else {
            router.put(
                `/cart/${itemId}`,
                { qty: newQty },
                { preserveScroll: true },
            );
        }
    };

    const handleRemove = (itemId: number) => {
        router.delete(`/cart/${itemId}`, { preserveScroll: true });
    };

    const items = cart?.items || [];
    // Mock calculate total for now
    const subtotal = items.reduce(
        (acc: number, item: any) => acc + 10000 * item.qty,
        0,
    );

    return (
        <StorefrontLayout title="Keranjang Belanja">
            <div className="container mx-auto max-w-4xl px-4 py-8">
                <h1 className="mb-6 text-2xl font-bold">Keranjang Belanja</h1>

                {items.length === 0 ? (
                    <div className="rounded-xl border bg-card py-12 text-center">
                        <p className="mb-4 text-muted-foreground">
                            Keranjang Anda masih kosong.
                        </p>
                        <Link
                            href="/"
                            className="inline-block rounded-full bg-primary px-6 py-2 font-medium text-primary-foreground"
                        >
                            Mulai Belanja
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                        <div className="space-y-4 md:col-span-2">
                            {items.map((item: any) => (
                                <div
                                    key={item.id}
                                    className="flex gap-4 rounded-xl border bg-card p-4"
                                >
                                    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-secondary">
                                        {item.product.images?.length > 0 ? (
                                            <img
                                                src={
                                                    item.product.images[0].path
                                                }
                                                alt={item.product.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground/30">
                                                No Img
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold">
                                            {item.product.name}
                                        </h3>
                                        <div className="mb-2 text-sm text-muted-foreground">
                                            Rp 10.000 / {item.unit?.name}
                                        </div>

                                        <div className="mt-auto flex items-center justify-between">
                                            <div className="flex items-center rounded-md border">
                                                <button
                                                    onClick={() =>
                                                        handleUpdateQty(
                                                            item.id,
                                                            item.qty - 1,
                                                        )
                                                    }
                                                    className="px-3 py-1 hover:bg-secondary"
                                                >
                                                    -
                                                </button>
                                                <span className="min-w-[3rem] border-x px-3 py-1 text-center">
                                                    {item.qty}
                                                </span>
                                                <button
                                                    onClick={() =>
                                                        handleUpdateQty(
                                                            item.id,
                                                            item.qty + 1,
                                                        )
                                                    }
                                                    className="px-3 py-1 hover:bg-secondary"
                                                >
                                                    +
                                                </button>
                                            </div>
                                            <button
                                                onClick={() =>
                                                    handleRemove(item.id)
                                                }
                                                className="text-sm font-medium text-red-500 hover:underline"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div>
                            <div className="sticky top-24 rounded-xl border bg-card p-6">
                                <h3 className="mb-4 text-lg font-semibold">
                                    Ringkasan Belanja
                                </h3>
                                <div className="mb-2 flex justify-between">
                                    <span className="text-muted-foreground">
                                        Total Item
                                    </span>
                                    <span>{items.length}</span>
                                </div>
                                <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold">
                                    <span>Total Belanja</span>
                                    <span>Rp {subtotal.toLocaleString()}</span>
                                </div>

                                <Link
                                    href="/checkout"
                                    className="mt-6 block w-full rounded-full bg-primary py-3 text-center font-bold text-primary-foreground hover:opacity-90"
                                >
                                    Lanjut ke Pembayaran
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
