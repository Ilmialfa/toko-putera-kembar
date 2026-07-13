import { Link, router } from '@inertiajs/react';
import { ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import StorefrontLayout from '@/layouts/StorefrontLayout';

const money = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});
export default function Cart({ cart }: any) {
    const subtotal = cart.items.reduce(
        (sum: number, item: any) => sum + Number(item.quote.subtotal),
        0,
    );
    const update = (item: any, qty: number) =>
        qty <= 0
            ? router.delete(`/cart/${item.id}`, { preserveScroll: true })
            : router.put(`/cart/${item.id}`, { qty }, { preserveScroll: true });

    return (
        <StorefrontLayout title="Keranjang">
            <div className="mx-auto max-w-7xl px-4 py-8 md:py-12">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-xs font-bold tracking-[0.16em] text-lime-700 uppercase">
                            Belanja Anda
                        </p>
                        <h1 className="mt-1 text-3xl font-black tracking-tight md:text-4xl">
                            Keranjang belanja
                        </h1>
                        <p className="mt-2 text-sm text-stone-500">
                            Harga tier dihitung ulang setiap kali jumlah
                            berubah.
                        </p>
                    </div>
                    <span className="hidden rounded-full bg-stone-100 px-3 py-1.5 text-sm font-semibold md:block">
                        {cart.items.length} produk
                    </span>
                </div>
                {cart.items.length === 0 ? (
                    <div className="mt-8 rounded-3xl border border-dashed bg-white py-24 text-center">
                        <ShoppingBag className="mx-auto size-12 text-stone-300" />
                        <h2 className="mt-4 text-xl font-bold">
                            Keranjang masih kosong
                        </h2>
                        <p className="mt-2 text-sm text-stone-500">
                            Temukan kebutuhan rumah atau stok warung Anda.
                        </p>
                        <Link
                            href="/"
                            className="mt-6 inline-flex rounded-xl bg-lime-400 px-5 py-3 text-sm font-bold text-stone-950"
                        >
                            Mulai belanja
                        </Link>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-7 lg:grid-cols-[1fr_380px]">
                        <div className="space-y-3">
                            {cart.items.map((item: any) => (
                                <article
                                    key={item.id}
                                    className="grid grid-cols-[84px_1fr] gap-4 rounded-2xl border bg-white p-4 md:grid-cols-[112px_1fr_auto]"
                                >
                                    <div className="aspect-square overflow-hidden rounded-xl bg-[linear-gradient(145deg,#f1f4e9,#e6e9df)]">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt={item.product.name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-xl font-black">
                                                {item.product.name
                                                    .slice(0, 2)
                                                    .toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <Link
                                            href={`/product/${item.product.slug}`}
                                            className="line-clamp-2 font-bold text-stone-950 hover:text-lime-700"
                                        >
                                            {item.product.name}
                                        </Link>
                                        <p className="mt-1 text-xs text-stone-500">
                                            {item.unit.name} ·{' '}
                                            {money.format(
                                                item.quote.unit_price,
                                            )}
                                            /{item.unit.symbol}
                                        </p>
                                        <div className="mt-4 flex w-fit items-center rounded-xl border">
                                            <button
                                                aria-label="Kurangi"
                                                className="grid size-9 place-items-center"
                                                onClick={() =>
                                                    update(
                                                        item,
                                                        Number(item.qty) - 1,
                                                    )
                                                }
                                            >
                                                <Minus className="size-3" />
                                            </button>
                                            <input
                                                aria-label="Jumlah"
                                                type="number"
                                                min="0.001"
                                                step="0.001"
                                                value={item.qty}
                                                onChange={(e) =>
                                                    update(
                                                        item,
                                                        Number(e.target.value),
                                                    )
                                                }
                                                className="h-9 w-14 border-x text-center text-sm font-bold outline-none"
                                            />
                                            <button
                                                aria-label="Tambah"
                                                className="grid size-9 place-items-center"
                                                onClick={() =>
                                                    update(
                                                        item,
                                                        Number(item.qty) + 1,
                                                    )
                                                }
                                            >
                                                <Plus className="size-3" />
                                            </button>
                                        </div>
                                        {item.quote.source ===
                                            'proportional' && (
                                            <p className="mt-2 text-[11px] text-amber-700">
                                                Harga proporsional dari satuan
                                                dasar.
                                            </p>
                                        )}
                                    </div>
                                    <div className="col-span-2 flex items-end justify-between border-t pt-3 md:col-span-1 md:flex-col md:items-end md:border-0 md:pt-0">
                                        <button
                                            onClick={() =>
                                                router.delete(
                                                    `/cart/${item.id}`,
                                                )
                                            }
                                            className="text-stone-400 hover:text-red-600"
                                            aria-label="Hapus produk"
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                        <p className="text-lg font-black">
                                            {money.format(item.quote.subtotal)}
                                        </p>
                                    </div>
                                </article>
                            ))}
                        </div>
                        <aside className="h-fit rounded-3xl bg-stone-950 p-6 text-white lg:sticky lg:top-28">
                            <h2 className="text-xl font-black">
                                Ringkasan belanja
                            </h2>
                            <div className="mt-6 space-y-3 text-sm">
                                <div className="flex justify-between text-stone-400">
                                    <span>Subtotal produk</span>
                                    <span className="text-white">
                                        {money.format(subtotal)}
                                    </span>
                                </div>
                                <div className="flex justify-between text-stone-400">
                                    <span>Diskon campaign</span>
                                    <span className="text-lime-300">
                                        Dihitung saat checkout
                                    </span>
                                </div>
                                <div className="flex justify-between text-stone-400">
                                    <span>Pengiriman</span>
                                    <span className="text-white">
                                        Berdasarkan jarak
                                    </span>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-between border-t border-white/10 pt-5">
                                <span className="font-semibold">
                                    Estimasi subtotal
                                </span>
                                <span className="text-2xl font-black text-lime-300">
                                    {money.format(subtotal)}
                                </span>
                            </div>
                            <Link
                                href="/checkout"
                                className="mt-6 flex h-13 items-center justify-center gap-2 rounded-xl bg-lime-400 font-bold text-stone-950 transition hover:bg-lime-300"
                            >
                                Lanjut checkout{' '}
                                <ArrowRight className="size-4" />
                            </Link>
                            <Link
                                href="/"
                                className="mt-3 block text-center text-xs font-semibold text-stone-400 hover:text-white"
                            >
                                Tambah produk lain
                            </Link>
                        </aside>
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
