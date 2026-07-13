import { Link, router, useHttp } from '@inertiajs/react';
import {
    Check,
    ChevronRight,
    Minus,
    Plus,
    ShieldCheck,
    ShoppingBag,
    Truck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import StorefrontLayout from '@/layouts/StorefrontLayout';

type Quote = {
    unit_price: number;
    subtotal: number;
    unit_symbol: string;
    source: string;
    warning?: string | null;
};
const money = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

export default function ProductDetail({ product }: any) {
    const defaultUnit =
        product.sales_units.find(
            (unit: any) => unit.id === product.display_quote?.unit_id,
        ) ?? product.sales_units[0];
    const [unitId, setUnitId] = useState<number>(defaultUnit?.id);
    const [quantity, setQuantity] = useState(1);
    const [quote, setQuote] = useState<Quote | null>(
        defaultUnit?.quote ?? product.display_quote,
    );
    const [image, setImage] = useState(product.images?.[0]?.url ?? null);
    const quoteRequest = useHttp<
        {
            product_id: number;
            unit_id: number;
            quantity: number;
            channel: string;
        },
        { data: Quote }
    >({
        product_id: product.id,
        unit_id: defaultUnit?.id,
        quantity: 1,
        channel: 'online',
    });

    useEffect(() => {
        const timeout = window.setTimeout(async () => {
            quoteRequest.transform(() => ({
                product_id: product.id,
                unit_id: unitId,
                quantity,
                channel: 'online',
            }));

            try {
                const response = await quoteRequest.post('/price-quote');
                setQuote(response.data);
            } catch {
                setQuote(null);
            }
        }, 180);

        return () => window.clearTimeout(timeout);
        // useHttp mengelola identitas request secara internal; perubahan harga hanya dipicu input pengguna.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [unitId, quantity, product.id]);

    const addToCart = () =>
        router.post(
            '/cart',
            { product_id: product.id, unit_id: unitId, qty: quantity },
            {
                preserveScroll: true,
                onSuccess: () =>
                    toast.success('Produk ditambahkan ke keranjang.'),
            },
        );
    const selectedUnit = product.sales_units.find(
        (unit: any) => unit.id === unitId,
    );
    const tiers = product.price_tiers.filter(
        (tier: any) => tier.unit_id === unitId,
    );
    const unavailable = product.stock_status === 'out_of_stock';

    return (
        <StorefrontLayout title={product.name}>
            <div className="mx-auto max-w-7xl px-4 py-6 md:py-10">
                <nav className="mb-6 flex items-center gap-2 overflow-hidden text-xs text-stone-500">
                    <Link href="/">Beranda</Link>
                    <ChevronRight className="size-3" />
                    <Link href={`/?category=${product.category?.slug}`}>
                        {product.category?.name}
                    </Link>
                    <ChevronRight className="size-3" />
                    <span className="truncate text-stone-900">
                        {product.name}
                    </span>
                </nav>
                <div className="grid gap-8 lg:grid-cols-[1fr_0.95fr]">
                    <div>
                        <div className="relative aspect-square overflow-hidden rounded-[2rem] bg-[linear-gradient(145deg,#f2f4ec,#e6e9dd)]">
                            {image ? (
                                <img
                                    src={image}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full items-center justify-center">
                                    <div className="flex size-40 items-center justify-center rounded-[2.5rem] bg-white text-5xl font-black shadow-xl">
                                        {product.name.slice(0, 2).toUpperCase()}
                                    </div>
                                </div>
                            )}
                            <span className="absolute top-5 left-5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-stone-700">
                                {product.stock_status.replaceAll('_', ' ')}
                            </span>
                        </div>
                        {product.images?.length > 1 && (
                            <div className="mt-3 flex gap-3 overflow-x-auto">
                                {product.images.map((item: any) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setImage(item.url)}
                                        className={`size-20 shrink-0 overflow-hidden rounded-xl border-2 ${image === item.url ? 'border-lime-500' : 'border-transparent'}`}
                                    >
                                        <img
                                            src={item.url}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="lg:py-4">
                        <p className="text-xs font-bold tracking-[0.14em] text-lime-700 uppercase">
                            {product.brand?.name ?? product.category?.name}
                        </p>
                        <h1 className="mt-2 text-3xl leading-tight font-black tracking-[-0.03em] text-stone-950 md:text-5xl">
                            {product.name}
                        </h1>
                        <p className="mt-3 text-sm text-stone-500">
                            SKU {product.sku}
                        </p>
                        <p className="mt-5 leading-7 text-stone-600">
                            {product.description_short}
                        </p>
                        <div className="mt-7 rounded-2xl bg-stone-950 p-5 text-white">
                            <p className="text-xs font-semibold text-stone-400">
                                {product.display_price_prefix === 'from'
                                    ? 'Mulai dari'
                                    : 'Harga pilihan Anda'}
                            </p>
                            {quote ? (
                                <>
                                    <p className="mt-1 text-3xl font-black text-lime-300">
                                        {money.format(quote.unit_price)}{' '}
                                        <span className="text-base font-semibold text-stone-400">
                                            /{quote.unit_symbol}
                                        </span>
                                    </p>
                                    <p className="mt-2 text-sm text-stone-300">
                                        Subtotal {quantity}{' '}
                                        {selectedUnit?.symbol}:{' '}
                                        <strong className="text-white">
                                            {money.format(quote.subtotal)}
                                        </strong>
                                    </p>
                                    {quote.warning && (
                                        <p className="mt-2 text-xs text-amber-300">
                                            {quote.warning}
                                        </p>
                                    )}
                                </>
                            ) : (
                                <p className="mt-2 text-lg font-bold">
                                    Harga belum tersedia
                                </p>
                            )}
                        </div>
                        <div className="mt-6">
                            <label className="text-sm font-bold text-stone-900">
                                Pilih satuan
                            </label>
                            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                                {product.sales_units.map((unit: any) => (
                                    <button
                                        key={unit.id}
                                        type="button"
                                        onClick={() => {
                                            setUnitId(unit.id);
                                            setQuote(unit.quote);
                                        }}
                                        className={`rounded-xl border p-3 text-left transition ${unitId === unit.id ? 'border-stone-950 bg-stone-950 text-white' : 'border-stone-200 bg-white hover:border-lime-500'}`}
                                    >
                                        <span className="block text-sm font-bold">
                                            {unit.name}
                                        </span>
                                        <span
                                            className={`text-xs ${unitId === unit.id ? 'text-stone-400' : 'text-stone-500'}`}
                                        >
                                            {unit.quote
                                                ? money.format(
                                                      unit.quote.unit_price,
                                                  )
                                                : 'Belum diatur'}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="mt-6 flex gap-3">
                            <div className="flex h-13 items-center rounded-xl border bg-white">
                                <button
                                    type="button"
                                    aria-label="Kurangi jumlah"
                                    className="grid size-12 place-items-center"
                                    onClick={() =>
                                        setQuantity(
                                            Math.max(0.001, quantity - 1),
                                        )
                                    }
                                >
                                    <Minus className="size-4" />
                                </button>
                                <input
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={quantity}
                                    onChange={(e) =>
                                        setQuantity(
                                            Math.max(
                                                0.001,
                                                Number(e.target.value),
                                            ),
                                        )
                                    }
                                    className="h-full w-16 border-x text-center font-bold outline-none"
                                />
                                <button
                                    type="button"
                                    aria-label="Tambah jumlah"
                                    className="grid size-12 place-items-center"
                                    onClick={() => setQuantity(quantity + 1)}
                                >
                                    <Plus className="size-4" />
                                </button>
                            </div>
                            <button
                                disabled={
                                    unavailable ||
                                    !quote ||
                                    quoteRequest.processing
                                }
                                onClick={addToCart}
                                className="flex h-13 flex-1 items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 font-bold text-stone-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:bg-stone-200"
                            >
                                <ShoppingBag className="size-5" />
                                {unavailable
                                    ? 'Stok habis'
                                    : 'Tambah ke keranjang'}
                            </button>
                        </div>
                        <div className="mt-5 grid gap-2 text-xs text-stone-600 sm:grid-cols-3">
                            <span className="flex items-center gap-2">
                                <Check className="size-4 text-emerald-600" />
                                Harga server-side
                            </span>
                            <span className="flex items-center gap-2">
                                <ShieldCheck className="size-4 text-emerald-600" />
                                Stok terverifikasi
                            </span>
                            <span className="flex items-center gap-2">
                                <Truck className="size-4 text-emerald-600" />
                                Bisa dikirim
                            </span>
                        </div>
                    </div>
                </div>
                {tiers.length > 0 && (
                    <section className="mt-12 rounded-3xl border bg-white p-6 md:p-8">
                        <h2 className="text-xl font-black">
                            Harga bertingkat {selectedUnit?.name}
                        </h2>
                        <p className="mt-1 text-sm text-stone-500">
                            Tambah jumlah untuk mendapat harga terbaik secara
                            otomatis.
                        </p>
                        <div className="mt-5 overflow-hidden rounded-xl border">
                            <table className="w-full text-sm">
                                <thead className="bg-stone-50 text-left text-xs text-stone-500 uppercase">
                                    <tr>
                                        <th className="px-4 py-3">Jumlah</th>
                                        <th className="px-4 py-3">
                                            Jenis harga
                                        </th>
                                        <th className="px-4 py-3 text-right">
                                            Harga /{selectedUnit?.symbol}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {tiers.map((tier: any, index: number) => (
                                        <tr key={index}>
                                            <td className="px-4 py-3">
                                                {tier.min_qty}
                                                {tier.max_qty
                                                    ? `–${tier.max_qty}`
                                                    : '+'}
                                            </td>
                                            <td className="px-4 py-3 capitalize">
                                                {tier.price_type.replaceAll(
                                                    '_',
                                                    ' ',
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold">
                                                {money.format(tier.price)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}
                <section className="mt-8 rounded-3xl bg-white p-6 md:p-8">
                    <h2 className="text-xl font-black">Tentang produk</h2>
                    <div
                        className="mt-4 max-w-3xl leading-7 text-stone-600"
                        dangerouslySetInnerHTML={{
                            __html:
                                product.description_long ||
                                product.description_short ||
                                'Belum ada deskripsi produk.',
                        }}
                    />
                </section>
            </div>
        </StorefrontLayout>
    );
}
