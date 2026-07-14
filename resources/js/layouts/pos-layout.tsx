import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import React from 'react';

interface PosLayoutProps {
    children: ReactNode;
    title?: string;
    headerActions?: ReactNode;
}

export default function PosLayout({
    children,
    title,
    headerActions,
}: PosLayoutProps) {
    return (
        <div className="flex h-screen flex-col overflow-hidden bg-white">
            {title && <Head title={title} />}
            <header className="flex min-h-16 items-center justify-between gap-3 border-b border-stone-200 bg-white px-3 py-2 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                    <h1 className="flex min-w-0 items-center text-sm font-bold tracking-tight text-stone-800 sm:text-lg">
                        <span className="mr-2 inline-flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-lime-200 bg-white">
                            <img
                                src="/images/brand/logo-putera-kembar.png"
                                alt="Logo Toko Putera Kembar"
                                className="size-14 max-w-none object-contain"
                            />
                        </span>
                        <span className="truncate">Kasir Putera Kembar</span>
                    </h1>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                    {headerActions}
                    <Link
                        href="/admin/dashboard"
                        className="hidden min-h-10 items-center rounded-lg border border-stone-200 px-3 py-2 text-sm font-semibold text-stone-600 hover:bg-stone-50 sm:inline-flex"
                    >
                        Kembali ke Dashboard
                    </Link>
                </div>
            </header>
            <main className="flex-1 overflow-hidden">{children}</main>
        </div>
    );
}
