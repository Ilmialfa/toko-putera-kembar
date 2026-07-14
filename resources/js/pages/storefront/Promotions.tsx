import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BadgePercent,
    CalendarDays,
    Newspaper,
} from 'lucide-react';

import StorefrontLayout from '@/layouts/StorefrontLayout';

export default function Promotions({ promotions, articles }: any) {
    return (
        <StorefrontLayout title="Promo & Informasi">
            <Head>
                <meta
                    name="description"
                    content="Promo grosir aktif dan informasi terbaru dari Toko Putera Kembar."
                />
            </Head>
            <section className="relative overflow-hidden border-b border-stone-200 bg-white px-4 py-12 sm:py-16">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-24 right-[8%] size-72 rounded-full border border-lime-200"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-20 right-[16%] hidden size-16 rotate-12 rounded-3xl border border-lime-300 sm:block"
                />
                <div className="relative mx-auto max-w-7xl">
                    <p className="text-xs font-bold tracking-[0.16em] text-lime-700 uppercase">
                        Hemat setiap belanja
                    </p>
                    <h1 className="mt-3 max-w-2xl text-4xl font-black tracking-[-0.04em] text-stone-950 sm:text-5xl">
                        Promo aktif dan informasi pilihan.
                    </h1>
                    <p className="mt-4 max-w-xl text-base leading-7 text-stone-600">
                        Penawaran yang dapat digunakan saat belanja online,
                        ditambah inspirasi untuk kebutuhan rumah dan warung.
                    </p>
                </div>
            </section>

            <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-xs font-bold tracking-[0.14em] text-stone-500 uppercase">
                            Sedang berlangsung
                        </p>
                        <h2 className="mt-1 text-3xl font-black">Promo toko</h2>
                    </div>
                    <BadgePercent className="size-7 text-lime-700" />
                </div>
                {promotions.length > 0 ? (
                    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {promotions.map((promotion: any, index: number) => (
                            <article
                                key={promotion.id}
                                className={`relative overflow-hidden rounded-3xl border ${index % 3 === 0 ? 'border-lime-400 bg-white' : 'border-stone-200 bg-white'}`}
                            >
                                {promotion.storefront_image_path ? (
                                    <img
                                        src={`/storage/${promotion.storefront_image_path}`}
                                        alt=""
                                        className="h-48 w-full object-cover"
                                    />
                                ) : (
                                    <span
                                        aria-hidden="true"
                                        className="absolute -top-7 -right-7 size-24 rounded-full border border-lime-200"
                                    />
                                )}
                                <div className="p-6">
                                    <BadgePercent className="size-6 text-lime-800" />
                                    <p className="mt-6 text-[11px] font-bold tracking-[0.14em] text-lime-800 uppercase">
                                        {promotion.storefront_badge ??
                                            promotion.type.replaceAll('_', ' ')}
                                    </p>
                                    <h3 className="mt-2 text-2xl font-black">
                                        {promotion.storefront_title ??
                                            promotion.name}
                                    </h3>
                                    <p className="mt-3 text-sm text-stone-600">
                                        {promotion.storefront_summary ??
                                            promotion.description ??
                                            'Promo akan diterapkan otomatis apabila syarat belanja terpenuhi.'}
                                    </p>
                                    <p className="mt-6 inline-flex items-center gap-2 text-xs font-bold text-stone-700">
                                        <CalendarDays className="size-4" />
                                        Sampai{' '}
                                        {new Date(
                                            promotion.end_date,
                                        ).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </p>
                                </div>
                            </article>
                        ))}
                    </div>
                ) : (
                    <EmptyState />
                )}
            </section>

            <section className="border-t border-stone-200 bg-white px-4 py-10 sm:py-14">
                <div className="mx-auto max-w-7xl">
                    <div>
                        <p className="text-xs font-bold tracking-[0.14em] text-lime-700 uppercase">
                            Informasi belanja
                        </p>
                        <h2 className="mt-1 text-3xl font-black">
                            Artikel terbaru
                        </h2>
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {articles.data.length > 0 ? (
                            articles.data.map((article: any) => (
                                <Link
                                    key={article.id}
                                    href={`/blog/${article.slug}`}
                                    className="rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-lime-300"
                                >
                                    {article.cover_image_path ? (
                                        <img
                                            src={`/storage/${article.cover_image_path}`}
                                            alt=""
                                            className="mb-5 aspect-[16/9] w-full rounded-xl object-cover"
                                        />
                                    ) : (
                                        <Newspaper className="size-6 text-lime-700" />
                                    )}
                                    <p className="mt-5 text-xs text-stone-500">
                                        {new Date(
                                            article.published_at,
                                        ).toLocaleDateString('id-ID')}
                                    </p>
                                    <h3 className="mt-2 text-lg font-black">
                                        {article.title}
                                    </h3>
                                    <p className="mt-2 line-clamp-3 text-sm leading-6 text-stone-600">
                                        {article.excerpt}
                                    </p>
                                    <span className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-lime-700">
                                        Baca artikel{' '}
                                        <ArrowRight className="size-4" />
                                    </span>
                                </Link>
                            ))
                        ) : (
                            <EmptyState />
                        )}
                    </div>
                </div>
            </section>
        </StorefrontLayout>
    );
}

function EmptyState() {
    return (
        <div className="rounded-3xl border border-dashed border-stone-300 bg-white p-10 text-center text-sm text-stone-500">
            Informasi baru akan tampil di sini.
        </div>
    );
}
