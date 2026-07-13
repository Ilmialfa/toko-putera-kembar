import { Head, Link, usePage } from '@inertiajs/react';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    Warehouse,
    Tag,
    BarChart3,
    FileText,
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
    BookOpen,
    HelpCircle,
    LayoutList,
    ChevronRight,
    Building2,
    Truck,
    Box,
    ShoppingBag,
    ClipboardList,
    WalletCards,
    ShieldCheck,
    Users,
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
}

const navigation: NavItem[] = [
    {
        label: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
    },
    {
        label: 'POS & Kasir',
        href: '/admin/pos',
        icon: ShoppingCart,
        permission: 'pos.use',
    },
    {
        label: 'Pesanan Online',
        href: '/admin/orders',
        icon: ShoppingBag,
        permission: 'orders.view',
    },
    {
        label: 'Master Data',
        icon: Package,
        permission: 'products.view',
        children: [
            { label: 'Produk', href: '/admin/master/products', icon: Box },
            {
                label: 'Kategori',
                href: '/admin/master/categories',
                icon: LayoutList,
            },
            { label: 'Merek', href: '/admin/master/brands', icon: Tags },
            { label: 'Satuan (UOM)', href: '/admin/master/units', icon: Tag },
            { label: 'Tag', href: '/admin/master/tags', icon: Tag },
        ],
    },
    {
        label: 'Inventory',
        icon: Warehouse,
        permission: 'inventory.view',
        children: [
            {
                label: 'Barang Masuk',
                href: '/admin/inventory/stock-ins',
                icon: TrendingUp,
            },
            {
                label: 'Purchase Order',
                href: '/admin/inventory/operations?section=purchase-orders',
                icon: ClipboardList,
            },
            {
                label: 'Transfer Gudang',
                href: '/admin/inventory/operations?section=transfers',
                icon: Warehouse,
            },
            {
                label: 'Stock Opname',
                href: '/admin/inventory/operations?section=opnames',
                icon: ClipboardList,
            },
            {
                label: 'Penyesuaian Stok',
                href: '/admin/inventory/operations?section=adjustments',
                icon: Box,
            },
            {
                label: 'Retur Supplier',
                href: '/admin/inventory/operations?section=returns',
                icon: Truck,
            },
            {
                label: 'Supplier',
                href: '/admin/inventory/suppliers',
                icon: Truck,
            },
            {
                label: 'Gudang',
                href: '/admin/inventory/warehouses',
                icon: Building2,
            },
            {
                label: 'Laporan Stok',
                href: '/admin/inventory/reports',
                icon: BarChart3,
            },
        ],
    },
    {
        label: 'Promosi',
        icon: Megaphone,
        permission: 'promotions.view',
        children: [
            {
                label: 'Data Pegawai',
                href: '/admin/hr/employees',
                icon: Users,
            },
            {
                label: 'Daftar Promo',
                href: '/admin/promotions',
                icon: Megaphone,
            },
            {
                label: 'Buat Promo',
                href: '/admin/promotions/create',
                icon: ChevronRight,
            },
        ],
    },
    {
        label: 'Keuangan',
        icon: DollarSign,
        permission: 'finance.view',
        children: [
            {
                label: 'Kas & Pengeluaran',
                href: '/admin/finance/expenses',
                icon: Receipt,
            },
            {
                label: 'Kas, Bank & Hutang',
                href: '/admin/finance/operations',
                icon: WalletCards,
            },
            {
                label: 'Piutang & Hutang',
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
        label: 'HR & Absensi',
        icon: CalendarCheck,
        permission: 'hr.view',
        children: [
            {
                label: 'Rekap Absensi',
                href: '/admin/hr/attendances',
                icon: CalendarCheck,
            },
        ],
    },
    {
        label: 'CMS & Konten',
        icon: FileText,
        permission: 'cms.view',
        children: [
            { label: 'Halaman', href: '/admin/cms/pages', icon: FileText },
            { label: 'Blog', href: '/admin/cms/blogs', icon: BookOpen },
            { label: 'FAQ', href: '/admin/cms/faqs', icon: HelpCircle },
        ],
    },
    {
        label: 'Akses & Pengguna',
        icon: ShieldCheck,
        permission: 'users.view',
        children: [
            {
                label: 'Pengguna',
                href: '/admin/access/users',
                icon: Users,
                permission: 'users.view',
            },
            {
                label: 'Role & Permission',
                href: '/admin/access/roles',
                icon: ShieldCheck,
                permission: 'roles.manage',
            },
        ],
    },
];

function isNavigationActive(
    href: string,
    pathname: string,
    search: string,
): boolean {
    const [targetPath, targetQuery = ''] = href.split('?');
    const pathMatches =
        pathname === targetPath || pathname.startsWith(`${targetPath}/`);

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
        ? isNavigationActive(item.href, pathname, search)
        : false;
    const isParentActive = item.children?.some(
        (child) =>
            child.href && isNavigationActive(child.href, pathname, search),
    );
    const [open, setOpen] = useState(isParentActive || false);

    if (item.children) {
        return (
            <Collapsible open={open} onOpenChange={setOpen}>
                <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                        <SidebarMenuButton
                            className={
                                isParentActive
                                    ? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
                                    : ''
                            }
                        >
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
    const visibleNavigation = navigation
        .filter(
            (item) => !item.permission || permissions.includes(item.permission),
        )
        .map((item) => ({
            ...item,
            children: item.children?.filter(
                (child) =>
                    !child.permission || permissions.includes(child.permission),
            ),
        }))
        .filter((item) => !item.children || item.children.length > 0);

    return (
        <SidebarProvider
            style={{ '--sidebar-width': '18rem' } as React.CSSProperties}
        >
            {title && <Head title={title} />}
            <div className="flex h-screen w-full overflow-hidden bg-background">
                {/* Admin Sidebar */}
                <Sidebar>
                    <SidebarHeader className="border-b border-sidebar-border p-4">
                        <div className="flex items-center justify-between gap-2">
                            <Link
                                href="/admin/dashboard"
                                className="flex min-w-0 items-center gap-2 text-lg font-bold hover:opacity-80"
                            >
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                                    PK
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

                    <SidebarContent className="px-2 py-2">
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {visibleNavigation.map((item) => (
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
                    <header className="flex h-14 shrink-0 items-center border-b border-border bg-card px-6">
                        <h1 className="text-sm font-semibold text-foreground">
                            {title || 'Admin Panel'}
                        </h1>
                    </header>
                    <main className="flex-1 overflow-auto">{children}</main>
                </div>
            </div>
        </SidebarProvider>
    );
}
