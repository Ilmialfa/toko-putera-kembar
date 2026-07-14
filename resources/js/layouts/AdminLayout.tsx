import { Head, Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Warehouse,
    Tag,
    BarChart3,
    ChevronDown,
    LogOut,
    Store,
    Tags,
    TrendingUp,
    CreditCard,
    DollarSign,
    Receipt,
    CalendarCheck,
    Megaphone,
    LayoutList,
    Truck,
    Box,
    ShoppingBag,
    WalletCards,
    ShieldCheck,
    Users,
    Coins,
    Image,
} from 'lucide-react';
import React, { useState } from 'react';
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarTrigger,
} from '@/components/ui/sidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
    title?: string;
}

interface NavItem {
    label: string;
    href?: string;
    icon?: React.ElementType;
    children?: NavItem[];
    permission?: string;
    permissions?: string[];
    exact?: boolean;
}

interface NavigationGroup {
    label: string;
    items: NavItem[];
}

const mobileNavigation: NavItem[] = [
    {
        label: 'Beranda',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
        permission: 'finance.view',
        exact: true,
    },
    {
        label: 'Kasir',
        href: '/admin/pos',
        icon: ShoppingCart,
        permission: 'pos.use',
        exact: true,
    },
    {
        label: 'Pesanan',
        href: '/admin/orders',
        icon: ShoppingBag,
        permission: 'orders.view',
    },
    {
        label: 'Stok',
        href: '/admin/inventory/reports',
        icon: Warehouse,
        permission: 'inventory.view',
    },
];

const navigationGroups: NavigationGroup[] = [
    {
        label: 'UTAMA',
        items: [
            {
                label: 'Dashboard',
                href: '/admin/dashboard',
                icon: LayoutDashboard,
            },
        ],
    },
    {
        label: 'PENJUALAN',
        items: [
            {
                label: 'Kasir (POS)',
                href: '/admin/pos',
                icon: ShoppingCart,
                permission: 'pos.use',
                exact: true,
            },
            {
                label: 'Riwayat Transaksi',
                href: '/admin/sales/transactions',
                icon: Receipt,
                permissions: ['pos.use', 'orders.view'],
            },
            {
                label: 'Pesanan Online',
                href: '/admin/orders',
                icon: ShoppingBag,
                permission: 'orders.view',
            },
            {
                label: 'Retur Penjualan',
                href: '/admin/pos/sale-returns',
                icon: Receipt,
                permission: 'pos.use',
            },
        ],
    },
    {
        label: 'PROMOSI & LOYALITAS',
        items: [
            {
                label: 'Promosi & Voucher',
                icon: Megaphone,
                permission: 'promotions.view',
                children: [
                    {
                        label: 'Manajemen Promosi',
                        href: '/admin/promotions',
                        icon: Megaphone,
                        exact: true,
                    },
                    {
                        label: 'Aturan Poin Pelanggan',
                        href: '/admin/promotions/loyalty-settings',
                        icon: Coins,
                        permission: 'promotions.manage',
                    },
                ],
            },
        ],
    },
    {
        label: 'PRODUK & PERSEDIAAN',
        items: [
            {
                label: 'Katalog Produk',
                icon: Package,
                permission: 'products.view',
                children: [
                    {
                        label: 'Produk',
                        href: '/admin/master/products',
                        icon: Box,
                    },
                    {
                        label: 'Kategori',
                        href: '/admin/master/categories',
                        icon: LayoutList,
                    },
                    {
                        label: 'Merek',
                        href: '/admin/master/brands',
                        icon: Tags,
                    },
                    {
                        label: 'Satuan Penjualan',
                        href: '/admin/master/units',
                        icon: Tag,
                    },
                ],
            },
            {
                label: 'Persediaan',
                icon: Warehouse,
                permission: 'inventory.view',
                children: [
                    {
                        label: 'Penerimaan Barang',
                        href: '/admin/inventory/stock-ins',
                        icon: TrendingUp,
                    },
                    {
                        label: 'Hutang Supplier',
                        href: '/admin/inventory/supplier-debts',
                        icon: TrendingUp,
                    },
                    {
                        label: 'Data Supplier',
                        href: '/admin/inventory/suppliers',
                        icon: Truck,
                    },
                    {
                        label: 'Laporan Persediaan',
                        href: '/admin/inventory/reports',
                        icon: BarChart3,
                    },
                ],
            },
        ],
    },
    {
        label: 'MANAJEMEN OPERASIONAL',
        items: [
            {
                label: 'Keuangan & Akuntansi',
                icon: DollarSign,
                permission: 'finance.view',
                children: [
                    {
                        label: 'Pengeluaran Operasional',
                        href: '/admin/finance/expenses',
                        icon: Receipt,
                    },
                    {
                        label: 'Kas, Bank & Hutang Supplier',
                        href: '/admin/finance/operations',
                        icon: WalletCards,
                    },
                    {
                        label: 'Piutang Pelanggan',
                        href: '/admin/finance/receivables',
                        icon: CreditCard,
                    },
                    {
                        label: 'Laporan Laba Rugi',
                        href: '/admin/finance/reports/profit-loss',
                        icon: BarChart3,
                    },
                ],
            },
            {
                label: 'SDM & Kehadiran',
                icon: CalendarCheck,
                permission: 'hr.view',
                children: [
                    {
                        label: 'Data Pegawai',
                        href: '/admin/hr/employees',
                        icon: Users,
                    },
                    {
                        label: 'Kehadiran',
                        href: '/admin/hr/attendances',
                        icon: CalendarCheck,
                    },
                ],
            },
        ],
    },
    {
        label: 'SISTEM',
        items: [
            {
                label: 'Konten Website',
                icon: Megaphone,
                permission: 'cms.manage',
                children: [
                    {
                        label: 'Artikel & Informasi',
                        href: '/admin/cms/blogs',
                        icon: LayoutList,
                    },
                    {
                        label: 'Banner Promo',
                        href: '/admin/promotions',
                        icon: Image,
                    },
                ],
            },
            {
                label: 'Pengguna & Akses',
                icon: ShieldCheck,
                permission: 'users.view',
                children: [
                    {
                        label: 'Akun Pengguna',
                        href: '/admin/access/users',
                        icon: Users,
                        permission: 'users.view',
                    },
                    {
                        label: 'Peran & Izin',
                        href: '/admin/access/roles',
                        icon: ShieldCheck,
                        permission: 'roles.manage',
                    },
                ],
            },
        ],
    },
];

function isNavigationActive(
    href: string,
    pathname: string,
    search: string,
    exact: boolean = false,
): boolean {
    const [targetPath, targetQuery = ''] = href.split('?');
    const pathMatches = exact
        ? pathname === targetPath
        : pathname === targetPath || pathname.startsWith(`${targetPath}/`);

    if (!pathMatches) {
        return false;
    }

    const targetSection = new URLSearchParams(targetQuery).get('section');

    return targetSection
        ? new URLSearchParams(search).get('section') === targetSection
        : true;
}

function NavMenuItem({
    item,
    pathname,
    search,
}: {
    item: NavItem;
    pathname: string;
    search: string;
}) {
    const isActive = item.href
        ? isNavigationActive(item.href, pathname, search, item.exact)
        : false;
    const isParentActive = item.children?.some(
        (child) =>
            child.href &&
            isNavigationActive(child.href, pathname, search, child.exact),
    );
    const [open, setOpen] = useState(isParentActive || false);

    if (item.children) {
        return (
            <Collapsible open={open} onOpenChange={setOpen}>
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton>
                            {item.icon && <item.icon className="h-4 w-4" />}
                            <span>{item.label}</span>
                            <ChevronDown
                                className={`ml-auto h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
                            />
                        </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                        <SidebarMenuSub>
                            {item.children.map((child) => (
                                <SidebarMenuSubItem key={child.href}>
                                    <SidebarMenuSubButton
                                        asChild
                                        isActive={
                                            child.href
                                                ? isNavigationActive(
                                                      child.href,
                                                      pathname,
                                                      search,
                                                      child.exact,
                                                  )
                                                : false
                                        }
                                    >
                                        <Link
                                            href={child.href!}
                                            className="flex min-w-0 items-center gap-2 whitespace-nowrap"
                                        >
                                            {child.icon && (
                                                <child.icon className="mr-1 h-3.5 w-3.5" />
                                            )}
                                            {child.label}
                                        </Link>
                                    </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                            ))}
                        </SidebarMenuSub>
                    </CollapsibleContent>
                </SidebarMenuItem>
            </Collapsible>
        );
    }

    return (
        <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={isActive}>
                <Link href={item.href!}>
                    {item.icon && <item.icon className="h-4 w-4" />}
                    <span>{item.label}</span>
                </Link>
            </SidebarMenuButton>
        </SidebarMenuItem>
    );
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
    const page = usePage();
    const pathname = window.location.pathname;
    const search = window.location.search;
    const auth = (page.props as any).auth;
    const permissions: string[] = auth?.user?.permissions ?? [];
    const visibleNavigationGroups = navigationGroups
        .map((group) => ({
            ...group,
            items: group.items
                .filter(
                    (item) =>
                        (!item.permission ||
                            permissions.includes(item.permission)) &&
                        (!item.permissions ||
                            item.permissions.some((permission) =>
                                permissions.includes(permission),
                            )),
                )
                .map((item) => ({
                    ...item,
                    children: item.children?.filter(
                        (child) =>
                            !child.permission ||
                            permissions.includes(child.permission),
                    ),
                }))
                .filter((item) => !item.children || item.children.length > 0),
        }))
        .filter((group) => group.items.length > 0);
    const visibleMobileNavigation = mobileNavigation.filter(
        (item) => !item.permission || permissions.includes(item.permission),
    );

    return (
        <SidebarProvider
            style={{ '--sidebar-width': '18rem' } as React.CSSProperties}
        >
            {title && <Head title={title} />}
            <div className="admin-workspace flex h-screen w-full overflow-hidden bg-background">
                {/* Admin Sidebar */}
                <Sidebar>
                    <SidebarHeader className="border-b border-sidebar-border p-4">
                        <div className="flex items-center justify-between gap-2">
                            <Link
                                href="/admin/dashboard"
                                className="flex min-w-0 items-center gap-2 text-lg font-bold hover:opacity-80"
                            >
                                <div className="flex h-9 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-lime-200 bg-white">
                                    <img
                                        src="/images/brand/logo-putera-kembar.png"
                                        alt="Logo Toko Putera Kembar"
                                        className="size-13 max-w-none object-contain"
                                    />
                                </div>
                                <span className="truncate text-sidebar-foreground group-data-[collapsible=icon]:hidden">
                                    Putera Kembar
                                </span>
                            </Link>
                            <SidebarTrigger
                                className="shrink-0 text-muted-foreground group-data-[collapsible=icon]:hidden"
                                title="Kecilkan sidebar"
                            />
                        </div>
                    </SidebarHeader>

                    <SidebarContent className="px-3 py-3">
                        {visibleNavigationGroups.map((group) => (
                            <SidebarGroup key={group.label} className="p-0">
                                <SidebarGroupContent>
                                    <SidebarMenu>
                                        {group.items.map((item) => (
                                            <NavMenuItem
                                                key={item.label}
                                                item={item}
                                                pathname={pathname}
                                                search={search}
                                            />
                                        ))}
                                    </SidebarMenu>
                                </SidebarGroupContent>
                            </SidebarGroup>
                        ))}
                    </SidebarContent>

                    <SidebarFooter className="space-y-2 border-t border-sidebar-border p-3">
                        <Link
                            href="/"
                            target="_blank"
                            className="flex min-h-10 items-center gap-2 rounded-lg px-2 text-sm font-medium text-sidebar-foreground transition-colors group-data-[collapsible=icon]:justify-center hover:bg-sidebar-accent"
                        >
                            <Store className="size-4 shrink-0" />
                            <span className="group-data-[collapsible=icon]:hidden">
                                Buka Storefront
                            </span>
                        </Link>
                        <div className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-sidebar-foreground">
                            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                {auth?.user?.name?.charAt(0)?.toUpperCase() ??
                                    'U'}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-medium">
                                    {auth?.user?.name ?? 'User'}
                                </p>
                                <p className="truncate text-[10px] text-muted-foreground">
                                    {auth?.user?.email ?? ''}
                                </p>
                            </div>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="text-muted-foreground transition-colors hover:text-destructive"
                                title="Logout"
                            >
                                <LogOut className="h-4 w-4" />
                            </Link>
                        </div>
                    </SidebarFooter>
                </Sidebar>

                {/* Main Content */}
                <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
                    <main className="flex-1 overflow-auto pb-20 md:pb-0">
                        {children}
                    </main>
                    {visibleMobileNavigation.length > 0 && (
                        <nav className="fixed inset-x-3 bottom-3 z-50 grid auto-cols-fr grid-flow-col rounded-2xl border border-border bg-card/95 p-1.5 shadow-2xl backdrop-blur md:hidden">
                            {visibleMobileNavigation.map((item) => {
                                const Icon = item.icon ?? LayoutDashboard;
                                const isActive = item.href
                                    ? isNavigationActive(
                                          item.href,
                                          pathname,
                                          search,
                                          item.exact,
                                      )
                                    : false;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href!}
                                        className={`flex min-h-12 flex-col items-center justify-center gap-0.5 rounded-xl text-[10px] font-semibold transition ${
                                            isActive
                                                ? 'bg-primary text-primary-foreground'
                                                : 'text-muted-foreground hover:bg-primary/10 hover:text-foreground'
                                        }`}
                                    >
                                        <Icon className="size-4" />
                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>
                    )}
                </div>
            </div>
        </SidebarProvider>
    );
}
