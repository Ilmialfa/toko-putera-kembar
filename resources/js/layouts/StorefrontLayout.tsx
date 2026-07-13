import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    CircleUserRound,
    Home,
    Menu,
    PackageSearch,
    Search,
    ShoppingBag,
    Sparkles,
    Store,
    Truck,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { index as cartIndex } from '@/routes/cart';
import { account, login } from '@/routes/customer';
import { index as storefrontIndex } from '@/routes/storefront';

interface StorefrontLayoutProps {
    children: ReactNode;
    title?: string;
}

interface SharedProps {
    auth: { customer: { name: string } | null };
    cart_count: number;
}

export default function StorefrontLayout({
    children,
    title,
}: StorefrontLayoutProps) {
    const { auth, cart_count: cartCount } = usePage()
        .props as unknown as SharedProps;

    return (
        <div className="min-h-screen bg-background font-sans text-foreground">
            {title && <Head title={title} />}
            <div className="bg-foreground px-4 py-2 text-center text-xs font-semibold text-background">
                <span className="inline-flex items-center gap-2">
                    <Truck className="size-3.5 text-primary" /> Pengiriman cepat
                    area Pekanbaru • Harga grosir transparan
                </span>
            </div>

            <header className="sticky top-0 z-50 border-b border-border/80 bg-background/92 backdrop-blur-xl">
                <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 lg:px-6">
                    <Link
                        href={storefrontIndex.url()}
                        className="flex shrink-0 items-center gap-3"
                        prefetch
                    >
                        <span className="grid size-10 place-items-center rounded-2xl bg-primary text-sm font-black text-primary-foreground shadow-lg shadow-primary/20">
                            PK
                        </span>
                        <span className="hidden leading-tight sm:block">
                            <strong className="block text-sm tracking-tight">
                                Putera Kembar
                            </strong>
                            <span className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                                Grosir & Retail
                            </span>
                        </span>
                    </Link>

                    <nav className="ml-3 hidden items-center gap-1 lg:flex">
                        <NavLink href={storefrontIndex.url()} icon={Home}>
                            Beranda
                        </NavLink>
                        <NavLink
                            href={`${storefrontIndex.url()}#produk`}
                            icon={PackageSearch}
                        >
                            Katalog
                        </NavLink>
                        <NavLink href="/blog" icon={Sparkles}>
                            Promo & Tips
                        </NavLink>
                        <NavLink href="/about" icon={Store}>
                            Tentang
                        </NavLink>
                    </nav>

                    <Form
                        action={storefrontIndex()}
                        method="get"
                        className="relative ml-auto hidden max-w-md flex-1 md:block"
                    >
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                            name="search"
                            type="search"
                            aria-label="Cari produk"
                            placeholder="Cari mie, minuman, sembako..."
                            className="h-11 w-full rounded-2xl border border-border bg-card pr-4 pl-10 text-sm transition outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
                        />
                    </Form>

                    <div className="ml-auto flex items-center gap-2 md:ml-0">
                        <Link
                            href={auth.customer ? account.url() : login.url()}
                            className="hidden h-10 items-center gap-2 rounded-xl border border-border bg-card px-3 text-sm font-semibold transition hover:border-primary/40 hover:bg-primary/5 sm:flex"
                        >
                            <CircleUserRound className="size-4" />{' '}
                            {auth.customer
                                ? auth.customer.name.split(' ')[0]
                                : 'Masuk'}
                        </Link>
                        <Link
                            href={cartIndex.url()}
                            className="relative grid size-11 place-items-center rounded-2xl bg-foreground text-background transition hover:-translate-y-0.5"
                            aria-label="Keranjang belanja"
                        >
                            <ShoppingBag className="size-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-black text-primary-foreground ring-2 ring-background">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                        <button
                            type="button"
                            className="grid size-10 place-items-center rounded-xl border border-border lg:hidden"
                            aria-label="Buka menu"
                        >
                            <Menu className="size-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="min-h-[65vh] pb-20 md:pb-0">{children}</main>

            <footer className="mt-16 border-t border-border bg-foreground text-background">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.5fr_1fr_1fr] lg:px-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <span className="grid size-10 place-items-center rounded-2xl bg-primary font-black text-primary-foreground">
                                PK
                            </span>
                            <strong className="text-lg">
                                Toko Putera Kembar
                            </strong>
                        </div>
                        <p className="mt-4 max-w-md text-sm leading-6 text-background/65">
                            Partner belanja grosir kebutuhan harian untuk
                            keluarga, warung, dan usaha di Pekanbaru.
                        </p>
                    </div>
                    <div className="text-sm">
                        <p className="font-bold">Belanja</p>
                        <div className="mt-3 grid gap-2 text-background/65">
                            <Link href={storefrontIndex.url()}>
                                Katalog produk
                            </Link>
                            <Link href={cartIndex.url()}>Keranjang</Link>
                            <Link href="/faq">Bantuan</Link>
                        </div>
                    </div>
                    <div className="text-sm">
                        <p className="font-bold">Toko utama</p>
                        <p className="mt-3 leading-6 text-background/65">
                            Pekanbaru, Riau
                            <br />
                            Buka setiap hari
                            <br />
                            08.00–21.00 WIB
                        </p>
                    </div>
                </div>
                <div className="border-t border-background/10 px-4 py-4 text-center text-xs text-background/45">
                    © {new Date().getFullYear()} Toko Grosir Putera Kembar.
                    Dibuat untuk belanja lokal yang lebih mudah.
                </div>
            </footer>

            <nav className="fixed inset-x-3 bottom-3 z-50 grid grid-cols-4 rounded-2xl border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur md:hidden">
                <MobileLink href={storefrontIndex.url()} icon={Home}>
                    Home
                </MobileLink>
                <MobileLink
                    href={`${storefrontIndex.url()}#produk`}
                    icon={Search}
                >
                    Katalog
                </MobileLink>
                <MobileLink href={cartIndex.url()} icon={ShoppingBag}>
                    Keranjang
                </MobileLink>
                <MobileLink
                    href={auth.customer ? account.url() : login.url()}
                    icon={CircleUserRound}
                >
                    Akun
                </MobileLink>
            </nav>
        </div>
    );
}

function NavLink({
    href,
    icon: Icon,
    children,
}: {
    href: string;
    icon: typeof Home;
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-primary/10 hover:text-foreground"
        >
            <Icon className="size-4" />
            {children}
        </Link>
    );
}

function MobileLink({
    href,
    icon: Icon,
    children,
}: {
    href: string;
    icon: typeof Home;
    children: ReactNode;
}) {
    return (
        <Link
            href={href}
            className="flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold text-muted-foreground transition hover:bg-primary/10 hover:text-foreground"
        >
            <Icon className="size-4" />
            {children}
        </Link>
    );
}
