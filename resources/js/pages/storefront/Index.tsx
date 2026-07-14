import { Head, Link, router } from '@inertiajs/react';
import {
    BadgePercent,
    Box,
    Check,
    ChevronDown,
    PackageCheck,
    Plus,
    Search,
    ShieldCheck,
    ShoppingBag,
    SlidersHorizontal,
    Sparkles,
    Truck,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import StorefrontLayout from '@/layouts/StorefrontLayout';

type Quote = {
    unit_price: number;
    unit_symbol: string;
    unit_name: string;
};
type SalesUnit = {
    id: number;
    name: string;
    symbol: string;
    quote: Quote | null;
};
type Product = {
    id: number;
    name: string;
    slug: string;
    sku: string;
    description_short: string | null;
    stock_status: string;
    display_price_prefix: string;
    display_quote: Quote | null;
    base_unit_id: number;
    sales_units: SalesUnit[];
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

async function addToCart(productId: number, unitId: number): Promise<number> {
    const csrfToken = document.querySelector<HTMLMetaElement>(
        'meta[name="csrf-token"]',
    )?.content;
    const response = await fetch('/cart', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
        },
        body: JSON.stringify({
            product_id: productId,
            unit_id: unitId,
            qty: 1,
        }),
    });

    if (!response.ok) {
        const payload = await response.json().catch(() => null);

        throw new Error(payload?.message ?? 'Produk tidak dapat ditambahkan.');
    }

    const payload = (await response.json()) as { cart_count: number };

    return payload.cart_count;
}

export default function StorefrontIndex({
    products,
    categories,
    brands,
    filters,
    searchSuggestions = [],
    activePromotions,
    cartQuantities,
    catalog = true,
}: any) {
    const [search, setSearch] = useState(filters.search ?? '');
    const apply = (next: Record<string, unknown>) =>
        router.get(
            '/katalog',
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
            {!catalog &&
                !filters.search &&
                !filters.category &&
                !filters.brand && (
                    <>
                        <section className="px-4 pt-5 md:pt-8">
                            <div className="relative mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-stone-200 bg-white text-stone-900 lg:grid-cols-[1.05fr_0.95fr]">
                                <div className="relative z-10 flex flex-col justify-center px-6 py-12 md:px-12 md:py-16 lg:py-20">
                                    <span className="w-fit rounded-full border border-lime-300 bg-lime-100 px-3 py-1.5 text-xs font-bold tracking-[0.16em] text-lime-800 uppercase">
                                        Grosir lokal, dibuat lebih mudah
                                    </span>
                                    <h1 className="mt-6 max-w-xl text-4xl leading-[1.05] font-black tracking-[-0.04em] md:text-6xl">
                                        Stok warung lengkap.{' '}
                                        <span className="text-lime-600">
                                            Harga selalu jelas.
                                        </span>
                                    </h1>
                                    <p className="mt-5 max-w-lg text-base leading-7 text-stone-600">
                                        Belanja per ons, pcs, renteng, hingga
                                        dus. Harga otomatis menyesuaikan jumlah
                                        dan status member Anda.
                                    </p>
                                    <form
                                        onSubmit={submit}
                                        className="mt-8 flex max-w-xl rounded-2xl border border-stone-200 bg-white p-1.5"
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
                                        <button className="rounded-xl bg-lime-300 px-5 py-3 text-sm font-bold text-stone-950 transition hover:bg-lime-200">
                                            Cari
                                        </button>
                                    </form>
                                    <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-xs font-semibold text-stone-600">
                                        <span className="flex items-center gap-2">
                                            <ShieldCheck className="size-4 text-lime-600" />
                                            Produk terjamin
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <Truck className="size-4 text-lime-600" />
                                            Antar area Pekanbaru
                                        </span>
                                        <span className="flex items-center gap-2">
                                            <PackageCheck className="size-4 text-lime-600" />
                                            Stok real-time
                                        </span>
                                    </div>
                                </div>
                                <div className="relative hidden min-h-[520px] overflow-hidden lg:block">
                                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_55%_40%,rgba(231,229,228,0.7),transparent_45%)]" />
                                    <div className="absolute top-16 right-16 left-10 rotate-3 rounded-[2rem] border border-stone-200 bg-stone-50 p-6">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-bold tracking-widest text-stone-500 uppercase">
                                                Harga fleksibel
                                            </span>
                                            <BadgePercent className="size-6 text-lime-600" />
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
                                    <div className="absolute right-8 bottom-8 rounded-2xl border border-stone-200 bg-white p-5 text-stone-900">
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
            {!catalog && activePromotions?.length > 0 && (
                <section id="promo" className="mx-auto max-w-7xl px-4 pb-10">
                    <div className="mb-5 flex items-end justify-between">
                        <div>
                            <p className="text-xs font-bold tracking-[0.16em] text-stone-500 uppercase">
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
                                    className={`relative overflow-hidden rounded-2xl border p-5 ${index === 0 ? 'border-lime-400 bg-white' : index === 1 ? 'border-stone-300 bg-stone-50' : 'border-stone-200 bg-white'}`}
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
                className="border-t border-stone-100 bg-white px-4 py-10 md:py-14"
            >
                <div className="mx-auto max-w-7xl">
                    <div className="relative z-10 overflow-visible rounded-[2rem] border border-stone-200 bg-[#f8f8f0] p-6 md:p-8">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute top-5 right-5 size-32 rounded-full border-[10px] border-lime-200/80"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute right-40 bottom-5 size-20 rounded-full bg-lime-200/60"
                        />
                        <div className="relative flex flex-col justify-between gap-5 md:flex-row md:items-end">
                            <div>
                                <p className="text-xs font-bold tracking-[0.16em] text-lime-800 uppercase">
                                    Katalog toko
                                </p>
                                <h2 className="mt-1 text-3xl font-black tracking-tight text-stone-950">
                                    Belanja kebutuhan hari ini
                                </h2>
                                <p className="mt-2 text-sm text-stone-500">
                                    {products.total} produk aktif dengan stok
                                    dan harga terbaru.
                                </p>
                                <form
                                    onSubmit={submit}
                                    className="mt-5 flex h-12 w-full max-w-2xl items-center rounded-2xl border border-stone-200 bg-white/90 p-1.5 focus-within:border-lime-400 focus-within:bg-white"
                                >
                                    <Search className="ml-3 size-4 shrink-0 text-stone-400" />
                                    <input
                                        value={search}
                                        onChange={(event) =>
                                            setSearch(event.target.value)
                                        }
                                        placeholder="Cari produk, merek, atau SKU"
                                        aria-label="Cari produk di katalog"
                                        className="min-w-0 flex-1 bg-transparent px-3 text-sm text-stone-950 outline-none placeholder:text-stone-400"
                                    />
                                    <button className="rounded-xl bg-lime-300 px-3.5 py-2 text-xs font-black text-stone-950 transition hover:bg-lime-200">
                                        Cari
                                    </button>
                                </form>
                            </div>
                            <div className="flex shrink-0 flex-wrap gap-2 md:justify-end">
                                <FilterMenu
                                    label="Merek"
                                    selected={
                                        brands.find(
                                            (brand: any) =>
                                                String(brand.id) ===
                                                String(filters.brand ?? ''),
                                        )?.name ?? 'Semua merek'
                                    }
                                    options={[
                                        { value: '', label: 'Semua merek' },
                                        ...brands.map((brand: any) => ({
                                            value: String(brand.id),
                                            label: brand.name,
                                        })),
                                    ]}
                                    value={String(filters.brand ?? '')}
                                    onChange={(value) =>
                                        apply({ brand: value || undefined })
                                    }
                                />
                                <FilterMenu
                                    label="Stok"
                                    selected={
                                        filters.availability === 'available'
                                            ? 'Tersedia'
                                            : filters.availability ===
                                                'preorder'
                                              ? 'Pre-order'
                                              : 'Semua stok'
                                    }
                                    options={[
                                        { value: '', label: 'Semua stok' },
                                        {
                                            value: 'available',
                                            label: 'Tersedia',
                                        },
                                        {
                                            value: 'preorder',
                                            label: 'Pre-order',
                                        },
                                    ]}
                                    value={filters.availability ?? ''}
                                    onChange={(value) =>
                                        apply({
                                            availability: value || undefined,
                                        })
                                    }
                                />
                                <label className="relative">
                                    <select
                                        className="h-11 appearance-none rounded-xl border border-stone-200 bg-white/90 pr-9 pl-3 text-sm text-stone-700"
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
                    </div>
                    <div className="mt-7 flex gap-2 overflow-x-auto pb-2">
                        <button
                            onClick={() => apply({ category: undefined })}
                            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${!filters.category ? 'border border-lime-300 bg-lime-100 text-stone-950' : 'border border-stone-200 bg-white text-stone-600'}`}
                        >
                            Semua
                        </button>
                        {categories.map((category: Category) => (
                            <button
                                key={category.id}
                                onClick={() =>
                                    apply({ category: category.slug })
                                }
                                className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold ${filters.category === category.slug ? 'border border-lime-300 bg-lime-100 text-stone-950' : 'border border-stone-200 bg-white text-stone-600'}`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>
                    {searchSuggestions.length > 0 && (
                        <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl border border-lime-200 bg-lime-50 px-4 py-3 text-sm text-stone-700">
                            <Sparkles className="size-4 shrink-0 text-lime-700" />
                            <span>Mungkin maksud Anda:</span>
                            {searchSuggestions.map(
                                (suggestion: {
                                    name: string;
                                    slug: string;
                                }) => (
                                    <button
                                        key={suggestion.slug}
                                        type="button"
                                        onClick={() => {
                                            setSearch(suggestion.name);
                                            apply({ search: suggestion.name });
                                        }}
                                        className="rounded-full border border-lime-300 bg-white px-3 py-1 text-xs font-bold text-lime-800 transition hover:bg-lime-100"
                                    >
                                        {suggestion.name}
                                    </button>
                                ),
                            )}
                        </div>
                    )}
                    {products.data.length > 0 ? (
                        <div className="mt-7 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4">
                            <>
                                {products.data.map((product: Product) => (
                                    <ProductCard
                                        key={product.id}
                                        product={product}
                                        cartQuantities={cartQuantities}
                                    />
                                ))}
                            </>
                        </div>
                    ) : (
                        <div className="mt-8 rounded-3xl border border-dashed border-lime-300 bg-white py-20 text-center">
                            <Box className="mx-auto size-10 text-stone-300" />
                            <h3 className="mt-4 font-bold">
                                Produk belum ditemukan
                            </h3>
                            <p className="mt-1 text-sm text-stone-500">
                                Coba kata kunci atau filter yang berbeda.
                            </p>
                            <button
                                onClick={() => router.get('/katalog')}
                                className="mt-5 text-sm font-bold text-lime-600"
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
                                    className={`rounded-xl px-3 py-2 text-xs font-semibold ${link.active ? 'border border-lime-300 bg-lime-100 text-stone-950' : 'border border-stone-200 bg-white text-stone-600'}`}
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

function FilterMenu({
    label,
    selected,
    value,
    options,
    onChange,
}: {
    label: string;
    selected: string | undefined;
    value: string;
    options: Array<{ value: string; label: string }>;
    onChange: (value: string) => void;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative z-30">
            <button
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                aria-expanded={isOpen}
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-xs font-bold text-stone-700 transition hover:border-lime-300 hover:bg-lime-50"
            >
                <SlidersHorizontal className="size-3.5 text-lime-700" />
                <span className="max-w-24 truncate">{selected}</span>
                <ChevronDown
                    className={`size-3.5 text-stone-400 transition ${isOpen ? 'rotate-180' : ''}`}
                />
            </button>
            {isOpen && (
                <div className="absolute top-[calc(100%+0.5rem)] left-0 z-50 min-w-48 overflow-hidden rounded-2xl border border-stone-200 bg-white p-1.5">
                    <p className="px-2.5 py-2 text-[10px] font-bold tracking-[0.14em] text-stone-400 uppercase">
                        {label}
                    </p>
                    {options.map((option) => (
                        <button
                            key={option.value || 'all'}
                            type="button"
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`flex w-full items-center justify-between gap-4 rounded-xl px-2.5 py-2.5 text-left text-sm transition ${value === option.value ? 'bg-lime-100 font-bold text-stone-950' : 'text-stone-600 hover:bg-stone-50'}`}
                        >
                            <span>{option.label}</span>
                            {value === option.value && (
                                <Check className="size-4 shrink-0 text-lime-700" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
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
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-lime-600">
                <Icon className="size-5" />
            </span>
            <div>
                <p className="text-sm font-bold text-stone-900">{title}</p>
                <p className="mt-1 text-xs leading-5 text-stone-500">{text}</p>
            </div>
        </div>
    );
}
function ProductCard({
    product,
    cartQuantities: initialCartQuantities,
}: {
    product: Product;
    cartQuantities: Record<string, number>;
}) {
    const disabled = product.stock_status === 'out_of_stock';
    const [cartQuantities, setCartQuantities] = useState(initialCartQuantities);
    const salesUnits = product.sales_units.slice(0, 2);

    const quickAdd = (event: React.MouseEvent, unit: SalesUnit) => {
        event.preventDefault();
        event.stopPropagation();

        if (disabled || !unit.quote) {
            return;
        }

        const key = `${product.id}:${unit.id}`;
        setCartQuantities((current) => ({
            ...current,
            [key]: (current[key] ?? 0) + 1,
        }));

        void addToCart(product.id, unit.id)
            .then((cartCount) => {
                window.dispatchEvent(
                    new CustomEvent('storefront:cart-changed', {
                        detail: { count: cartCount },
                    }),
                );
            })
            .catch((error: Error) => {
                setCartQuantities((current) => ({
                    ...current,
                    [key]: Math.max(0, (current[key] ?? 0) - 1),
                }));

                toast.error(error.message);
            });
    };

    return (
        <article className="group relative overflow-hidden rounded-2xl border border-stone-200 bg-white transition duration-300 hover:border-lime-300">
            <Link href={`/product/${product.slug}`} prefetch className="block">
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
                            <div className="flex size-20 items-center justify-center rounded-[1.6rem] border border-stone-200 bg-white text-2xl font-black text-stone-800">
                                {product.name.slice(0, 2).toUpperCase()}
                            </div>
                        </div>
                    )}
                    <span
                        className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold ${product.stock_status === 'available' ? 'bg-white/90 text-lime-700' : product.stock_status === 'low_stock' ? 'bg-amber-100 text-amber-800' : product.stock_status === 'preorder' ? 'bg-sky-100 text-sky-800' : 'bg-stone-800 text-white'}`}
                    >
                        {stockLabel[product.stock_status]}
                    </span>
                </div>
                <div className="px-4 pt-4">
                    <p className="text-[10px] font-bold tracking-wide text-stone-400 uppercase">
                        {product.category?.name ??
                            product.brand?.name ??
                            'Produk'}
                    </p>
                    <h3 className="mt-1 line-clamp-2 min-h-10 text-sm leading-5 font-bold text-stone-900 md:text-base">
                        {product.name}
                    </h3>
                </div>
            </Link>
            <div className="space-y-2 p-4 pt-3">
                {salesUnits.length > 0 ? (
                    salesUnits.map((unit) => {
                        const quantityInCart =
                            cartQuantities[`${product.id}:${unit.id}`] ?? 0;

                        return (
                            <div
                                key={unit.id}
                                className="flex items-center justify-between gap-1 rounded-xl bg-stone-50 px-2 py-2"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-bold tracking-wide text-stone-400 uppercase">
                                        {unit.name}
                                    </p>
                                    <p className="text-[11px] font-black whitespace-nowrap text-stone-950">
                                        {unit.quote
                                            ? money.format(
                                                  unit.quote.unit_price,
                                              )
                                            : 'Harga belum tersedia'}
                                    </p>
                                </div>
                                <button
                                    onClick={(event) => quickAdd(event, unit)}
                                    disabled={disabled || !unit.quote}
                                    aria-label={`Tambah ${product.name} satuan ${unit.name} ke keranjang`}
                                    className="inline-flex h-8 min-w-9 shrink-0 items-center justify-center gap-1 rounded-lg bg-lime-300 px-1.5 text-xs font-black text-stone-950 transition hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400"
                                >
                                    <Plus className="size-3.5" />
                                    {quantityInCart}
                                </button>
                            </div>
                        );
                    })
                ) : (
                    <p className="px-1 text-sm font-semibold text-stone-500">
                        Harga belum tersedia.
                    </p>
                )}
            </div>
        </article>
    );
}
