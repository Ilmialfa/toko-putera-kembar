import { Head } from '@inertiajs/react';
import React from 'react';

interface PosLayoutProps {
    children: React.ReactNode;
    title?: string;
}

export default function PosLayout({ children, title }: PosLayoutProps) {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            {title && <Head title={title} />}

            {/* POS Sidebar (Collapsed by default, icon only) */}
            <aside className="flex w-[72px] shrink-0 flex-col items-center border-r border-border bg-card py-4">
                <div className="mb-8 flex h-10 w-10 items-center justify-center rounded-xl bg-primary font-bold text-primary-foreground">
                    PK
                </div>

                <nav className="flex flex-col gap-4">
                    <button className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="9" cy="21" r="1" />
                            <circle cx="20" cy="21" r="1" />
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                        </svg>
                    </button>
                    {/* Add more pos menu icons */}
                </nav>
            </aside>

            {/* Main Content POS */}
            <main className="flex min-w-0 flex-1 overflow-hidden">
                {children}
            </main>
        </div>
    );
}
