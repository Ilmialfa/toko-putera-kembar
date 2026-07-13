import { Link, usePage } from '@inertiajs/react';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSplitLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative grid h-dvh flex-col items-center justify-center px-8 sm:px-0 lg:max-w-none lg:grid-cols-2 lg:px-0">
            <div className="relative hidden h-full flex-col overflow-hidden border-r border-stone-200 bg-lime-50 p-10 text-stone-800 lg:flex">
                <div className="absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute right-[-10rem] bottom-[-9rem] h-[34rem] w-[34rem] rounded-full border-[5rem] border-primary/10" />
                <Link
                    href={home()}
                    className="relative z-20 flex items-center text-lg font-medium"
                >
                    <span className="mr-3 flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground">
                        PK
                    </span>
                    {name}
                </Link>
                <div className="relative z-20 mt-auto max-w-xl pb-12">
                    <p className="mb-5 text-xs font-bold tracking-[0.25em] text-primary uppercase">
                        Operasional dalam satu layar
                    </p>
                    <h2 className="text-5xl leading-[1.05] font-bold tracking-tight">
                        Kelola toko lebih cepat, rapi, dan terukur.
                    </h2>
                    <p className="mt-6 max-w-lg text-base leading-7 text-stone-600">
                        Pantau penjualan, stok, harga grosir, keuangan, dan tim
                        Putera Kembar dari satu backoffice modern.
                    </p>
                </div>
            </div>
            <div className="w-full lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <Link
                        href={home()}
                        className="relative z-20 flex items-center justify-center lg:hidden"
                    >
                        <span className="flex size-12 items-center justify-center rounded-xl bg-primary text-sm font-black text-primary-foreground">
                            PK
                        </span>
                    </Link>
                    <div className="flex flex-col items-start gap-2 text-left sm:items-center sm:text-center">
                        <h1 className="text-xl font-medium">{title}</h1>
                        <p className="text-sm text-balance text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
}
