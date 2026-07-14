import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    Baby,
    Cigarette,
    Clock3,
    CookingPot,
    HeartPulse,
    Milk,
    MapPin,
    PackageCheck,
    PackageOpen,
    Search,
    ShieldCheck,
    ShoppingBasket,
    Snowflake,
    SprayCan,
    Store,
    Truck,
    UtensilsCrossed,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import StorefrontLayout from '@/layouts/StorefrontLayout';

const money = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

type Product = {
    id: number;
    name: string;
    slug: string;
    display_price_prefix: string;
    display_quote: { unit_price: number; unit_symbol: string } | null;
    images: Array<{ url: string }>;
    category: { name: string } | null;
};

const categoryIconMap: Record<string, LucideIcon> = {
    baby: Baby,
    cigarette: Cigarette,
    'cooking-pot': CookingPot,
    'heart-pulse': HeartPulse,
    milk: Milk,
    'package-open': PackageOpen,
    'shopping-basket': ShoppingBasket,
    snowflake: Snowflake,
    'spray-can': SprayCan,
    'utensils-crossed': UtensilsCrossed,
};

export default function Home({
    popularProducts,
    categories,
    articles,
    homePage,
    store,
}: any) {
    const informationBanner = homePage?.sections?.find(
        (section: any) => section.section_type === 'information_banner',
    )?.content_json ?? {
        title: 'Belanja lebih hemat untuk kebutuhan harian.',
        subtitle:
            'Dapatkan informasi belanja dan kabar terbaru dari Toko Putera Kembar.',
        cta_label: 'Lihat informasi',
        cta_url: '/promo',
    };

    return (
        <StorefrontLayout title="Toko Grosir Putera Kembar">
            <Head>
                <meta
                    name="description"
                    content="Belanja grosir kebutuhan harian dengan harga jelas, stok real-time, dan pengantaran area Pekanbaru."
                />
            </Head>

            <section className="px-4 pt-5 sm:pt-8">
                <div className="relative mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-stone-200 bg-white lg:grid-cols-[1fr_1.05fr]">
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-28 -left-20 size-72 rounded-full border border-lime-200"
                    />
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute top-12 left-[42%] hidden size-12 rotate-12 rounded-2xl border border-lime-300 lg:block"
                    />
                    <div className="relative flex flex-col justify-center overflow-hidden bg-gradient-to-br from-lime-300 via-lime-200 to-[#f8f9df] px-6 py-10 sm:px-10 sm:py-14 lg:px-14">
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute -bottom-24 -left-20 size-64 rounded-full border-[18px] border-white/45"
                        />
                        <div
                            aria-hidden="true"
                            className="pointer-events-none absolute top-12 right-10 size-16 rotate-12 rounded-3xl border-2 border-lime-500/40"
                        />
                        <span className="relative w-fit rounded-full border border-lime-600/35 bg-white/55 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-lime-900 uppercase">
                            Grosir lokal, selalu siap
                        </span>
                        <h1 className="relative mt-5 max-w-xl text-4xl leading-[1.02] font-black tracking-[-0.05em] text-stone-950 sm:text-5xl lg:text-6xl">
                            Belanja retail dan grosir{' '}
                            <span className="text-lime-600">terlengkap</span>
                        </h1>
                        <p className="relative mt-5 max-w-lg text-base leading-7 text-stone-700">
                            Harga grosir yang transparan, stok yang selalu
                            terbarui, dan pilihan satuan sesuai kebutuhan Anda.
                        </p>
                        <form
                            action="/katalog"
                            method="get"
                            className="relative mt-7 flex max-w-xl rounded-2xl border border-white/70 bg-white/95 p-1.5"
                        >
                            <Search className="ml-3 size-5 self-center text-stone-400" />
                            <input
                                name="search"
                                placeholder="Cari beras, mie, minuman…"
                                className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                            />
                            <button className="rounded-xl bg-lime-300 px-4 py-3 text-sm font-bold text-stone-950 transition hover:bg-lime-200">
                                Cari
                            </button>
                        </form>
                        <div className="relative mt-7 flex flex-wrap gap-x-5 gap-y-3 text-xs font-semibold text-stone-700">
                            <span className="inline-flex items-center gap-1.5">
                                <ShieldCheck className="size-4 text-lime-600" />
                                Produk terjamin
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <Truck className="size-4 text-lime-600" />
                                Antar area Pekanbaru
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <PackageCheck className="size-4 text-lime-600" />
                                Stok real-time
                            </span>
                        </div>
                    </div>
                    <div className="min-h-72 border-t border-stone-200 bg-white lg:min-h-130 lg:border-t-0 lg:border-l">
                        <img
                            src="/images/storefront/storefront-hero.png"
                            alt="Ilustrasi sementara toko dan layanan antar Putera Kembar"
                            className="size-full object-cover object-right"
                        />
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
                <SectionTitle
                    eyebrow="Mulai belanja"
                    title="Cari berdasarkan kebutuhan"
                    actionHref="/katalog"
                    action="Lihat katalog"
                />
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                    {categories.map((category: any) => (
                        <Link
                            key={category.id}
                            href={`/katalog?category=${category.slug}`}
                            className="group rounded-2xl border border-stone-200 bg-white p-4 transition hover:border-lime-300 hover:bg-lime-50"
                        >
                            {category.image_path ? (
                                <img
                                    src={`/storage/${category.image_path}`}
                                    alt=""
                                    className="size-11 rounded-xl object-cover"
                                />
                            ) : (
                                <CategoryIcon
                                    icon={category.icon}
                                    label={category.name}
                                />
                            )}
                            <p className="mt-5 font-bold text-stone-900">
                                {category.name}
                            </p>
                            <p className="mt-1 text-xs text-stone-500">
                                Lihat pilihan
                            </p>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="relative overflow-hidden border-y border-stone-200 bg-[#fafaf3] px-4 py-10 sm:py-14">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-10 right-[-7rem] size-72 rounded-full border border-lime-200"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-24 right-20 hidden size-16 rotate-12 rounded-3xl border border-lime-300 md:block"
                />
                <div className="mx-auto max-w-7xl">
                    <SectionTitle
                        eyebrow="Informasi toko"
                        title="Kabar penting untuk belanja Anda"
                        actionHref={informationBanner.cta_url}
                        action={informationBanner.cta_label}
                    />
                    <Link
                        href={informationBanner.cta_url}
                        className="group relative mt-5 block overflow-hidden rounded-3xl border border-lime-300 bg-lime-300 p-6 text-stone-950 transition hover:bg-lime-200 sm:p-8"
                    >
                        <span
                            aria-hidden="true"
                            className="absolute -top-12 right-8 size-40 rounded-full border-[18px] border-white/45"
                        />
                        <span
                            aria-hidden="true"
                            className="absolute right-28 bottom-[-2.5rem] size-24 rotate-12 rounded-3xl border-2 border-lime-700/25"
                        />
                        <div className="relative max-w-2xl">
                            <span className="inline-flex rounded-full border border-lime-700/25 bg-white/55 px-3 py-1 text-[11px] font-bold tracking-[0.14em] text-lime-950 uppercase">
                                Informasi untuk pelanggan
                            </span>
                            <h3 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
                                {informationBanner.title}
                            </h3>
                            <p className="mt-3 max-w-xl text-sm leading-6 text-stone-700 sm:text-base">
                                {informationBanner.subtitle}
                            </p>
                            <span className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-stone-950">
                                {informationBanner.cta_label}
                                <ArrowRight className="size-4 transition group-hover:translate-x-1" />
                            </span>
                        </div>
                    </Link>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
                <SectionTitle
                    eyebrow="Favorit pelanggan"
                    title="Paling banyak dibeli minggu ini"
                    actionHref="/katalog"
                    action="Lihat semua produk"
                />
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                    {popularProducts.map((product: Product) => (
                        <PopularProductCard
                            key={product.id}
                            product={product}
                        />
                    ))}
                </div>
            </section>

            <section className="mx-auto grid max-w-7xl gap-4 px-4 pb-10 sm:pb-14 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                    <p className="text-xs font-bold tracking-[0.14em] text-lime-700 uppercase">
                        Belanja dengan tenang
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight">
                        Harga jelas di setiap satuan.
                    </h2>
                    <div className="mt-7 grid gap-4 sm:grid-cols-3">
                        <Info
                            icon={PackageCheck}
                            title="Satuan fleksibel"
                            text="Ons, pcs, renteng, hingga dus."
                        />
                        <Info
                            icon={ShieldCheck}
                            title="Stok terukur"
                            text="Ketersediaan diperbarui saat transaksi."
                        />
                        <Info
                            icon={Truck}
                            title="Pickup tersedia"
                            text="Ambil pesanan langsung di toko."
                        />
                    </div>
                </div>
                <div className="rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                    <MapPin className="size-6 text-lime-700" />
                    <p className="mt-7 text-xs font-bold tracking-[0.14em] text-stone-500 uppercase">
                        Toko utama
                    </p>
                    <h2 className="mt-2 text-2xl font-black">
                        {store?.name ?? 'Putera Kembar'}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                        {store?.address ?? 'Pekanbaru, Riau'}
                    </p>
                    <Link
                        href="/tentang"
                        className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-lime-700"
                    >
                        Lihat lokasi & cerita toko{' '}
                        <ArrowRight className="size-4" />
                    </Link>
                </div>
            </section>

            <section className="border-t border-stone-200 bg-white px-4 py-10 sm:py-14">
                <div className="mx-auto max-w-7xl">
                    <SectionTitle
                        eyebrow="Dari Putera Kembar"
                        title="Informasi belanja yang berguna"
                        actionHref="/promo"
                        action="Baca semua"
                    />
                    <div className="mt-5 grid gap-4 md:grid-cols-3">
                        {articles.length > 0 ? (
                            articles.map((article: any) => (
                                <Link
                                    key={article.id}
                                    href={`/blog/${article.slug}`}
                                    className="rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-lime-300"
                                >
                                    <Clock3 className="size-5 text-lime-700" />
                                    <p className="mt-6 text-xs text-stone-500">
                                        {new Date(
                                            article.published_at,
                                        ).toLocaleDateString('id-ID')}
                                    </p>
                                    <h3 className="mt-2 text-lg font-black">
                                        {article.title}
                                    </h3>
                                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">
                                        {article.excerpt}
                                    </p>
                                </Link>
                            ))
                        ) : (
                            <p className="text-sm text-stone-500">
                                Artikel baru akan hadir di sini.
                            </p>
                        )}
                    </div>
                </div>
            </section>
        </StorefrontLayout>
    );
}

function SectionTitle({
    eyebrow,
    title,
    actionHref,
    action,
}: {
    eyebrow: string;
    title: string;
    actionHref: string;
    action: string;
}) {
    return (
        <div className="flex items-end justify-between gap-4">
            <div>
                <p className="text-[11px] font-bold tracking-[0.14em] text-lime-700 uppercase">
                    {eyebrow}
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight text-stone-950 sm:text-3xl">
                    {title}
                </h2>
            </div>
            <Link
                href={actionHref}
                className="hidden items-center gap-1 text-sm font-bold text-lime-700 sm:inline-flex"
            >
                {action}
                <ArrowRight className="size-4" />
            </Link>
        </div>
    );
}

function PopularProductCard({ product }: { product: Product }) {
    return (
        <Link
            href={`/product/${product.slug}`}
            className="overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:border-lime-300"
        >
            <div className="aspect-square bg-stone-50">
                {product.images[0] ? (
                    <img
                        src={product.images[0].url}
                        alt={product.name}
                        className="size-full object-cover"
                    />
                ) : (
                    <div className="grid size-full place-items-center">
                        <Store className="size-7 text-stone-300" />
                    </div>
                )}
            </div>
            <div className="p-4">
                <p className="text-xs text-stone-500">
                    {product.category?.name ?? 'Kebutuhan harian'}
                </p>
                <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold text-stone-950">
                    {product.name}
                </h3>
                <p className="mt-3 text-sm font-black text-lime-700">
                    {product.display_price_prefix === 'mulai' ? 'Mulai ' : ''}
                    {product.display_quote
                        ? money.format(product.display_quote.unit_price)
                        : 'Harga tersedia'}
                    {product.display_quote && (
                        <span className="font-medium text-stone-500">
                            {' '}
                            /{product.display_quote.unit_symbol}
                        </span>
                    )}
                </p>
            </div>
        </Link>
    );
}

function Info({
    icon: Icon,
    title,
    text,
}: {
    icon: typeof Truck;
    title: string;
    text: string;
}) {
    return (
        <div>
            <Icon className="size-5 text-lime-700" />
            <p className="mt-3 text-sm font-bold">{title}</p>
            <p className="mt-1 text-xs leading-5 text-stone-500">{text}</p>
        </div>
    );
}

function CategoryIcon({ icon, label }: { icon: string | null; label: string }) {
    const Icon = categoryIconMap[icon ?? 'package-open'] ?? PackageOpen;

    return (
        <span className="grid size-11 place-items-center rounded-xl bg-lime-100 text-lime-800">
            <Icon className="size-5" aria-label={label} />
        </span>
    );
}
