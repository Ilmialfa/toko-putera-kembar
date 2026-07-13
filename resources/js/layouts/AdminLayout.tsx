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
    },
    {
        label: 'Pesanan Online',
        href: '/admin/orders',
        icon: ShoppingBag,
    },
    {
        label: 'Master Data',
        icon: Package,
        children: [
            { label: 'Produk', href: '/admin/master/products', icon: Box },
            {
                label: 'Kategori',
                href: '/admin/master/categories',
                icon: LayoutList,
            },
            { label: 'Brand', href: '/admin/master/brands', icon: Tags },
            { label: 'Satuan (UOM)', href: '/admin/master/units', icon: Tag },
            { label: 'Tag', href: '/admin/master/tags', icon: Tag },
        ],
    },
    {
        label: 'Inventory',
        icon: Warehouse,
        children: [
            {
                label: 'Barang Masuk',
                href: '/admin/inventory/stock-ins',
                icon: TrendingUp,
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
        children: [
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
        children: [
            {
                label: 'Kas & Pengeluaran',
                href: '/admin/finance/expenses',
                icon: Receipt,
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
        children: [
            { label: 'Halaman', href: '/admin/cms/pages', icon: FileText },
            { label: 'Blog', href: '/admin/cms/blogs', icon: BookOpen },
            { label: 'FAQ', href: '/admin/cms/faqs', icon: HelpCircle },
        ],
    },
];

function NavMenuItem({ item, pathname }: { item: NavItem; pathname: string }) {
    const isActive = item.href
        ? pathname === item.href || pathname.startsWith(item.href + '/')
        : false;
    const isParentActive = item.children?.some(
        (child) =>
            child.href &&
            (pathname === child.href || pathname.startsWith(child.href + '/')),
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
                                                ? pathname === child.href ||
                                                  pathname.startsWith(
                                                      child.href + '/',
                                                  )
                                                : false
                                        }
                                    >
                                        <Link href={child.href!}>
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
    const auth = (page.props as any).auth;

    return (
        <SidebarProvider>
            {title && <Head title={title} />}
            <div className="flex h-screen w-full overflow-hidden bg-background">
                {/* Admin Sidebar */}
                <Sidebar>
                    <SidebarHeader className="border-b border-sidebar-border p-4">
                        <Link
                            href="/admin/dashboard"
                            className="flex items-center gap-2 text-lg font-bold hover:opacity-80"
                        >
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
                                PK
                            </div>
                            <span className="text-sidebar-foreground">
                                Putera Kembar
                            </span>
                        </Link>
                    </SidebarHeader>

                    <SidebarContent className="px-2 py-2">
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {navigation.map((item) => (
                                        <NavMenuItem
                                            key={item.label}
                                            item={item}
                                            pathname={pathname}
                                        />
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>

                    <SidebarFooter className="border-t border-sidebar-border p-3">
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
                    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-6">
                        <SidebarTrigger className="text-muted-foreground" />
                        <div className="h-5 w-px bg-border" />
                        <h1 className="text-sm font-semibold text-foreground">
                            {title || 'Admin Panel'}
                        </h1>
                        <div className="ml-auto flex items-center gap-3">
                            <Link
                                href="/"
                                className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                                target="_blank"
                            >
                                <Store className="h-3.5 w-3.5" />
                                <span>Storefront</span>
                            </Link>
                        </div>
                    </header>
                    <main className="flex-1 overflow-auto">{children}</main>
                </div>
            </div>
        </SidebarProvider>
    );
}
