import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    HeartHandshake,
    MapPin,
    Store,
    Target,
    Users,
} from 'lucide-react';

import StorefrontLayout from '@/layouts/StorefrontLayout';

export default function CompanyProfile({ cmsPage, store }: any) {
    const story = cmsPage?.sections?.find(
        (section: any) => section.section_type === 'text_block',
    )?.content_json;

    return (
        <StorefrontLayout title="Tentang Putera Kembar">
            <Head>
                <meta
                    name="description"
                    content="Cerita, nilai, dan lokasi Toko Putera Kembar."
                />
            </Head>
            <section className="border-b border-stone-200 bg-stone-50 px-4 py-12 sm:py-16">
                <div className="mx-auto max-w-7xl">
                    <p className="text-xs font-bold tracking-[0.16em] text-lime-700 uppercase">
                        Tentang kami
                    </p>
                    <h1 className="mt-3 max-w-3xl text-4xl font-black tracking-[-0.04em] sm:text-5xl">
                        Tumbuh bersama kebutuhan harian warga Pekanbaru.
                    </h1>
                    <p className="mt-5 max-w-2xl text-base leading-7 text-stone-600">
                        Kami merapikan pengalaman belanja grosir: pilihan barang
                        lengkap, harga yang mudah dipahami, dan layanan yang
                        tetap dekat.
                    </p>
                </div>
            </section>
            <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:py-14 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
                <div className="overflow-hidden rounded-3xl border border-stone-200 bg-stone-50">
                    <img
                        src="/images/storefront/owner-putera-kembar.png"
                        alt="Owner Toko Putera Kembar"
                        className="aspect-[4/5] w-full object-cover"
                    />
                    <p className="border-t border-stone-200 bg-white px-4 py-3 text-xs text-stone-500">
                        Elvina Susanti - Owner.
                    </p>
                </div>
                <div>
                    <p className="text-xs font-bold tracking-[0.14em] text-lime-700 uppercase">
                        Cerita Putera Kembar
                    </p>
                    <h2 className="mt-2 text-3xl font-black">
                        Toko retail dan grosir yang lengkap untuk kebutuhan anda.
                    </h2>
                    <p className="mt-5 text-base leading-7 text-stone-600">
                        {story?.content ??
                            'Putera Kembar dimulai dari komitmen sederhana: menyediakan kebutuhan sehari-hari dengan pelayanan jujur dan stok yang dapat diandalkan. Kini kami membantu keluarga, warung, dan usaha kecil berbelanja dengan cara yang lebih praktis.'}
                    </p>
                    <div className="mt-7 grid gap-4 sm:grid-cols-3">
                        <Value
                            icon={HeartHandshake}
                            title="Dekat"
                            text="Mendengar kebutuhan pelanggan."
                        />
                        <Value
                            icon={Target}
                            title="Jelas"
                            text="Harga dan satuan transparan."
                        />
                        <Value
                            icon={Users}
                            title="Bertumbuh"
                            text="Maju bersama pelanggan."
                        />
                    </div>
                </div>
            </section>
            <section className="relative overflow-hidden border-y border-stone-200 bg-white px-4 py-10 sm:py-14">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -right-20 bottom-[-8rem] size-72 rounded-full border border-lime-200"
                />
                <div className="mx-auto grid max-w-7xl gap-5 lg:grid-cols-2">
                    <div className="rounded-3xl border border-lime-200 bg-white p-6 sm:p-8">
                        <Store className="size-7 text-lime-700" />
                        <h2 className="mt-7 text-2xl font-black">
                            Cara kami melayani
                        </h2>
                        <ol className="mt-5 grid gap-4 text-sm leading-6 text-stone-600">
                            <li>
                                <strong className="text-stone-950">
                                    01. Pilih dengan mudah.
                                </strong>{' '}
                                Cari kebutuhan berdasarkan kategori dan satuan
                                jual.
                            </li>
                            <li>
                                <strong className="text-stone-950">
                                    02. Harga dihitung tepat.
                                </strong>{' '}
                                Promo dan harga grosir diterapkan pada transaksi
                                yang memenuhi syarat.
                            </li>
                            <li>
                                <strong className="text-stone-950">
                                    03. Ambil atau tunggu antar.
                                </strong>{' '}
                                Gunakan pickup, atau cek radius pengantaran
                                sebelum checkout.
                            </li>
                        </ol>
                    </div>
                    <div className="rounded-3xl border border-lime-200 bg-white p-6 sm:p-8">
                        <MapPin className="size-7 text-lime-700" />
                        <p className="mt-7 text-xs font-bold tracking-[0.14em] text-stone-500 uppercase">
                            Lokasi toko utama
                        </p>
                        <h2 className="mt-2 text-2xl font-black">
                            {store?.name ?? 'Toko Putera Kembar'}
                        </h2>
                        <p className="mt-4 text-sm leading-6 text-stone-600">
                            {store?.address ?? 'Pekanbaru, Riau'}
                        </p>
                        <p className="mt-3 text-sm text-stone-600">
                            Hubungi: {store?.phone ?? '—'}
                        </p>
                        <Link
                            href="/katalog"
                            className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-lime-700"
                        >
                            Mulai belanja <ArrowRight className="size-4" />
                        </Link>
                    </div>
                </div>
            </section>
        </StorefrontLayout>
    );
}

function Value({
    icon: Icon,
    title,
    text,
}: {
    icon: typeof Store;
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
