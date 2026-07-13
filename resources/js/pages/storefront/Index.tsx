import { Head, Link, router } from '@inertiajs/react';
import {
    Search,
    Tag,
    Truck,
    ShieldCheck,
    RotateCcw,
    Phone,
} from 'lucide-react';
import React, { useState } from 'react';
import StorefrontLayout from '@/layouts/StorefrontLayout';

interface Product {
    id: number;
    name: string;
    slug: string;
    description_short: string | null;
    stok_saat_ini: number;
    image_primary_path: string | null;
    category: { name: string; slug: string } | null;
    prices: { price: number; min_qty: number }[];
    images: { image_path: string }[];
}

interface Category {
    id: number;
    name: string;
    slug: string;
    children?: Category[];
}

interface Props {
    products: {
        data: Product[];
        total: number;
    };
    categories: Category[];
    filters: { search?: string; category?: string };
    homePage?: any;
}

const categoryIcons: Record<string, string> = {
    minuman: '🧃',
    makanan: '🍜',
    sembako: '🛒',
    rokok: '🚬',
    kebersihan: '🧹',
};

const features = [
    {
        icon: Truck,
        title: 'Gratis Ongkir',
        desc: 'Min. pembelian Rp 500rb',
        color: 'text-blue-500',
    },
    {
        icon: ShieldCheck,
        title: 'Produk Terjamin',
        desc: 'Semua produk resmi & asli',
        color: 'text-green-500',
    },
    {
        icon: RotateCcw,
        title: 'Retur Mudah',
        desc: 'Barang cacat diganti gratis',
        color: 'text-orange-500',
    },
    {
        icon: Phone,
        title: 'CS 7/24',
        desc: 'WhatsApp & Telepon siap bantu',
        color: 'text-purple-500',
    },
];

export default function StorefrontIndex({
    products,
    categories,
    filters,
}: Props) {
    const [search, setSearch] = useState(filters.search || '');

    const formatRupiah = (value: number) =>
        new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(value);

    const getRetailPrice = (product: Product) => {
        if (!product.prices?.length) {
            return null;
        }

        const retail =
            product.prices.find((p) => p.min_qty === 1) ?? product.prices[0];

        return retail?.price ?? null;
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/', { search }, { preserveState: true });
    };

    const handleCategoryFilter = (slug: string) => {
        router.get(
            '/',
            { category: slug === filters.category ? undefined : slug },
            { preserveState: true },
        );
    };

    return (
        <StorefrontLayout title="Toko Grosir Putera Kembar">
            <Head>
                <title>
                    Toko Grosir Putera Kembar — Belanja Grosir Mudah & Hemat
                </title>
                <meta
                    name="description"
                    content="Toko grosir kebutuhan sehari-hari terpercaya. Harga kompetitif, produk lengkap, pengiriman cepat."
                />
            </Head>

            {/* Hero Section */}
            {!filters.search && !filters.category && (
                <section className="bg-gradient-to-br from-primary/90 to-primary/60 px-4 py-16 text-white">
                    <div className="container mx-auto max-w-5xl">
                        <div className="flex flex-col items-center gap-6 text-center">
                            <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium">
                                <Tag className="h-3.5 w-3.5" />
                                Harga Grosir Terbaik
                            </div>
                            <h1 className="text-4xl leading-tight font-bold sm:text-5xl">
                                Belanja Grosir
                                <br />
                                <span className="text-yellow-300">
                                    Lebih Mudah & Hemat
                                </span>
                            </h1>
                            <p className="max-w-xl text-lg text-white/80">
                                Putera Kembar menyediakan ribuan produk
                                kebutuhan sehari-hari dengan harga grosir
                                bersaing langsung dari distributor.
                            </p>
                            <form
                                onSubmit={handleSearch}
                                className="flex w-full max-w-lg gap-2"
                            >
                                <div className="relative flex-1">
                                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="text"
                                        placeholder="Cari produk (misal: indomie, aqua...)"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        className="h-11 w-full rounded-xl border-0 pr-4 pl-10 text-sm text-gray-900 focus:ring-2 focus:ring-white/50 focus:outline-none"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="h-11 rounded-xl bg-yellow-400 px-5 text-sm font-semibold text-yellow-900 transition-colors hover:bg-yellow-300"
                                >
                                    Cari
                                </button>
                            </form>
                        </div>
                    </div>
                </section>
            )}

            {/* Features */}
            {!filters.search && !filters.category && (
                <section className="border-b border-border bg-card">
                    <div className="container mx-auto max-w-5xl px-4 py-6">
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {features.map((f) => (
                                <div
                                    key={f.title}
                                    className="flex items-center gap-3"
                                >
                                    <div
                                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-current/10 ${f.color}`}
                                        style={{
                                            background: 'currentColor',
                                            opacity: 0.1,
                                        }}
                                    >
                                        <f.icon
                                            className={`h-5 w-5 ${f.color}`}
                                            style={{ opacity: 1 }}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            {f.title}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {f.desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            <div className="container mx-auto max-w-6xl space-y-8 px-4 py-8">
                {/* Categories */}
                {categories.length > 0 && (
                    <section id="produk" className="scroll-mt-28">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-foreground">
                                Kategori Produk
                            </h2>
                            {filters.category && (
                                <button
                                    onClick={() => router.get('/', {})}
                                    className="text-sm text-primary hover:underline"
                                >
                                    Lihat Semua
                                </button>
                            )}
                        </div>
                        <div className="scrollbar-hide flex gap-3 overflow-x-auto pb-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() =>
                                        handleCategoryFilter(cat.slug)
                                    }
                                    className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-all ${
                                        filters.category === cat.slug
                                            ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                            : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-primary/5'
                                    }`}
                                >
                                    <span className="text-base">
                                        {categoryIcons[cat.slug] ?? '📦'}
                                    </span>
                                    {cat.name}
                                </button>
                            ))}
                        </div>
                    </section>
                )}

                {/* Search bar (when not on hero) */}
                {(filters.search || filters.category) && (
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Cari produk..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="h-10 w-full rounded-lg border border-border bg-card pr-4 pl-10 text-sm focus:ring-2 focus:ring-primary/50 focus:outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            className="h-10 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                        >
                            Cari
                        </button>
                    </form>
                )}

                {/* Products Grid */}
                <section>
                    <div className="mb-4 flex items-center justify-between">
                        <h2 className="text-lg font-bold text-foreground">
                            {filters.search
                                ? `Hasil Pencarian "${filters.search}"`
                                : filters.category
                                  ? `Produk ${categories.find((c) => c.slug === filters.category)?.name ?? ''}`
                                  : 'Produk Unggulan'}
                        </h2>
                        <span className="text-sm text-muted-foreground">
                            {products.total} produk
                        </span>
                    </div>

                    {products.data.length === 0 ? (
                        <div className="py-20 text-center text-muted-foreground">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                                <Search className="h-8 w-8 opacity-40" />
                            </div>
                            <p className="font-medium">
                                Produk tidak ditemukan
                            </p>
                            <p className="mt-1 text-sm">
                                Coba kata kunci atau kategori yang berbeda
                            </p>
                            <button
                                onClick={() => router.get('/', {})}
                                className="mt-4 text-sm text-primary hover:underline"
                            >
                                Kembali ke Beranda
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                            {products.data.map((product) => {
                                const price = getRetailPrice(product);
                                const isOutOfStock = product.stok_saat_ini <= 0;

                                return (
                                    <Link
                                        key={product.id}
                                        href={`/product/${product.slug}`}
                                        className={`group overflow-hidden rounded-xl border border-border bg-card transition-all hover:border-primary/30 hover:shadow-md ${isOutOfStock ? 'opacity-60' : ''}`}
                                    >
                                        {/* Product Image */}
                                        <div className="flex aspect-square items-center justify-center overflow-hidden bg-muted">
                                            {product.images?.[0]?.image_path ? (
                                                <img
                                                    src={`/storage/${product.images[0].image_path}`}
                                                    alt={product.name}
                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 text-4xl">
                                                    {categoryIcons[
                                                        product.category
                                                            ?.slug ?? ''
                                                    ] ?? '📦'}
                                                </div>
                                            )}
                                            {isOutOfStock && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                                                    <span className="rounded bg-black/60 px-2 py-1 text-xs font-medium text-white">
                                                        Habis
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Info */}
                                        <div className="space-y-1.5 p-3">
                                            {product.category && (
                                                <span className="text-[10px] font-medium tracking-wide text-primary uppercase">
                                                    {product.category.name}
                                                </span>
                                            )}
                                            <p className="line-clamp-2 text-sm leading-snug font-semibold text-foreground transition-colors group-hover:text-primary">
                                                {product.name}
                                            </p>
                                            {price ? (
                                                <p className="text-base font-bold text-primary">
                                                    {formatRupiah(price)}
                                                </p>
                                            ) : (
                                                <p className="text-sm text-muted-foreground">
                                                    Hubungi kami
                                                </p>
                                            )}
                                            <p className="text-[10px] text-muted-foreground">
                                                Stok:{' '}
                                                {Number(
                                                    product.stok_saat_ini,
                                                ).toLocaleString('id-ID', {
                                                    maximumFractionDigits: 3,
                                                })}{' '}
                                                pcs
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* CTA Section */}
                {!filters.search && !filters.category && (
                    <section className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 p-8 text-center">
                        <h2 className="mb-2 text-xl font-bold text-foreground">
                            Ingin Harga Lebih Hemat?
                        </h2>
                        <p className="mb-4 text-muted-foreground">
                            Daftar sebagai member grosir dan dapatkan harga
                            spesial + cashback poin untuk setiap pembelian.
                        </p>
                        <div className="flex flex-wrap justify-center gap-3">
                            <Link
                                href="/akun/daftar"
                                className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                Daftar Gratis
                            </Link>
                            <Link
                                href="/akun/masuk"
                                className="rounded-xl border border-primary px-6 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
                            >
                                Masuk
                            </Link>
                        </div>
                    </section>
                )}
            </div>
        </StorefrontLayout>
    );
}
