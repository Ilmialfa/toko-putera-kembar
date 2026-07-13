import { Head, Link } from '@inertiajs/react';
import type { ReactNode } from 'react';
import React from 'react';

interface PosLayoutProps {
    children: ReactNode;
    title?: string;
}

export default function PosLayout({ children, title }: PosLayoutProps) {
    return (
        <div className="flex h-screen flex-col overflow-hidden bg-[#f4f6f0]">
            {title && <Head title={title} />}
            <header className="flex h-16 items-center justify-between border-b border-black/5 bg-[#171a15] px-4 text-white shadow-sm sm:px-6">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-semibold tracking-tight">
                        <span className="mr-2 inline-flex size-8 items-center justify-center rounded-lg bg-primary text-xs font-black text-primary-foreground">
                            PK
                        </span>
                        Kasir Putera Kembar
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    <Link
                        href="/admin/dashboard"
                        className="rounded-lg border border-white/15 px-3 py-2 text-sm font-semibold text-white/75 transition hover:bg-white/10 hover:text-white"
                    >
                        Kembali ke Dashboard
                    </Link>
                </div>
            </header>
            <main className="flex-1 overflow-hidden">{children}</main>
        </div>
    );
}
