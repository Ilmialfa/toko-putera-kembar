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
        <div className="flex h-screen flex-col overflow-hidden bg-[#f4f6f0]">
            {title && <Head title={title} />}
            <header className="flex min-h-16 items-center justify-between gap-3 border-b border-stone-200 bg-white px-3 py-2 sm:px-5">
                <div className="flex min-w-0 items-center gap-3">
                    <h1 className="flex min-w-0 items-center text-sm font-bold tracking-tight text-stone-800 sm:text-lg">
                        <span className="mr-2 inline-flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground">
                            PK
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
