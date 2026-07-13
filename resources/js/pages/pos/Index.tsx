import { router, useHttp } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

import { open as openShift } from '@/actions/App/Domain/Sales/Controllers/CashierShiftController';
import { store as checkoutStore } from '@/actions/App/Domain/Sales/Controllers/CheckoutController';
import { search as searchProducts } from '@/actions/App/Domain/Sales/Controllers/PosProductController';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import PosLayout from '@/layouts/pos-layout';
import { validate as validateVoucher } from '@/routes/admin/pos/vouchers';

interface Product {
    id: number;
    name: string;
    sku: string;
    price_retail: number;
    base_unit_id: number;
    default_warehouse_id: number;
    stock: number;
    base_unit?: { id: number; name: string };
}

interface AppliedPromotion {
    promotion_id: number;
    voucher_id: number | null;
    amount: number;
    type: string;
    name: string;
}

interface CartItem {
    id: string; // unique internal id
    product_id: number;
    name: string;
    unit_id: number;
    unit_name: string;
    qty: number;
    price_per_unit: number;
    discount_amount: number;
    subtotal: number;
    default_warehouse_id: number;
}

interface ProductSearchResponse {
    data: { data: Product[] };
}

interface VoucherResponse {
    voucher: { id: number };
    promotion: {
        id: number;
        name: string;
        type: string;
        rewards?: Array<{ reward_type: string; value: number }>;
    };
}

interface CheckoutPayload {
    cashier_shift_id: number;
    discount_total: number;
    tax_total: number;
    payment_status: string;
    warehouse_id: number;
    items: Array<{
        product_id: number;
        unit_id: number;
        qty: number;
        discount_amount: number;
    }>;
    payments: Array<{ method: string; amount: number }>;
    applied_promotions: AppliedPromotion[];
}

const paymentMethodLabels: Record<string, string> = {
    cash: 'Tunai',
    qris: 'QRIS',
    debit_card: 'Kartu Debit',
    points: 'Poin',
};

export default function PosIndex({ currentShift }: any) {
    const [openingBalance, setOpeningBalance] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);

    // Promo/Voucher states
    const [voucherCode, setVoucherCode] = useState('');
    const [appliedPromotions, setAppliedPromotions] = useState<
        AppliedPromotion[]
    >([]);

    // Payment states
    const [paidAmount, setPaidAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState<string>('cash');
    const productRequest = useHttp<
        Record<string, never>,
        ProductSearchResponse
    >({});
    const voucherRequest = useHttp<
        { code: string; store_id: number },
        VoucherResponse
    >({ code: '', store_id: currentShift?.store_id ?? 0 });
    const checkoutRequest = useHttp<
        CheckoutPayload,
        { sale: { sale_number: string } }
    >({
        cashier_shift_id: 0,
        discount_total: 0,
        tax_total: 0,
        payment_status: 'paid',
        warehouse_id: 0,
        items: [],
        payments: [],
        applied_promotions: [],
    });

    const searchInputRef = useRef<HTMLInputElement>(null);

    // Fetch products
    useEffect(() => {
        if (!currentShift) {
            return;
        }

        const fetchProducts = async () => {
            const response = await productRequest.get(
                searchProducts.url({ query: { q: search } }),
            );
            setProducts(response.data.data);
        };
        const timeout = setTimeout(fetchProducts, 300);

        return () => clearTimeout(timeout);
    }, [search, currentShift, productRequest]);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'F2') {
                e.preventDefault();
                searchInputRef.current?.focus();
            }

            if (e.key === 'F6') {
                e.preventDefault();

                if (cart.length > 0) {
                    setIsCheckoutModalOpen(true);
                }
            }

            if (e.key === 'F8') {
                e.preventDefault();
                toast.info(
                    'Gunakan menu Tagihan Ditahan untuk menyimpan transaksi ini.',
                );
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cart]);

    const handleOpenShift = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        router.post(
            openShift.url(),
            { opening_balance: openingBalance },
            {
                preserveState: true,
                onFinish: () => setIsSubmitting(false),
            },
        );
    };

    const addToCart = (product: Product) => {
        const price = Number(product.price_retail);

        if (!price) {
            toast.error(`Harga ${product.name} belum dikonfigurasi.`);

            return;
        }

        setCart((prev) => {
            const existing = prev.find((i) => i.product_id === product.id);

            if (existing) {
                return prev.map((i) =>
                    i.product_id === product.id
                        ? {
                              ...i,
                              qty: i.qty + 1,
                              subtotal: (i.qty + 1) * i.price_per_unit,
                          }
                        : i,
                );
            }

            return [
                ...prev,
                {
                    id: Math.random().toString(),
                    product_id: product.id,
                    name: product.name,
                    unit_id: product.base_unit_id || 1,
                    unit_name: 'PCS',
                    qty: 1,
                    price_per_unit: price,
                    discount_amount: 0,
                    subtotal: price,
                    default_warehouse_id: product.default_warehouse_id,
                },
            ];
        });
    };

    const removeFromCart = (id: string) => {
        setCart(cart.filter((i) => i.id !== id));
    };

    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const discountTotal = appliedPromotions.reduce(
        (sum, p) => sum + p.amount,
        0,
    );
    const totalAmount = Math.max(0, subtotal - discountTotal); // no tax for now
    const changeAmount = paidAmount - totalAmount;

    const applyVoucher = async () => {
        if (!voucherCode) {
            return;
        }

        try {
            voucherRequest.transform(() => ({
                code: voucherCode,
                store_id: currentShift.store_id,
            }));
            const { voucher, promotion } = await voucherRequest.post(
                validateVoucher.url(),
            );

            // Simplified calculation for demo (In real app, this should call PromotionEngine via API or calculate per item)
            let discountAmount = 0;
            const reward = promotion.rewards?.[0];

            if (reward) {
                if (reward.reward_type === 'percent_discount') {
                    discountAmount = subtotal * (reward.value / 100);
                } else if (reward.reward_type === 'fixed_discount') {
                    discountAmount = reward.value;
                }
            }

            if (discountAmount > subtotal) {
                discountAmount = subtotal;
            }

            if (discountAmount > 0) {
                setAppliedPromotions((prev) => {
                    if (prev.some((p) => p.voucher_id === voucher.id)) {
                        return prev;
                    }

                    return [
                        ...prev,
                        {
                            promotion_id: promotion.id,
                            voucher_id: voucher.id,
                            amount: discountAmount,
                            type: promotion.type,
                            name: promotion.name,
                        },
                    ];
                });
                setVoucherCode('');
                toast.success('Voucher berhasil diterapkan.');
            }
        } catch {
            toast.error('Voucher tidak valid atau sudah kedaluwarsa.');
        }
    };

    const removePromo = (index: number) => {
        setAppliedPromotions((prev) => prev.filter((_, i) => i !== index));
    };

    const processCheckout = async () => {
        if (paidAmount < totalAmount && paymentMethod === 'cash') {
            toast.error(
                'Nominal pembayaran masih kurang dari total transaksi.',
            );

            return;
        }

        try {
            const payload: CheckoutPayload = {
                cashier_shift_id: currentShift.id,
                discount_total: discountTotal,
                tax_total: 0,
                payment_status: 'paid',
                warehouse_id: cart[0]?.default_warehouse_id ?? 1,
                items: cart.map((i) => ({
                    product_id: i.product_id,
                    unit_id: i.unit_id,
                    qty: i.qty,
                    discount_amount: i.discount_amount,
                })),
                payments: [
                    {
                        method: paymentMethod,
                        amount:
                            paymentMethod === 'cash' ? paidAmount : totalAmount,
                    },
                ],
                applied_promotions: appliedPromotions,
            };
            checkoutRequest.transform(() => payload);
            const response = await checkoutRequest.post(checkoutStore.url());
            toast.success(`Transaksi ${response.sale.sale_number} berhasil.`);
            setCart([]);
            setAppliedPromotions([]);
            setIsCheckoutModalOpen(false);
            setPaidAmount(0);
        } catch {
            toast.error(
                'Checkout gagal. Periksa stok, pembayaran, atau batas diskon.',
            );
        }
    };

    if (!currentShift) {
        return (
            <PosLayout title="POS - Buka Shift">
                <div className="flex h-full items-center justify-center p-4">
                    <Dialog open={true}>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Buka Shift Kasir</DialogTitle>
                                <DialogDescription>
                                    Masukkan jumlah modal awal di laci kasir
                                    sebelum mulai bertransaksi.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleOpenShift}>
                                <div className="grid gap-4 py-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="opening_balance">
                                            Modal Awal (Rp)
                                        </Label>
                                        <Input
                                            id="opening_balance"
                                            type="number"
                                            value={openingBalance}
                                            onChange={(e) =>
                                                setOpeningBalance(
                                                    e.target.value,
                                                )
                                            }
                                            required
                                            min="0"
                                            placeholder="contoh: 500000"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() =>
                                            router.get('/admin/dashboard')
                                        }
                                    >
                                        Batal
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting
                                            ? 'Membuka...'
                                            : 'Buka Shift'}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>
            </PosLayout>
        );
    }

    return (
        <PosLayout title="POS">
            <div className="flex h-full w-full flex-col bg-[#f4f6f0] md:flex-row">
                {/* Product Area */}
                <div className="flex flex-1 flex-col p-4">
                    <div className="mb-4">
                        <Input
                            ref={searchInputRef}
                            placeholder="Cari produk atau pindai barcode (F2)..."
                            className="h-12 w-full max-w-xl border-black/10 bg-white text-lg shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();

                                    if (products.length === 1) {
                                        addToCart(products[0]);
                                        setSearch('');
                                    }
                                }
                            }}
                            autoFocus
                        />
                    </div>
                    <div className="grid flex-1 grid-cols-2 gap-4 overflow-y-auto sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                        {products.map((product) => (
                            <div
                                key={product.id}
                                onClick={() => addToCart(product)}
                                className="flex cursor-pointer flex-col rounded-xl border border-black/5 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary hover:shadow-md active:scale-95"
                            >
                                <div className="mb-2 flex aspect-square items-center justify-center rounded-md bg-slate-100 text-slate-400">
                                    Tanpa Foto
                                </div>
                                <h3
                                    className="line-clamp-2 text-sm font-medium"
                                    title={product.name}
                                >
                                    {product.name}
                                </h3>
                                <p className="mt-auto pt-2 text-xs text-gray-500">
                                    {product.sku}
                                </p>
                                <div className="mt-2 flex items-end justify-between gap-2">
                                    <strong className="text-sm text-lime-700">
                                        Rp{' '}
                                        {product.price_retail.toLocaleString(
                                            'id-ID',
                                        )}
                                    </strong>
                                    <span className="text-[11px] text-gray-400">
                                        Stok{' '}
                                        {product.stock.toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Cart Area */}
                <div className="flex h-[50vh] w-full flex-col border-l bg-white md:h-auto md:w-96">
                    <div className="flex items-center justify-between border-b p-4">
                        <h2 className="text-lg font-semibold">
                            Tagihan Saat Ini
                        </h2>
                        <span className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-500">
                            Shift #{currentShift.id}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto p-0">
                        {cart.length === 0 ? (
                            <div className="flex h-full flex-col items-center justify-center text-gray-400">
                                <p>Keranjang masih kosong</p>
                                <p className="mt-1 text-xs">
                                    Pilih produk untuk memulai transaksi
                                </p>
                            </div>
                        ) : (
                            <ul className="divide-y">
                                {cart.map((item) => (
                                    <li
                                        key={item.id}
                                        className="flex justify-between p-4 hover:bg-slate-50"
                                    >
                                        <div className="flex-1 pr-2">
                                            <h4 className="text-sm font-medium">
                                                {item.name}
                                            </h4>
                                            <div className="mt-1 text-xs text-slate-500">
                                                {item.qty} x Rp{' '}
                                                {item.price_per_unit.toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end justify-between">
                                            <span className="text-sm font-semibold">
                                                Rp{' '}
                                                {item.subtotal.toLocaleString()}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    removeFromCart(item.id)
                                                }
                                                className="mt-2 text-xs text-red-500 hover:underline"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    <div className="z-10 border-t bg-gray-50 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                        <div className="mb-4 flex gap-2">
                            <Input
                                placeholder="Kode voucher"
                                value={voucherCode}
                                onChange={(e) =>
                                    setVoucherCode(e.target.value.toUpperCase())
                                }
                                className="bg-white"
                                disabled={voucherRequest.processing}
                            />
                            <Button
                                variant="secondary"
                                onClick={applyVoucher}
                                disabled={
                                    !voucherCode || voucherRequest.processing
                                }
                            >
                                Terapkan
                            </Button>
                        </div>

                        <div className="mb-2 flex flex-col gap-1 text-sm text-slate-600">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span>Rp {subtotal.toLocaleString()}</span>
                            </div>

                            {appliedPromotions.map((promo, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center justify-between text-green-600"
                                >
                                    <div className="flex items-center gap-1">
                                        <span>Diskon ({promo.name})</span>
                                        <button
                                            onClick={() => removePromo(idx)}
                                            className="text-[10px] text-red-500 hover:underline"
                                        >
                                            [x]
                                        </button>
                                    </div>
                                    <span>
                                        -Rp {promo.amount.toLocaleString()}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mb-4 flex items-center justify-between text-xl font-bold text-primary">
                            <span>Total</span>
                            <span>Rp {totalAmount.toLocaleString()}</span>
                        </div>
                        <Button
                            className="h-14 w-full text-lg font-bold shadow-md"
                            disabled={cart.length === 0}
                            onClick={() => {
                                setPaidAmount(totalAmount); // Auto fill for convenience
                                setIsCheckoutModalOpen(true);
                            }}
                        >
                            Bayar (F6)
                        </Button>
                    </div>
                </div>
            </div>

            {/* Checkout Modal */}
            <Dialog
                open={isCheckoutModalOpen}
                onOpenChange={setIsCheckoutModalOpen}
            >
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">
                            Pembayaran
                        </DialogTitle>
                        <DialogDescription>
                            Total tagihan:{' '}
                            <strong className="text-xl text-black">
                                Rp {totalAmount.toLocaleString()}
                            </strong>
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label>Metode Pembayaran</Label>
                            <div className="flex flex-wrap gap-2">
                                {['cash', 'qris', 'debit_card', 'points'].map(
                                    (method) => (
                                        <Button
                                            key={method}
                                            type="button"
                                            variant={
                                                paymentMethod === method
                                                    ? 'default'
                                                    : 'outline'
                                            }
                                            onClick={() =>
                                                setPaymentMethod(method)
                                            }
                                            className="capitalize"
                                        >
                                            {paymentMethodLabels[method]}
                                        </Button>
                                    ),
                                )}
                            </div>
                        </div>

                        {paymentMethod === 'cash' && (
                            <div className="grid gap-2">
                                <Label htmlFor="paid_amount">
                                    Uang Diterima (Rp)
                                </Label>
                                <Input
                                    id="paid_amount"
                                    type="number"
                                    value={paidAmount || ''}
                                    onChange={(e) =>
                                        setPaidAmount(Number(e.target.value))
                                    }
                                    className="h-12 text-lg font-bold"
                                    autoFocus
                                />
                                {changeAmount > 0 && (
                                    <p className="mt-1 font-medium text-green-600">
                                        Kembalian: Rp{' '}
                                        {changeAmount.toLocaleString()}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCheckoutModalOpen(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            onClick={processCheckout}
                            disabled={
                                checkoutRequest.processing ||
                                (paymentMethod === 'cash' &&
                                    paidAmount < totalAmount)
                            }
                        >
                            {checkoutRequest.processing
                                ? 'Memproses...'
                                : 'Selesaikan Pembayaran'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </PosLayout>
    );
}
