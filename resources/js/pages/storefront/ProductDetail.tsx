import { Link, router } from '@inertiajs/react';
import React, { useState } from 'react';
import StorefrontLayout from '@/layouts/StorefrontLayout';

export default function ProductDetail({ product }: any) {
    const [qty, setQty] = useState(1);

    const handleAddToCart = () => {
        router.post(
            '/cart',
            {
                product_id: product.id,
                unit_id: product.base_unit_id,
                qty: qty,
            },
            {
                preserveScroll: true,
            },
        );
    };

    return (
        <StorefrontLayout title={product.name}>
            <div className="container mx-auto px-4 py-8">
                <div className="mb-6 text-sm text-muted-foreground">
                    <Link href="/" className="hover:text-primary">
                        Beranda
                    </Link>
                    <span className="mx-2">/</span>
                    <Link
                        href={`/?category=${product.category?.slug}`}
                        className="hover:text-primary"
                    >
                        {product.category?.name}
                    </Link>
                    <span className="mx-2">/</span>
                    <span className="text-foreground">{product.name}</span>
                </div>

                <div className="grid grid-cols-1 gap-12 md:grid-cols-2">
                    {/* Product Images */}
                    <div>
                        <div className="aspect-square overflow-hidden rounded-2xl border bg-secondary/30">
                            {product.images?.length > 0 ? (
                                <img
                                    src={product.images[0].path}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-muted-foreground/30">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="64"
                                        height="64"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    >
                                        <rect
                                            width="18"
                                            height="18"
                                            x="3"
                                            y="3"
                                            rx="2"
                                            ry="2"
                                        />
                                        <circle cx="9" cy="9" r="2" />
                                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                                    </svg>
                                </div>
                            )}
                        </div>
                        {/* Thumbnail gallery would go here */}
                    </div>

                    {/* Product Info */}
                    <div>
                        <h1 className="mb-2 text-3xl font-bold">
                            {product.name}
                        </h1>
                        <div className="mb-6 flex items-center gap-4 text-sm text-muted-foreground">
                            <span>SKU: {product.sku}</span>
                            {product.brand && (
                                <>
                                    <span className="h-1 w-1 rounded-full bg-muted-foreground"></span>
                                    <span>Brand: {product.brand.name}</span>
                                </>
                            )}
                        </div>

                        <div className="mb-8">
                            <div className="text-3xl font-bold text-primary">
                                Rp{' '}
                                {product.prices
                                    ?.find(
                                        (p: any) => p.price_type === 'retail',
                                    )
                                    ?.price?.toLocaleString() || '10.000'}
                            </div>
                            <div className="mt-1 text-sm text-muted-foreground">
                                / {product.base_unit?.name}
                            </div>
                        </div>

                        <div className="mb-8 flex items-center gap-4">
                            <div className="flex h-12 items-center rounded-lg border">
                                <button
                                    className="h-full rounded-l-lg px-4 transition-colors hover:bg-secondary"
                                    onClick={() => setQty(Math.max(1, qty - 1))}
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    className="h-full w-16 border-x bg-transparent text-center focus:outline-none"
                                    value={qty}
                                    onChange={(e) =>
                                        setQty(
                                            Math.max(
                                                1,
                                                parseInt(e.target.value) || 1,
                                            ),
                                        )
                                    }
                                />
                                <button
                                    className="h-full rounded-r-lg px-4 transition-colors hover:bg-secondary"
                                    onClick={() => setQty(qty + 1)}
                                >
                                    +
                                </button>
                            </div>
                            <button
                                onClick={handleAddToCart}
                                className="h-12 flex-1 rounded-lg bg-primary font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
                            >
                                Tambah ke Keranjang
                            </button>
                        </div>

                        <div className="border-t pt-6">
                            <h3 className="mb-3 text-lg font-semibold">
                                Deskripsi Produk
                            </h3>
                            <div className="prose prose-sm max-w-none text-muted-foreground">
                                {product.description_long ? (
                                    <div
                                        dangerouslySetInnerHTML={{
                                            __html: product.description_long,
                                        }}
                                    />
                                ) : (
                                    <p>
                                        {product.description_short ||
                                            'Tidak ada deskripsi.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
}
