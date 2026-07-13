import { Link } from '@inertiajs/react';
import {
    BadgeCheck,
    BarChart3,
    PackageCheck,
    ShoppingBasket,
} from 'lucide-react';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    return (
        <div className="grid min-h-svh bg-[#f7f5ef] lg:grid-cols-[1.08fr_0.92fr]">
            <section className="relative hidden overflow-hidden border-r border-stone-200 bg-lime-50 p-12 text-stone-800 lg:flex lg:flex-col lg:justify-between">
                <div className="absolute -top-32 -right-24 size-96 rounded-full bg-lime-300/40 blur-3xl" />
                <Link
                    href="/"
                    className="relative flex items-center gap-3 font-bold"
                >
                    <span className="grid size-11 place-items-center rounded-2xl bg-lime-400 text-stone-950">
                        <ShoppingBasket className="size-6" />
                    </span>
                    <span>Toko Putera Kembar</span>
                </Link>
                <div className="relative max-w-xl">
                    <p className="text-xs font-bold tracking-[0.2em] text-lime-700 uppercase">
                        Retail operating system
                    </p>
                    <h2 className="mt-4 text-5xl leading-[1.08] font-bold tracking-tight">
                        Satu pusat kendali untuk toko yang tumbuh.
                    </h2>
                    <p className="mt-5 text-base leading-7 text-stone-600">
                        Pantau penjualan, stok, pesanan online, promo, dan
                        keuangan dalam pengalaman kerja yang lebih tenang.
                    </p>
                    <div className="mt-9 grid grid-cols-3 gap-3 text-xs">
                        <Feature icon={BarChart3} label="Insight real-time" />
                        <Feature icon={PackageCheck} label="Stok terkendali" />
                        <Feature icon={BadgeCheck} label="Akses aman" />
                    </div>
                </div>
                <p className="relative text-xs text-stone-600">
                    Backoffice internal · Toko Putera Kembar
                </p>
            </section>
            <section className="flex items-center justify-center p-5 sm:p-10">
                <div className="w-full max-w-md rounded-[2rem] border border-stone-200 bg-white p-7 sm:p-9">
                    <Link
                        href="/"
                        className="mb-8 flex items-center gap-3 font-bold lg:hidden"
                    >
                        <span className="grid size-10 place-items-center rounded-xl bg-lime-400">
                            <ShoppingBasket className="size-5" />
                        </span>
                        Toko Putera Kembar
                    </Link>
                    <div className="mb-8">
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-700 uppercase">
                            Akses staf
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-950">
                            {title}
                        </h1>
                        <p className="mt-2 text-sm text-stone-500">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </section>
        </div>
    );
}

function Feature({
    icon: Icon,
    label,
}: {
    icon: typeof BarChart3;
    label: string;
}) {
    return (
        <div className="rounded-2xl border border-lime-200 bg-white/70 p-4">
            <Icon className="mb-3 size-5 text-lime-700" />
            <span className="text-stone-700">{label}</span>
        </div>
    );
}
