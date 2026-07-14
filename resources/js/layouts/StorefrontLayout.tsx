import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    CircleUserRound,
    Home,
    LocateFixed,
    LoaderCircle,
    MapPin,
    PackageSearch,
    Search,
    ShoppingBag,
    Sparkles,
    Star,
    Store,
    Truck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

import { index as cartIndex } from '@/routes/cart';
import { account } from '@/routes/customer';
import { index as storefrontIndex } from '@/routes/storefront';

const customerLoginUrl = '/akun/masuk';

interface StorefrontLayoutProps {
    children: ReactNode;
    title?: string;
}

interface SharedProps {
    auth: {
        customer: {
            id: number;
            name: string;
            loyalty_point_balance: number;
        } | null;
    };
    cart_count: number;
    storefront_delivery?: {
        latitude: number | string | null;
        longitude: number | string | null;
        delivery_radius_km: number | string | null;
    } | null;
}

type DeliveryLocationStatus =
    'idle' | 'checking' | 'covered' | 'outside' | 'unavailable';

export default function StorefrontLayout({
    children,
    title,
}: StorefrontLayoutProps) {
    const page = usePage();
    const {
        auth,
        cart_count: sharedCartCount,
        storefront_delivery: storefrontDelivery,
    } = page.props as unknown as SharedProps;
    const currentPath = page.url.split('?')[0];
    const [cartCount, setCartCount] = useState(sharedCartCount);
    const [deliveryLocationStatus, setDeliveryLocationStatus] =
        useState<DeliveryLocationStatus>('idle');
    const storeLatitude = Number(storefrontDelivery?.latitude);
    const storeLongitude = Number(storefrontDelivery?.longitude);
    const deliveryRadius = Number(storefrontDelivery?.delivery_radius_km ?? 3);

    const checkDeliveryCoverage = useCallback(() => {
        if (
            !navigator.geolocation ||
            !Number.isFinite(storeLatitude) ||
            !Number.isFinite(storeLongitude) ||
            !Number.isFinite(deliveryRadius)
        ) {
            setDeliveryLocationStatus('unavailable');

            return;
        }

        setDeliveryLocationStatus('checking');

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                const distance = distanceInKilometres(
                    storeLatitude,
                    storeLongitude,
                    coords.latitude,
                    coords.longitude,
                );

                setDeliveryLocationStatus(
                    distance <= deliveryRadius ? 'covered' : 'outside',
                );
            },
            () => setDeliveryLocationStatus('unavailable'),
            {
                enableHighAccuracy: true,
                timeout: 10_000,
                maximumAge: 300_000,
            },
        );
    }, [deliveryRadius, storeLatitude, storeLongitude]);

    useEffect(() => {
        const updateCartCount = (event: Event) => {
            const { count } = (event as CustomEvent<{ count: number }>).detail;
            setCartCount(count);
        };

        window.addEventListener('storefront:cart-changed', updateCartCount);

        return () => {
            window.removeEventListener(
                'storefront:cart-changed',
                updateCartCount,
            );
        };
    }, []);

    useEffect(() => {
        if (!navigator.permissions?.query) {
            return;
        }

        navigator.permissions
            .query({ name: 'geolocation' })
            .then((permission) => {
                if (permission.state === 'granted') {
                    checkDeliveryCoverage();
                }
            })
            .catch(() => undefined);
    }, [checkDeliveryCoverage]);

    return (
        <div className="min-h-screen bg-white font-sans text-stone-950">
            {title && <Head title={title} />}
            <DeliveryCoverageBanner
                status={deliveryLocationStatus}
                radius={deliveryRadius}
                onCheck={checkDeliveryCoverage}
            />

            <MobileStorefrontHeader
                customer={auth.customer}
                status={deliveryLocationStatus}
                radius={deliveryRadius}
                onCheck={checkDeliveryCoverage}
            />

            <header className="sticky top-0 z-50 hidden border-b border-stone-200 bg-white/92 backdrop-blur-xl md:block">
                <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 lg:px-6">
                    <Link
                        href={storefrontIndex.url()}
                        className="flex shrink-0 items-center gap-3"
                        prefetch
                    >
                        <img
                            src="/images/brand/logo-putera-kembar.png"
                            alt="Logo Toko Putera Kembar"
                            className="h-12 w-16 object-contain"
                        />
                        <span className="leading-tight">
                            <strong className="block text-sm tracking-tight">
                                Toko Putera Kembar
                            </strong>
                            <span className="hidden text-[10px] font-semibold tracking-[0.14em] text-stone-500 uppercase sm:block">
                                Grosir & Retail
                            </span>
                        </span>
                    </Link>

                    <nav className="ml-3 hidden items-center gap-1 lg:flex">
                        <NavLink
                            href={storefrontIndex.url()}
                            icon={Home}
                            active={currentPath === '/'}
                        >
                            Beranda
                        </NavLink>
                        <NavLink
                            href="/katalog"
                            icon={PackageSearch}
                            active={currentPath === '/katalog'}
                        >
                            Katalog
                        </NavLink>
                        <NavLink
                            href="/promo"
                            icon={Sparkles}
                            active={currentPath === '/promo'}
                        >
                            Promo
                        </NavLink>
                        <NavLink
                            href="/tentang"
                            icon={Store}
                            active={currentPath === '/tentang'}
                        >
                            Tentang
                        </NavLink>
                    </nav>

                    <Form
                        action="/katalog"
                        method="get"
                        className="relative ml-auto hidden max-w-md flex-1 md:block"
                    >
                        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-stone-400" />
                        <input
                            name="search"
                            type="search"
                            aria-label="Cari produk"
                            placeholder="Cari mie, minuman, sembako..."
                            className="h-11 w-full rounded-2xl border border-stone-200 bg-stone-50 pr-4 pl-10 text-sm transition outline-none focus:border-lime-400 focus:ring-4 focus:ring-lime-100"
                        />
                    </Form>

                    <div className="ml-auto flex items-center gap-2 md:ml-0">
                        <Link
                            href={
                                auth.customer ? account.url() : customerLoginUrl
                            }
                            className="hidden h-10 items-center gap-2 rounded-xl border border-stone-200 bg-white px-3 text-sm font-semibold transition hover:border-lime-400 sm:flex"
                        >
                            <CircleUserRound className="size-4" />{' '}
                            {auth.customer
                                ? auth.customer.name.split(' ')[0]
                                : 'Masuk / Daftar'}
                        </Link>
                        <Link
                            href={cartIndex.url()}
                            className="relative hidden size-11 place-items-center rounded-2xl bg-lime-300 text-stone-950 transition hover:bg-lime-200 md:grid"
                            aria-label="Keranjang belanja"
                        >
                            <ShoppingBag className="size-5" />
                            {cartCount > 0 && (
                                <span className="absolute -top-1 -right-1 grid min-w-5 place-items-center rounded-full bg-lime-800 px-1 text-[10px] font-black text-white ring-2 ring-background">
                                    {cartCount}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>
            </header>

            <main className="min-h-[65vh] pb-[calc(7.5rem+env(safe-area-inset-bottom))] md:pb-0">
                {children}
            </main>

            <footer className="mt-16 border-t border-stone-200 bg-stone-50 text-stone-950">
                <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.5fr_1fr_1fr] lg:px-6">
                    <div>
                        <div className="flex items-center gap-3">
                            <img
                                src="/images/brand/logo-putera-kembar.png"
                                alt="Logo Toko Putera Kembar"
                                className="h-13 w-18 object-contain"
                            />
                            <strong className="text-lg">
                                Toko Putera Kembar
                            </strong>
                        </div>
                        <p className="mt-4 max-w-md text-sm leading-6 text-stone-500">
                            Partner belanja grosir kebutuhan harian untuk
                            keluarga, warung, dan usaha di Pekanbaru.
                        </p>
                    </div>
                    <div className="text-sm">
                        <p className="font-bold">Belanja</p>
                        <div className="mt-3 grid gap-2 text-stone-500">
                            <Link href="/katalog">Katalog produk</Link>
                            <Link href={cartIndex.url()}>Keranjang</Link>
                            <Link href="/tentang">Tentang toko</Link>
                            <Link href="/kontak">Lokasi & kontak</Link>
                            <Link href="/faq">Bantuan</Link>
                        </div>
                    </div>
                    <div className="text-sm">
                        <p className="font-bold">Toko utama</p>
                        <p className="mt-3 leading-6 text-stone-500">
                            Lihat alamat dan jam operasional terbaru di halaman
                            Tentang toko.
                        </p>
                    </div>
                </div>
                <div className="border-t border-stone-200 px-4 py-4 text-center text-xs text-stone-400">
                    © {new Date().getFullYear()} Toko Grosir Putera Kembar.
                    Dibuat untuk belanja lokal yang lebih mudah.
                </div>
            </footer>

            <nav className="fixed right-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] left-3 z-[60] grid grid-cols-5 rounded-2xl border border-stone-200 bg-white/95 p-1.5 backdrop-blur md:hidden">
                <MobileLink
                    href={storefrontIndex.url()}
                    icon={Home}
                    active={currentPath === '/'}
                >
                    Home
                </MobileLink>
                <MobileLink
                    href="/katalog"
                    icon={Search}
                    active={currentPath === '/katalog'}
                >
                    Katalog
                </MobileLink>
                <MobileLink
                    href="/promo"
                    icon={Sparkles}
                    active={currentPath === '/promo'}
                >
                    Promo
                </MobileLink>
                <MobileLink
                    href={cartIndex.url()}
                    icon={ShoppingBag}
                    badge={cartCount}
                    active={currentPath === '/cart'}
                >
                    Keranjang
                </MobileLink>
                <MobileLink
                    href={auth.customer ? account.url() : customerLoginUrl}
                    icon={CircleUserRound}
                    active={currentPath.startsWith('/akun')}
                >
                    Akun
                </MobileLink>
            </nav>
        </div>
    );
}

function DeliveryCoverageBanner({
    status,
    radius,
    onCheck,
}: {
    status: DeliveryLocationStatus;
    radius: number;
    onCheck: () => void;
}) {
    const isChecking = status === 'checking';
    const canCheck = status !== 'checking' && status !== 'unavailable';
    const radiusLabel = Number.isInteger(radius) ? radius : radius.toFixed(1);
    const content = {
        idle: {
            icon: LocateFixed,
            message: `Cek jangkauan pengantaran hingga ${radiusLabel} km dari toko.`,
            action: 'Aktifkan lokasi',
        },
        checking: {
            icon: LoaderCircle,
            message: 'Mendeteksi lokasi Anda dengan aman…',
            action: null,
        },
        covered: {
            icon: Truck,
            message:
                'Lokasi Anda tercakup — bisa diantar gratis ongkir untuk belanja min. Rp150.000.',
            action: 'Perbarui lokasi',
        },
        outside: {
            icon: MapPin,
            message: `Lokasi Anda berada di luar jangkauan antar ${radiusLabel} km. Silakan pilih Ambil di Toko.`,
            action: 'Cek lagi',
        },
        unavailable: {
            icon: MapPin,
            message:
                'Izin lokasi belum tersedia. Aktifkan lokasi untuk cek jangkauan atau pilih Ambil di Toko.',
            action: null,
        },
    }[status];
    const Icon = content.icon;

    return (
        <div
            className={`hidden border-b px-4 py-2 text-center text-xs text-stone-800 md:block ${status === 'outside'
                ? 'border-lime-400 bg-lime-400'
                : 'border-lime-200 bg-lime-200'
                }`}
            aria-live="polite"
        >
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-2 gap-y-1.5">
                <Icon
                    className={`size-3.5 shrink-0 text-lime-700 ${isChecking ? 'animate-spin' : ''}`}
                />
                <span className="font-semibold">{content.message}</span>
                {content.action && canCheck && (
                    <button
                        type="button"
                        onClick={onCheck}
                        className="rounded-lg px-2 py-1 font-bold text-lime-800 underline-offset-2 transition hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-lime-500"
                    >
                        {content.action}
                    </button>
                )}
                <span className="text-stone-500">
                    Lokasi diproses di perangkat Anda.
                </span>
            </div>
        </div>
    );
}

function MobileStorefrontHeader({
    customer,
    status,
    radius,
    onCheck,
}: {
    customer: SharedProps['auth']['customer'];
    status: DeliveryLocationStatus;
    radius: number;
    onCheck: () => void;
}) {
    const [messageIndex, setMessageIndex] = useState(0);
    const firstName = customer?.name.split(' ')[0];
    const radiusLabel = Number.isInteger(radius) ? radius : radius.toFixed(1);
    const deliveryMessage = {
        idle: `Aktifkan lokasi untuk cek antar hingga ${radiusLabel} km`,
        checking: 'Sedang memeriksa jangkauan pengantaran',
        covered: 'Bisa diantar · Gratis ongkir min. Rp150.000',
        outside: 'Di luar jangkauan antar · Ambil di toko tersedia',
        unavailable: 'Lokasi belum diizinkan · Ambil di toko tersedia',
    }[status];
    const messages = customer
        ? [
            deliveryMessage,
            `${customer.loyalty_point_balance.toLocaleString('id-ID')} poin siap digunakan`,
        ]
        : [deliveryMessage, 'Daftar gratis untuk menyimpan alamat dan poin'];

    useEffect(() => {
        const interval = window.setInterval(() => {
            setMessageIndex((current) => (current + 1) % messages.length);
        }, 4_500);

        return () => window.clearInterval(interval);
    }, [messages.length, status]);

    return (
        <header className="sticky top-0 isolate z-[60] border-b border-stone-200 bg-white md:hidden">
            <div className="flex items-center gap-3 px-4 py-3">
                <Link
                    href={customer ? account.url() : customerLoginUrl}
                    className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-lime-200 bg-white"
                    aria-label={
                        customer ? 'Buka akun pelanggan' : 'Masuk atau daftar'
                    }
                >
                    <img
                        src="/images/brand/logo-putera-kembar.png"
                        alt=""
                        className="size-15 max-w-none object-contain"
                    />
                </Link>
                <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-stone-950">
                        {customer
                            ? `Halo, ${firstName}`
                            : 'Halo, selamat datang'}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-stone-500">
                        <MapPin className="size-3.5 shrink-0 text-lime-700" />
                        <span className="truncate">
                            Pekanbaru · Toko Putera Kembar
                        </span>
                    </div>
                </div>
                {customer ? (
                    <Link
                        href={account.url()}
                        className="flex shrink-0 flex-col items-end rounded-xl bg-lime-50 px-3 py-2 text-right"
                        aria-label="Buka poin pelanggan"
                    >
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-lime-800">
                            <Star className="size-3 fill-current" /> Poin
                        </span>
                        <span className="text-xs font-black text-stone-950">
                            {customer.loyalty_point_balance.toLocaleString(
                                'id-ID',
                            )}
                        </span>
                    </Link>
                ) : (
                    <Link
                        href={customerLoginUrl}
                        className="shrink-0 rounded-xl bg-lime-300 px-3 py-2.5 text-xs font-black text-stone-950"
                    >
                        Masuk
                    </Link>
                )}
            </div>
            <button
                type="button"
                onClick={onCheck}
                className={`flex min-h-9 w-full items-center gap-2 border-t px-4 text-left text-[11px] text-stone-700 ${status === 'outside'
                    ? 'border-lime-400 bg-lime-400'
                    : 'border-lime-100 bg-lime-100'
                    }`}
            >
                {status === 'checking' ? (
                    <LoaderCircle className="size-3.5 shrink-0 animate-spin text-lime-700" />
                ) : status === 'covered' ? (
                    <Truck className="size-3.5 shrink-0 text-lime-700" />
                ) : (
                    <LocateFixed className="size-3.5 shrink-0 text-lime-700" />
                )}
                <span className="min-w-0 flex-1 truncate" aria-live="polite">
                    {messages[messageIndex]}
                </span>
                {status !== 'checking' && (
                    <span className="font-bold text-lime-800">Cek</span>
                )}
            </button>
        </header>
    );
}

function distanceInKilometres(
    latitudeA: number,
    longitudeA: number,
    latitudeB: number,
    longitudeB: number,
): number {
    const earthRadius = 6_371;
    const latitudeDelta = degreesToRadians(latitudeB - latitudeA);
    const longitudeDelta = degreesToRadians(longitudeB - longitudeA);
    const value =
        Math.sin(latitudeDelta / 2) ** 2 +
        Math.cos(degreesToRadians(latitudeA)) *
        Math.cos(degreesToRadians(latitudeB)) *
        Math.sin(longitudeDelta / 2) ** 2;

    return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

function NavLink({
    href,
    icon: Icon,
    children,
    active = false,
}: {
    href: string;
    icon: typeof Home;
    children: ReactNode;
    active?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition ${active ? 'bg-lime-100 text-stone-950' : 'text-stone-600 hover:bg-lime-50 hover:text-stone-950'}`}
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
    badge = 0,
    active = false,
}: {
    href: string;
    icon: typeof Home;
    children: ReactNode;
    badge?: number;
    active?: boolean;
}) {
    return (
        <Link
            href={href}
            className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-bold transition ${active ? 'bg-lime-300 text-stone-950' : 'text-stone-500 hover:bg-lime-50 hover:text-stone-950'}`}
        >
            <span className="relative">
                <Icon className="size-4" />
                {badge > 0 && (
                    <span className="absolute -top-2 -right-3 grid min-w-4 place-items-center rounded-full bg-lime-700 px-1 text-[9px] leading-4 font-black text-white">
                        {badge}
                    </span>
                )}
            </span>
            {children}
        </Link>
    );
}
