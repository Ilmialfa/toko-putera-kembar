import { Head, Link, router } from '@inertiajs/react';
import {
    ArrowRight,
    BadgePercent,
    Box,
    ChevronDown,
    PackageCheck,
    Search,
    ShieldCheck,
    ShoppingBag,
    Sparkles,
    Truck,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import StorefrontLayout from '@/layouts/StorefrontLayout';

type Quote = { unit_price: number; unit_symbol: string; unit_name: string };
type Product = {
    id: number;
    name: string;
    slug: string;
    sku: string;
    description_short: string | null;
    stock_status: string;
    display_price_prefix: string;
    display_quote: Quote | null;
    category: { name: string; slug: string } | null;
    brand: { name: string } | null;
    images: Array<{ url: string }>;
};
type Category = { id: number; name: string; slug: string };
const money = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});
const stockLabel: Record<string, string> = {
    available: 'Tersedia',
    low_stock: 'Stok terbatas',
    preorder: 'Pre-order',
    out_of_stock: 'Habis',
};

export default function StorefrontIndex({
    products,
    categories,
    brands,
    filters,
    activePromotions,
}: any) {
    const [search, setSearch] = useState(filters.search ?? '');
    const apply = (next: Record<string, unknown>) =>
        router.get(
            '/',
            { ...filters, ...next },
            { preserveState: true, preserveScroll: true },
        );
    const submit = (event: FormEvent) => {
        event.preventDefault();
        apply({ search: search || undefined });
    };

    return (
        <StorefrontLayout title="Toko Grosir Putera Kembar">
            <Head>
                <meta
                    name="description"
                    content="Belanja kebutuhan harian dan stok warung dengan harga grosir transparan, satuan fleksibel, dan pengiriman area Pekanbaru."
                />
            </Head>
            {!filters.search && !filters.category && !filters.brand && (
                <>
                    <section className="px-4 pt-5 md:pt-8">
                        <div className="relative mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] bg-stone-950 text-white lg:grid-cols-[1.05fr_0.95fr]">
                            <div className="relative z-10 flex flex-col justify-center px-6 py-12 md:px-12 md:py-16 lg:py-20">
                                <span className="w-fit rounded-full border border-lime-300/30 bg-lime-300/10 px-3 py-1.5 text-xs font-bold tracking-[0.16em] text-lime-300 uppercase">
                                    Grosir lokal, dibuat lebih mudah
                                </span>
                                <h1 className="mt-6 max-w-xl text-4xl leading-[1.05] font-black tracking-[-0.04em] md:text-6xl">
                                    Stok warung lengkap.{' '}
                                    <span className="text-lime-300">
                                        Harga selalu jelas.
                                    </span>
                                </h1>
                                <p className="mt-5 max-w-lg text-base leading-7 text-stone-300">
                                    Belanja per ons, pcs, renteng, hingga dus.
                                    Harga otomatis menyesuaikan jumlah dan
                                    status member Anda.
                                </p>
                                <form
                                    onSubmit={submit}
                                    className="mt-8 flex max-w-xl rounded-2xl bg-white p-1.5 shadow-2xl"
                                >
                                    <Search className="ml-3 size-5 self-center text-stone-400" />
                                    <input
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="min-w-0 flex-1 bg-transparent px-3 text-sm text-stone-950 outline-none"
                                        placeholder="Cari beras, mie, minuman…"
                                    />
                                    <button className="rounded-xl bg-lime-400 px-5 py-3 text-sm font-bold text-stone-950 transition hover:bg-lime-300">
                                        Cari
                                    </button>
                                </form>
                                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-stone-300">
                                    <span className="flex items-center gap-2">
                                        <ShieldCheck className="size-4 text-lime-300" />
                                        Produk terjamin
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Truck className="size-4 text-lime-300" />
                                        Antar area Pekanbaru
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <PackageCheck className="size-4 text-lime-300" />
                                        Stok real-time
                                    </span>
                                </div>
                            </div>
                            <div className="relative hidden min-h-[520px] overflow-hidden lg:block">
                                <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_40%,rgba(163,230,53,0.25),transparent_45%)]" />
                                <div className="absolute top-16 right-16 left-10 rotate-3 rounded-[2rem] border border-white/10 bg-white/8 p-6 backdrop-blur">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold tracking-widest text-lime-300 uppercase">
                                            Harga fleksibel
                                        </span>
                                        <BadgePercent className="size-6 text-lime-300" />
                                    </div>
                                    <div className="mt-12 rounded-2xl bg-white p-5 text-stone-950">
                                        <p className="text-sm font-semibold text-stone-500">
                                            Beras Curah Premium
                                        </p>
                                        <p className="mt-2 text-3xl font-black">
                                            Rp3.000{' '}
                                            <span className="text-base font-semibold text-stone-500">
                                                /ons
                                            </span>
                                        </p>
                                        <div className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                                            <div className="rounded-xl bg-stone-100 p-3">
                                                <strong className="block">
                                                    1 ons
                                                </strong>
                                                <span>Rp3.000</span>
                                            </div>
                                            <div className="rounded-xl bg-lime-100 p-3">
                                                <strong className="block">
                                                    1 kg
                                                </strong>
                                                <span>Rp30.000</span>
                                            </div>
                                            <div className="rounded-xl bg-stone-100 p-3">
                                                <strong className="block">
                                                    10+ kg
                                                </strong>
                                                <span>Grosir</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute right-8 bottom-8 rounded-2xl bg-lime-400 p-5 text-stone-950 shadow-2xl">
                                    <ShoppingBag className="size-6" />
                                    <p className="mt-3 text-sm font-bold">
                                        Belanja sesuai kebutuhan
                                    </p>
                                    <p className="text-xs opacity-70">
                                        Sistem hitung harga terbaik.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                    <section className="mx-auto max-w-7xl px-4 py-10">
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                            <Feature
                                icon={Truck}
                                title="Pengiriman terukur"
                                text="Ongkir dan radius dihitung dari lokasi toko."
                            />
                            <Feature
                                icon={BadgePercent}
                                title="Harga grosir transparan"
                                text="Tier harga terlihat sebelum checkout."
                            />
                            <Feature
                                icon={ShieldCheck}
                                title="Transaksi aman"
                                text="Stok dikunci saat proses checkout."
                            />
                            <Feature
                                icon={Sparkles}
                                title="Promo otomatis"
                                text="Campaign POS dan online selalu sinkron."
                            />
                        </div>
                    </section>
                </>
            )}
            {activePromotions?.length > 0 && (
                <section className="mx-auto max-w-7xl px-4 pb-10">
                    <div className="mb-5 flex items-end justify-between">
                        <div>
                            <p className="text-xs font-bold tracking-[0.16em] text-lime-700 uppercase">
                                Sedang berlangsung
                            </p>
                            <h2 className="mt-1 text-2xl font-black tracking-tight text-stone-950">
                                Promo pilihan minggu ini
                            </h2>
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-3">
                        {activePromotions
                            .slice(0, 3)
                            .map((promo: any, index: number) => (
                                <div
                                    key={promo.id}
                                    className={`relative overflow-hidden rounded-2xl p-5 ${index === 0 ? 'bg-lime-300' : index === 1 ? 'bg-amber-100' : 'bg-sky-100'}`}
                                >
                                    <BadgePercent className="size-6" />
                                    <p className="mt-8 text-xs font-bold uppercase opacity-60">
                                        {promo.type.replaceAll('_', ' ')}
                                    </p>
                                    <h3 className="mt-1 text-xl font-black">
                                        {promo.name}
                                    </h3>
                                    <p className="mt-2 text-sm opacity-70">
                                        Berlaku hingga{' '}
                                        {new Date(
                                            promo.end_date,
                                        ).toLocaleDateString('id-ID')}
                                    </p>
                                </div>
                            ))}
                    </div>
                </section>
            )}
            <section
                id="produk"
                className="border-t border-stone-200 bg-[#f7f6f1] px-4 py-10 md:py-14"
            >
                <div className="mx-auto max-w-7xl">
                    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
                        <div>
                            <p className="text-xs font-bold tracking-[0.16em] text-lime-700 uppercase">
                                Katalog toko
                            </p>
                            <h2 className="mt-1 text-3xl font-black tracking-tight text-stone-950">
                                Belanja kebutuhan hari ini
                            </h2>
                            <p className="mt-2 text-sm text-stone-500">
                                {products.total} produk aktif dengan stok dan
                                harga terbaru.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <select
                                className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm"
                                value={filters.brand ?? ''}
                                onChange={(e) =>
                                    apply({
                                        brand: e.target.value || undefined,
                                    })
                                }
                            >
                                <option value="">Semua merek</option>
                                {brands.map((brand: any) => (
                                    <option key={brand.id} value={brand.id}>
                                        {brand.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                className="h-11 rounded-xl border border-stone-200 bg-white px-3 text-sm"
                                value={filters.availability ?? ''}
                                onChange={(e) =>
                                    apply({
                                        availability:
                                            e.target.value || undefined,
                                    })
                                }
                            >
                                <option value="">Semua stok</option>
                                <option value="available">Tersedia</option>
                                <option value="preorder">Pre-order</option>
                            </select>
                            <label className="relative">
                                <select
                                    className="h-11 appearance-none rounded-xl border border-stone-200 bg-white pr-9 pl-3 text-sm"
                                    value={filters.sort ?? 'newest'}
                                    onChange={(e) =>
                                        apply({ sort: e.target.value })
                                    }
                                >
                                    <option value="newest">Terbaru</option>
                                    <option value="name">Nama A–Z</option>
                                    <option value="oldest">Terlama</option>
                                </select>
                                <ChevronDown className="pointer-events-none absolute top-3.5 right-3 size-4" />
                            </label>
                        </div>
                    </div>
                    <div className="mt-7 flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => apply({ category: undefined })}
                            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${!filters.category ? 'bg-stone-950 text-white' : 'border border-stone-200 bg-white text-stone-600'}`}
                        >
                            Semua
                        </button>
                        {categories.map((category: Category) => (
                            <button
                                key={category.id}
                                onClick={() =>
                                    apply({ category: category.slug })
                                }
                                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${filters.category === category.slug ? 'bg-stone-950 text-white' : 'border border-stone-200 bg-white text-stone-600'}`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                    {products.data.length > 0 ? (
                        <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
                            <>
                                {products.data.map((product: Product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                    />
                                ))}
                            </>
                        </div>
                    ) : (
                        <div className="mt-8 rounded-3xl border border-dashed border-stone-300 bg-white py-20 text-center">
                            <Box className="mx-auto size-10 text-stone-300" />
                            <h3 className="mt-4 font-bold">
                                Produk belum ditemukan
                            </h3>
                            <p className="mt-1 text-sm text-stone-500">
                                Coba kata kunci atau filter yang berbeda.
                            </p>
                            <button
                                onClick={() => router.get('/')}
                                className="mt-5 text-sm font-bold text-lime-700"
                            >
                                Reset katalog
                            </button>
                        </div>
                    )}
                    <div className="mt-8 flex flex-wrap justify-center gap-2">
                        {products.links?.map((link: any) =>
                            link.url ? (
                                <Link
                                    key={link.label}
                                    href={link.url}
                                    preserveScroll
                                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${link.active ? 'bg-stone-950 text-white' : 'border bg-white text-stone-600'}`}
                                    dangerouslySetInnerHTML={{
                                        __html: link.label,
                                    }}
                                />
                            ) : null,
                        )}
                    </div>
                </div>
            </section>
        </StorefrontLayout>
    );
}

function Feature({
    icon: Icon,
    title,
    text,
}: {
    icon: typeof Truck;
    title: string;
    text: string;
}) {
    return (
        <div className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime-100 text-lime-800">
                <Icon className="size-5" />
            </span>
            <div>
                <p className="text-sm font-bold text-stone-900">{title}</p>
                <p className="mt-1 text-xs leading-5 text-stone-500">{text}</p>
            </div>
        </div>
    );
}
function ProductCard({ product }: { product: Product }) {
    const quote = product.display_quote;
    const disabled = product.stock_status === 'out_of_stock';

    return (
        <article className="group overflow-hidden rounded-2xl border border-stone-200 bg-white transition duration-300 hover:-translate-y-1 hover:border-stone-300 hover:shadow-xl hover:shadow-stone-200/60">
            <Link href={`/product/${product.slug}`} prefetch>
                <div className="relative aspect-[4/3] overflow-hidden bg-[linear-gradient(145deg,#f1f5e9,#e7eadf)]">
                    {product.images?.[0] ? (
                        <img
                            src={product.images[0].url}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center">
                            <div className="flex size-20 items-center justify-center rounded-[1.6rem] bg-white text-2xl font-black text-stone-800 shadow-lg">
                                {product.name.slice(0, 2).toUpperCase()}
                            </div>
                        </div>
                    )}
                    <span
                        className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold ${product.stock_status === 'available' ? 'bg-white/90 text-emerald-700' : product.stock_status === 'low_stock' ? 'bg-amber-100 text-amber-700' : product.stock_status === 'preorder' ? 'bg-blue-100 text-blue-700' : 'bg-stone-900 text-white'}`}
                    >
                        {stockLabel[product.stock_status]}
                    </span>
                </div>
                <div className="p-4">
                    <p className="text-[10px] font-bold tracking-wide text-stone-400 uppercase">
                        {product.category?.name ??
                            product.brand?.name ??
                            'Produk'}
                    </p>
                    <h3 className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 font-bold text-stone-900 md:text-base">
                        {product.name}
                    </h3>
                    <div className="mt-4 flex items-end justify-between gap-2">
                        <div>
                            {quote ? (
                                <>
                                    <p className="text-[10px] text-stone-400">
                                        {product.display_price_prefix === 'from'
                                            ? 'Mulai dari'
                                            : 'Harga'}
                                    </p>
                                    <p className="text-lg font-black tracking-tight text-stone-950 md:text-xl">
                                        {money.format(quote.unit_price)}{' '}
                                        <span className="text-xs font-semibold text-stone-500">
                                            /{quote.unit_symbol}
                                        </span>
                                    </p>
                                </>
                            ) : (
                                <p className="text-sm font-semibold text-stone-500">
                                    Hubungi toko
                                </p>
                            )}
                        </div>
                        <span
                            className={`flex size-10 items-center justify-center rounded-xl ${disabled ? 'bg-stone-100 text-stone-400' : 'bg-lime-400 text-stone-950 group-hover:bg-stone-950 group-hover:text-white'}`}
                        >
                            <ArrowRight className="size-4" />
                        </span>
                    </div>
                </div>
            </Link>
        </article>
    );
}
