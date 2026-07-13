import { router, useHttp } from '@inertiajs/react';
import {
    Barcode,
    ChevronDown,
    Clock3,
    CreditCard,
    Minus,
    PackageOpen,
    Pause,
    Plus,
    ReceiptText,
    Search,
    ShoppingCart,
    Trash2,
    UserRound,
    WalletCards,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { toast } from 'sonner';
import {
    close as closeShift,
    open as openShift,
} from '@/actions/App/Domain/Sales/Controllers/CashierShiftController';
import { store as checkoutStore } from '@/actions/App/Domain/Sales/Controllers/CheckoutController';
import {
    destroy as destroyParkedBill,
    index as parkedBillsIndex,
    store as storeParkedBill,
} from '@/actions/App/Domain/Sales/Controllers/ParkBillController';
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
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import PosLayout from '@/layouts/pos-layout';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { validate as validateVoucher } from '@/routes/admin/pos/vouchers';

interface Shift {
    id: number;
    store_id: number;
    opening_at: string;
}

interface Category {
    id: number;
    name: string;
}

interface Customer {
    id: number;
    name: string;
    phone: string;
    loyalty_point_balance: number;
}

interface SalesUnit {
    id: number;
    name: string;
    symbol: string;
    conversion_qty: number;
    price: number;
}

interface Product {
    id: number;
    name: string;
    sku: string;
    category_id: number;
    image_url: string | null;
    price_retail: number | null;
    base_unit_id: number;
    default_warehouse_id: number;
    stock: number;
    sales_units: SalesUnit[];
}

interface AppliedPromotion {
    promotion_id: number;
    voucher_id: number | null;
    amount: number;
    type: string;
    name: string;
}

interface CartItem {
    id: string;
    product_id: number;
    name: string;
    sku: string;
    image_url: string | null;
    unit_id: number;
    unit_name: string;
    qty: number;
    price_per_unit: number;
    discount_amount: number;
    default_warehouse_id: number;
    stock: number;
    available_units: SalesUnit[];
}

interface ParkedBill {
    id: number;
    sale_number: string;
    customer_id: number | null;
    customer?: { name: string; phone: string };
    total_amount: number | string;
    created_at: string;
    items: Array<{
        id: number;
        product_id: number;
        unit_id: number;
        qty: number | string;
        price_per_unit: number | string;
        discount_amount: number | string;
        product: {
            name: string;
            sku: string;
            image_primary_path?: string | null;
            default_warehouse_id: number;
            stok_saat_ini: number | string;
            base_unit?: { id: number; name: string; symbol: string };
        };
        unit?: { id: number; name: string; symbol: string };
    }>;
}

interface PaymentRow {
    id: string;
    method: string;
    amount: number;
    reference_number: string;
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
    customer_id: number | null;
    discount_total: number;
    tax_total: number;
    payment_status: 'paid' | 'unpaid' | 'partial';
    warehouse_id: number;
    items: Array<{
        product_id: number;
        unit_id: number;
        qty: number;
        discount_amount: number;
    }>;
    payments: Array<{
        method: string;
        amount: number;
        reference_number?: string;
    }>;
    voucher_code: string | null;
    parked_sale_id: number | null;
    receivable_due_date: string | null;
}

interface ParkBillPayload {
    cashier_shift_id: number;
    customer_id: number | null;
    subtotal: number;
    discount_total: number;
    tax_total: number;
    total_amount: number;
    items: Array<{
        product_id: number;
        unit_id: number;
        qty: number;
        price_per_unit: number;
        discount_amount: number;
        subtotal: number;
    }>;
}

interface PosIndexProps {
    currentShift: Shift | null;
    categories: Category[];
    customers: Customer[];
    cashier: { id: number; name: string };
}

const paymentMethodLabels: Record<string, string> = {
    cash: 'Tunai',
    qris: 'QRIS',
    bank_transfer: 'Transfer Bank',
    e_wallet: 'Dompet Digital',
    debit_card: 'Kartu Debit',
    credit_card: 'Kartu Kredit',
    piutang: 'Piutang',
    points: 'Poin',
};

const emptyParkBillPayload: ParkBillPayload = {
    cashier_shift_id: 0,
    customer_id: null,
    subtotal: 0,
    discount_total: 0,
    tax_total: 0,
    total_amount: 0,
    items: [],
};

const defaultDueDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);

    return date.toISOString().slice(0, 10);
};

export default function PosIndex({
    currentShift,
    categories,
    customers,
    cashier,
}: PosIndexProps) {
    const [openingBalance, setOpeningBalance] = useState('0');
    const [isOpeningShift, setIsOpeningShift] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [search, setSearch] = useState('');
    const [categoryId, setCategoryId] = useState('all');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [customerId, setCustomerId] = useState('');
    const [parkedSaleId, setParkedSaleId] = useState<number | null>(null);
    const [parkedBills, setParkedBills] = useState<ParkedBill[]>([]);
    const [isParkedDialogOpen, setIsParkedDialogOpen] = useState(false);
    const [isCartSheetOpen, setIsCartSheetOpen] = useState(false);
    const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
    const [isCloseShiftModalOpen, setIsCloseShiftModalOpen] = useState(false);
    const [closingBalanceActual, setClosingBalanceActual] = useState('');
    const [closingNotes, setClosingNotes] = useState('');
    const [isClosingShift, setIsClosingShift] = useState(false);
    const [voucherCode, setVoucherCode] = useState('');
    const [validatedVoucherCode, setValidatedVoucherCode] = useState('');
    const [appliedPromotions, setAppliedPromotions] = useState<
        AppliedPromotion[]
    >([]);
    const [manualDiscount, setManualDiscount] = useState(0);
    const [payments, setPayments] = useState<PaymentRow[]>([]);
    const [receivableDueDate, setReceivableDueDate] =
        useState(defaultDueDate());

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
        { sale: { sale_number: string; id: number } }
    >({
        cashier_shift_id: 0,
        customer_id: null,
        discount_total: 0,
        tax_total: 0,
        payment_status: 'paid',
        warehouse_id: 0,
        items: [],
        payments: [],
        voucher_code: null,
        parked_sale_id: null,
        receivable_due_date: null,
    });
    const parkRequest = useHttp<
        ParkBillPayload,
        { message: string; sale: ParkedBill }
    >(emptyParkBillPayload);
    const parkedBillsRequest = useHttp<
        Record<string, never>,
        { data: ParkedBill[] }
    >({});
    const removeParkedBillRequest = useHttp<
        Record<string, never>,
        { message: string }
    >({});
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!currentShift) {
            return;
        }

        const fetchProducts = async () => {
            try {
                const response = await productRequest.get(
                    searchProducts.url({
                        query: {
                            q: search || undefined,
                            category_id:
                                categoryId === 'all' ? undefined : categoryId,
                        },
                    }),
                );
                setProducts(response.data.data);
            } catch {
                toast.error('Daftar produk tidak dapat dimuat.');
            }
        };
        const timeout = window.setTimeout(fetchProducts, 250);

        return () => window.clearTimeout(timeout);
    }, [categoryId, currentShift, productRequest, search]);

    const cartSubtotal = cart.reduce(
        (total, item) => total + item.price_per_unit * item.qty,
        0,
    );
    const itemDiscountTotal = cart.reduce(
        (total, item) => total + item.discount_amount,
        0,
    );
    const promotionDiscountTotal = appliedPromotions.reduce(
        (total, promotion) => total + promotion.amount,
        0,
    );
    const totalDiscount = Math.min(
        cartSubtotal,
        itemDiscountTotal + promotionDiscountTotal + manualDiscount,
    );
    const totalAmount = Math.max(0, cartSubtotal - totalDiscount);
    const cartQuantity = cart.reduce((total, item) => total + item.qty, 0);
    const paymentTotal = payments.reduce(
        (total, payment) => total + Number(payment.amount || 0),
        0,
    );
    const paymentShortage = Math.max(0, totalAmount - paymentTotal);
    const changeAmount = Math.max(0, paymentTotal - totalAmount);
    const usesReceivable = payments.some(
        (payment) => payment.method === 'piutang' && payment.amount > 0,
    );

    const resetTransaction = () => {
        setCart([]);
        setCustomerId('');
        setParkedSaleId(null);
        setAppliedPromotions([]);
        setValidatedVoucherCode('');
        setVoucherCode('');
        setManualDiscount(0);
        setPayments([]);
    };

    const handleOpenShift = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsOpeningShift(true);
        router.post(
            openShift.url(),
            { opening_balance: openingBalance },
            {
                preserveState: true,
                onError: (errors) =>
                    toast.error(
                        errors.opening_balance ??
                            errors.shift ??
                            'Shift tidak dapat dibuka.',
                    ),
                onFinish: () => setIsOpeningShift(false),
            },
        );
    };

    const handleCloseShift = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setIsClosingShift(true);
        router.post(
            closeShift.url(),
            {
                closing_balance_actual: closingBalanceActual,
                notes: closingNotes || null,
            },
            {
                onError: (errors) =>
                    toast.error(
                        errors.closing_balance_actual ??
                            errors.shift ??
                            'Shift tidak dapat ditutup.',
                    ),
                onFinish: () => setIsClosingShift(false),
            },
        );
    };

    const addToCart = (product: Product) => {
        const defaultUnit =
            product.sales_units.find(
                (unit) => unit.id === product.base_unit_id,
            ) ?? product.sales_units[0];

        if (!defaultUnit) {
            toast.error(`Harga ${product.name} belum dikonfigurasi.`);

            return;
        }

        if (Number(product.stock) <= 0) {
            toast.error(`Stok ${product.name} sedang kosong.`);

            return;
        }

        setCart((currentCart) => {
            const existingItem = currentCart.find(
                (item) =>
                    item.product_id === product.id &&
                    item.unit_id === defaultUnit.id,
            );

            if (existingItem) {
                return currentCart.map((item) =>
                    item.id === existingItem.id
                        ? { ...item, qty: item.qty + 1 }
                        : item,
                );
            }

            return [
                ...currentCart,
                {
                    id: `${product.id}-${defaultUnit.id}-${Date.now()}`,
                    product_id: product.id,
                    name: product.name,
                    sku: product.sku,
                    image_url: product.image_url,
                    unit_id: defaultUnit.id,
                    unit_name: defaultUnit.symbol || defaultUnit.name,
                    qty: 1,
                    price_per_unit: Number(defaultUnit.price),
                    discount_amount: 0,
                    default_warehouse_id: product.default_warehouse_id,
                    stock: Number(product.stock),
                    available_units: product.sales_units,
                },
            ];
        });
    };

    const updateQuantity = (itemId: string, quantity: number) => {
        if (quantity <= 0) {
            setCart((currentCart) =>
                currentCart.filter((item) => item.id !== itemId),
            );

            return;
        }

        setCart((currentCart) =>
            currentCart.map((item) => {
                if (item.id !== itemId) {
                    return item;
                }

                const unit = item.available_units.find(
                    (availableUnit) => availableUnit.id === item.unit_id,
                );
                const conversion = unit?.conversion_qty ?? 1;
                const maximumQuantity = Math.max(
                    0.001,
                    Math.floor((item.stock / conversion) * 1000) / 1000,
                );
                const nextQuantity = Math.min(quantity, maximumQuantity);

                if (quantity > maximumQuantity) {
                    toast.error(`Stok ${item.name} tidak mencukupi.`);
                }

                return { ...item, qty: nextQuantity };
            }),
        );
    };

    const updateUnit = (itemId: string, unitId: number) => {
        setCart((currentCart) =>
            currentCart.map((item) => {
                if (item.id !== itemId) {
                    return item;
                }

                const unit = item.available_units.find(
                    (availableUnit) => availableUnit.id === unitId,
                );

                return unit
                    ? {
                          ...item,
                          unit_id: unit.id,
                          unit_name: unit.symbol || unit.name,
                          price_per_unit: Number(unit.price),
                          qty: 1,
                          discount_amount: 0,
                      }
                    : item;
            }),
        );
    };

    const updateItemDiscount = (itemId: string, amount: number) => {
        setCart((currentCart) =>
            currentCart.map((item) =>
                item.id === itemId
                    ? {
                          ...item,
                          discount_amount: Math.min(
                              Math.max(0, amount),
                              item.price_per_unit * item.qty,
                          ),
                      }
                    : item,
            ),
        );
    };

    const applyVoucher = async () => {
        if (!voucherCode || !currentShift) {
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
            const reward = promotion.rewards?.[0];
            let amount = 0;

            if (reward?.reward_type === 'percent_discount') {
                amount = cartSubtotal * (reward.value / 100);
            } else if (reward?.reward_type === 'fixed_discount') {
                amount = reward.value;
            }

            amount = Math.min(amount, cartSubtotal);

            if (amount <= 0) {
                toast.error('Voucher ini belum memiliki nilai diskon.');

                return;
            }

            setAppliedPromotions((promotions) => [
                ...promotions.filter(
                    (promotionItem) => promotionItem.voucher_id !== voucher.id,
                ),
                {
                    promotion_id: promotion.id,
                    voucher_id: voucher.id,
                    amount,
                    type: promotion.type,
                    name: promotion.name,
                },
            ]);
            setValidatedVoucherCode(voucherCode.toUpperCase());
            setVoucherCode('');
            toast.success('Voucher berhasil diterapkan.');
        } catch {
            toast.error('Voucher tidak valid atau sudah kedaluwarsa.');
        }
    };

    const openParkedBills = async () => {
        if (!currentShift) {
            return;
        }

        setIsParkedDialogOpen(true);

        try {
            const response = await parkedBillsRequest.get(
                parkedBillsIndex.url({
                    query: { cashier_shift_id: currentShift.id },
                }),
            );
            setParkedBills(response.data);
        } catch {
            toast.error('Antrian transaksi tidak dapat dimuat.');
        }
    };

    const parkCurrentBill = async () => {
        if (!currentShift || cart.length === 0) {
            toast.error('Belum ada barang yang dapat ditahan.');

            return;
        }

        if (parkedSaleId) {
            resetTransaction();
            toast.success('Transaksi dikembalikan ke antrian.');

            return;
        }

        const payload: ParkBillPayload = {
            cashier_shift_id: currentShift.id,
            customer_id: customerId ? Number(customerId) : null,
            subtotal: cartSubtotal,
            discount_total: totalDiscount,
            tax_total: 0,
            total_amount: totalAmount,
            items: cart.map((item) => ({
                product_id: item.product_id,
                unit_id: item.unit_id,
                qty: item.qty,
                price_per_unit: item.price_per_unit,
                discount_amount: item.discount_amount,
                subtotal: item.price_per_unit * item.qty - item.discount_amount,
            })),
        };

        try {
            parkRequest.transform(() => payload);
            await parkRequest.post(storeParkedBill.url());
            resetTransaction();
            setIsCartSheetOpen(false);
            toast.success('Transaksi disimpan ke antrian.');
        } catch {
            toast.error('Transaksi belum dapat ditahan.');
        }
    };

    const resumeParkedBill = (bill: ParkedBill) => {
        const restoredItems = bill.items.map((saleItem) => {
            const loadedProduct = products.find(
                (product) => product.id === saleItem.product_id,
            );
            const fallbackUnit: SalesUnit = {
                id: saleItem.unit_id,
                name: saleItem.unit?.name ?? 'Satuan',
                symbol: saleItem.unit?.symbol ?? '',
                conversion_qty: 1,
                price: Number(saleItem.price_per_unit),
            };
            const availableUnits = loadedProduct?.sales_units.length
                ? loadedProduct.sales_units
                : [fallbackUnit];
            const selectedUnit =
                availableUnits.find((unit) => unit.id === saleItem.unit_id) ??
                fallbackUnit;

            return {
                id: `${saleItem.product_id}-${saleItem.unit_id}-${saleItem.id}`,
                product_id: saleItem.product_id,
                name: saleItem.product.name,
                sku: saleItem.product.sku,
                image_url: loadedProduct?.image_url ?? null,
                unit_id: saleItem.unit_id,
                unit_name: selectedUnit.symbol || selectedUnit.name,
                qty: Number(saleItem.qty),
                price_per_unit: Number(saleItem.price_per_unit),
                discount_amount: Number(saleItem.discount_amount),
                default_warehouse_id:
                    loadedProduct?.default_warehouse_id ??
                    saleItem.product.default_warehouse_id,
                stock: Number(
                    loadedProduct?.stock ?? saleItem.product.stok_saat_ini,
                ),
                available_units: availableUnits,
            } satisfies CartItem;
        });

        setCart(restoredItems);
        setCustomerId(bill.customer_id ? String(bill.customer_id) : '');
        setParkedSaleId(bill.id);
        setParkedBills((bills) =>
            bills.filter((parkedBill) => parkedBill.id !== bill.id),
        );
        setIsParkedDialogOpen(false);
        setIsCartSheetOpen(true);
        toast.success(`Transaksi ${bill.sale_number} dilanjutkan.`);
    };

    const cancelParkedBill = async (bill: ParkedBill) => {
        if (!window.confirm(`Batalkan antrian ${bill.sale_number}?`)) {
            return;
        }

        try {
            await removeParkedBillRequest.delete(
                destroyParkedBill.url(bill.id),
            );
            setParkedBills((bills) =>
                bills.filter((parkedBill) => parkedBill.id !== bill.id),
            );
            toast.success('Antrian berhasil dibatalkan.');
        } catch {
            toast.error('Antrian tidak dapat dibatalkan.');
        }
    };

    const openCheckout = () => {
        if (cart.length === 0) {
            return;
        }

        setPayments([
            {
                id: `payment-${Date.now()}`,
                method: 'cash',
                amount: totalAmount,
                reference_number: '',
            },
        ]);
        setReceivableDueDate(defaultDueDate());
        setIsCheckoutModalOpen(true);
    };

    const addPaymentRow = () => {
        setPayments((rows) => [
            ...rows,
            {
                id: `payment-${Date.now()}`,
                method: 'qris',
                amount: Math.max(0, paymentShortage),
                reference_number: '',
            },
        ]);
    };

    const updatePayment = (
        paymentId: string,
        field: 'method' | 'amount' | 'reference_number',
        value: string | number,
    ) => {
        setPayments((rows) =>
            rows.map((payment) =>
                payment.id === paymentId
                    ? { ...payment, [field]: value }
                    : payment,
            ),
        );
    };

    const processCheckout = async () => {
        if (!currentShift || paymentTotal < totalAmount) {
            toast.error('Jumlah pembayaran masih kurang.');

            return;
        }

        if (
            payments.some((payment) =>
                ['piutang', 'points'].includes(payment.method),
            ) &&
            !customerId
        ) {
            toast.error('Pilih pelanggan untuk pembayaran piutang atau poin.');

            return;
        }

        const payload: CheckoutPayload = {
            cashier_shift_id: currentShift.id,
            customer_id: customerId ? Number(customerId) : null,
            discount_total: manualDiscount,
            tax_total: 0,
            payment_status: usesReceivable
                ? payments.some(
                      (payment) =>
                          payment.method !== 'piutang' && payment.amount > 0,
                  )
                    ? 'partial'
                    : 'unpaid'
                : 'paid',
            warehouse_id: cart[0]?.default_warehouse_id ?? 0,
            items: cart.map((item) => ({
                product_id: item.product_id,
                unit_id: item.unit_id,
                qty: item.qty,
                discount_amount: item.discount_amount,
            })),
            payments: payments
                .filter((payment) => payment.amount > 0)
                .map((payment) => ({
                    method: payment.method,
                    amount: Number(payment.amount),
                    reference_number: payment.reference_number || undefined,
                })),
            voucher_code: validatedVoucherCode || null,
            parked_sale_id: parkedSaleId,
            receivable_due_date: usesReceivable ? receivableDueDate : null,
        };

        try {
            checkoutRequest.transform(() => payload);
            const response = await checkoutRequest.post(checkoutStore.url());
            toast.success(`Transaksi ${response.sale.sale_number} berhasil.`);
            resetTransaction();
            setIsCheckoutModalOpen(false);
            setIsCartSheetOpen(false);
            window.open(
                `/admin/pos/print/${response.sale.id}`,
                '_blank',
                'noopener,noreferrer',
            );
        } catch {
            toast.error(
                'Checkout gagal. Periksa stok, harga, promo, dan pembayaran.',
            );
        }
    };

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'F2') {
                event.preventDefault();
                searchInputRef.current?.focus();
            } else if (event.key === 'F6') {
                event.preventDefault();
                openCheckout();
            } else if (event.key === 'F8') {
                event.preventDefault();
                void parkCurrentBill();
            } else if (event.key === 'F9') {
                event.preventDefault();
                void openParkedBills();
            } else if (event.key === 'Escape' && cart.length > 0) {
                setCart((currentCart) => currentCart.slice(0, -1));
            }
        };

        window.addEventListener('keydown', handleKeyDown);

        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    if (!currentShift) {
        return (
            <PosLayout title="POS - Buka Shift">
                <div className="grid h-full place-items-center bg-stone-50 p-4">
                    <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-6 sm:p-7">
                        <span className="grid size-11 place-items-center rounded-xl border border-lime-200 bg-lime-50 text-lime-700">
                            <WalletCards className="size-5" />
                        </span>
                        <h1 className="mt-5 text-2xl font-bold text-stone-800">
                            Buka Shift Kasir
                        </h1>
                        <p className="mt-2 text-sm leading-6 text-stone-500">
                            Masukkan modal awal di laci sebelum mulai transaksi.
                            Nilai ini dipakai untuk rekonsiliasi saat tutup
                            shift.
                        </p>
                        <form
                            onSubmit={handleOpenShift}
                            className="mt-6 space-y-5"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="opening_balance">
                                    Modal awal (Rp)
                                </Label>
                                <Input
                                    id="opening_balance"
                                    type="number"
                                    inputMode="numeric"
                                    value={openingBalance}
                                    onChange={(event) =>
                                        setOpeningBalance(event.target.value)
                                    }
                                    required
                                    min="0"
                                    className="h-12 text-lg font-semibold"
                                    placeholder="Contoh: 500000"
                                />
                                <p className="text-xs leading-5 text-stone-500">
                                    Isi 0 jika laci dimulai tanpa uang tunai.
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-11"
                                    onClick={() =>
                                        router.get('/admin/dashboard')
                                    }
                                >
                                    Kembali
                                </Button>
                                <Button
                                    type="submit"
                                    className="h-11"
                                    disabled={isOpeningShift}
                                >
                                    {isOpeningShift ? 'Membuka…' : 'Buka Shift'}
                                </Button>
                            </div>
                        </form>
                    </section>
                </div>
            </PosLayout>
        );
    }

    const cartPanel = (
        <div className="flex h-full min-h-0 flex-col bg-white">
            <div className="border-b border-stone-200 p-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-xs font-semibold text-stone-500">
                            Transaksi aktif
                        </p>
                        <h2 className="font-bold text-stone-800">
                            {parkedSaleId
                                ? `Lanjut antrian #${parkedSaleId}`
                                : 'Tagihan saat ini'}
                        </h2>
                    </div>
                    <span className="rounded-full border border-stone-200 bg-stone-50 px-2.5 py-1 text-xs font-semibold text-stone-600">
                        {formatNumber(cartQuantity)} item
                    </span>
                </div>
                <div className="relative mt-3">
                    <UserRound className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
                    <select
                        aria-label="Pilih pelanggan"
                        value={customerId}
                        onChange={(event) => setCustomerId(event.target.value)}
                        className="h-11 w-full appearance-none rounded-lg border border-stone-200 bg-white pr-9 pl-9 text-sm text-stone-700"
                    >
                        <option value="">Pelanggan umum</option>
                        {customers.map((customer) => (
                            <option key={customer.id} value={customer.id}>
                                {customer.name} · {customer.phone}
                            </option>
                        ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-stone-400" />
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
                {cart.length === 0 ? (
                    <div className="grid h-full min-h-56 place-items-center p-8 text-center">
                        <div>
                            <span className="mx-auto grid size-12 place-items-center rounded-xl border border-stone-200 bg-stone-50 text-stone-400">
                                <ShoppingCart className="size-5" />
                            </span>
                            <p className="mt-4 font-semibold text-stone-700">
                                Keranjang masih kosong
                            </p>
                            <p className="mt-1 text-sm text-stone-500">
                                Pilih produk atau pindai barcode.
                            </p>
                        </div>
                    </div>
                ) : (
                    <ul className="divide-y divide-stone-200">
                        {cart.map((item) => (
                            <li key={item.id} className="space-y-3 p-4">
                                <div className="flex items-start gap-3">
                                    <div className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-lg border border-stone-200 bg-stone-50 text-[10px] text-stone-400">
                                        {item.image_url ? (
                                            <img
                                                src={item.image_url}
                                                alt=""
                                                className="size-full object-cover"
                                            />
                                        ) : (
                                            <PackageOpen className="size-5" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="line-clamp-2 text-sm font-semibold text-stone-800">
                                            {item.name}
                                        </p>
                                        <p className="mt-0.5 text-xs text-stone-500">
                                            {item.sku}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        aria-label={`Hapus ${item.name}`}
                                        onClick={() =>
                                            setCart((currentCart) =>
                                                currentCart.filter(
                                                    (cartItem) =>
                                                        cartItem.id !== item.id,
                                                ),
                                            )
                                        }
                                        className="grid size-10 shrink-0 place-items-center rounded-lg text-red-500 hover:bg-red-50"
                                    >
                                        <Trash2 className="size-4" />
                                    </button>
                                </div>
                                <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
                                    <select
                                        aria-label={`Satuan ${item.name}`}
                                        value={item.unit_id}
                                        onChange={(event) =>
                                            updateUnit(
                                                item.id,
                                                Number(event.target.value),
                                            )
                                        }
                                        className="h-10 min-w-0 rounded-lg border border-stone-200 bg-white px-2 text-xs font-semibold text-stone-700"
                                    >
                                        {item.available_units.map((unit) => (
                                            <option
                                                key={unit.id}
                                                value={unit.id}
                                            >
                                                {unit.name} ·{' '}
                                                {formatCurrency(unit.price)}
                                            </option>
                                        ))}
                                    </select>
                                    <div className="flex items-center rounded-lg border border-stone-200">
                                        <button
                                            type="button"
                                            aria-label="Kurangi jumlah"
                                            className="grid size-10 place-items-center text-stone-600 hover:bg-stone-50"
                                            onClick={() =>
                                                updateQuantity(
                                                    item.id,
                                                    item.qty - 1,
                                                )
                                            }
                                        >
                                            <Minus className="size-3.5" />
                                        </button>
                                        <input
                                            aria-label={`Jumlah ${item.name}`}
                                            type="number"
                                            inputMode="decimal"
                                            min="0.001"
                                            step="0.001"
                                            value={item.qty}
                                            onChange={(event) =>
                                                updateQuantity(
                                                    item.id,
                                                    Number(event.target.value),
                                                )
                                            }
                                            className="h-10 w-14 border-x border-stone-200 bg-white text-center text-sm font-bold"
                                        />
                                        <button
                                            type="button"
                                            aria-label="Tambah jumlah"
                                            className="grid size-10 place-items-center text-stone-600 hover:bg-stone-50"
                                            onClick={() =>
                                                updateQuantity(
                                                    item.id,
                                                    item.qty + 1,
                                                )
                                            }
                                        >
                                            <Plus className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex items-end justify-between gap-3">
                                    <label className="text-xs text-stone-500">
                                        Diskon item
                                        <Input
                                            type="number"
                                            inputMode="numeric"
                                            min="0"
                                            value={item.discount_amount || ''}
                                            onChange={(event) =>
                                                updateItemDiscount(
                                                    item.id,
                                                    Number(event.target.value),
                                                )
                                            }
                                            placeholder="Rp 0"
                                            className="mt-1 h-9 w-28"
                                        />
                                    </label>
                                    <div className="text-right">
                                        <p className="text-xs text-stone-500">
                                            {formatNumber(item.qty)} ×{' '}
                                            {formatCurrency(
                                                item.price_per_unit,
                                            )}
                                        </p>
                                        <p className="font-bold text-stone-800">
                                            {formatCurrency(
                                                item.price_per_unit * item.qty -
                                                    item.discount_amount,
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            <div className="space-y-3 border-t border-stone-200 bg-stone-50 p-4">
                <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                    <Input
                        placeholder="Kode voucher"
                        value={voucherCode}
                        onChange={(event) =>
                            setVoucherCode(event.target.value.toUpperCase())
                        }
                        className="h-10 bg-white"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={applyVoucher}
                        disabled={!voucherCode || voucherRequest.processing}
                    >
                        Terapkan
                    </Button>
                </div>
                <div className="grid grid-cols-[1fr_120px] items-center gap-3">
                    <label
                        htmlFor="manual-discount"
                        className="text-sm text-stone-600"
                    >
                        Diskon transaksi
                    </label>
                    <Input
                        id="manual-discount"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max={cartSubtotal}
                        value={manualDiscount || ''}
                        onChange={(event) =>
                            setManualDiscount(Number(event.target.value))
                        }
                        placeholder="Rp 0"
                        className="h-9 bg-white text-right"
                    />
                </div>
                <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between text-stone-500">
                        <span>Subtotal</span>
                        <span>{formatCurrency(cartSubtotal)}</span>
                    </div>
                    {totalDiscount > 0 && (
                        <div className="flex justify-between text-emerald-700">
                            <span>Total diskon</span>
                            <span>−{formatCurrency(totalDiscount)}</span>
                        </div>
                    )}
                    <div className="flex items-center justify-between border-t border-stone-200 pt-2 text-lg font-bold text-stone-800">
                        <span>Total</span>
                        <span className="text-lime-700">
                            {formatCurrency(totalAmount)}
                        </span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11"
                        disabled={cart.length === 0 || parkRequest.processing}
                        onClick={parkCurrentBill}
                    >
                        <Pause className="size-4" />
                        {parkedSaleId ? 'Tahan lagi' : 'Tahan (F8)'}
                    </Button>
                    <Button
                        type="button"
                        className="h-11"
                        disabled={cart.length === 0}
                        onClick={openCheckout}
                    >
                        <CreditCard className="size-4" />
                        Bayar (F6)
                    </Button>
                </div>
            </div>
        </div>
    );

    return (
        <PosLayout
            title="POS"
            headerActions={
                <div className="flex items-center gap-2">
                    <span className="hidden text-xs text-stone-500 xl:inline">
                        {cashier.name} · Shift #{currentShift.id}
                    </span>
                    <button
                        type="button"
                        onClick={openParkedBills}
                        className="hidden min-h-10 items-center gap-2 rounded-lg border border-stone-200 px-3 text-sm font-semibold text-stone-700 hover:bg-stone-50 sm:flex"
                    >
                        <Clock3 className="size-4" />
                        Antrian (F9)
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsCloseShiftModalOpen(true)}
                        className="min-h-10 rounded-lg border border-amber-200 bg-amber-50 px-3 text-sm font-semibold text-amber-800 hover:bg-amber-100"
                    >
                        Tutup Shift
                    </button>
                </div>
            }
        >
            <div className="grid h-full min-h-0 bg-stone-50 lg:grid-cols-[minmax(0,1fr)_420px]">
                <main className="flex min-h-0 flex-col overflow-hidden border-r border-stone-200">
                    <div className="space-y-3 border-b border-stone-200 bg-white p-3 sm:p-4">
                        <div className="flex items-center gap-2">
                            <div className="relative min-w-0 flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
                                <Input
                                    ref={searchInputRef}
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    onKeyDown={(event) => {
                                        if (
                                            event.key === 'Enter' &&
                                            products.length === 1
                                        ) {
                                            event.preventDefault();
                                            addToCart(products[0]);
                                            setSearch('');
                                        }
                                    }}
                                    className="h-12 bg-white pr-12 pl-9 text-base"
                                    placeholder="Cari produk, SKU, atau pindai barcode (F2)"
                                    autoFocus
                                />
                                <Barcode className="pointer-events-none absolute top-1/2 right-3 size-5 -translate-y-1/2 text-stone-400" />
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                className="size-12 shrink-0 sm:hidden"
                                aria-label="Buka antrian transaksi"
                                onClick={openParkedBills}
                            >
                                <Clock3 className="size-5" />
                            </Button>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1">
                            <button
                                type="button"
                                onClick={() => setCategoryId('all')}
                                className={`min-h-10 shrink-0 rounded-lg border px-4 text-sm font-semibold ${
                                    categoryId === 'all'
                                        ? 'border-lime-300 bg-lime-100 text-lime-900'
                                        : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                                }`}
                            >
                                Semua
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category.id}
                                    type="button"
                                    onClick={() =>
                                        setCategoryId(String(category.id))
                                    }
                                    className={`min-h-10 shrink-0 rounded-lg border px-4 text-sm font-semibold ${
                                        categoryId === String(category.id)
                                            ? 'border-lime-300 bg-lime-100 text-lime-900'
                                            : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                                    }`}
                                >
                                    {category.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="min-h-0 flex-1 overflow-y-auto p-3 pb-24 sm:p-4 sm:pb-24 lg:pb-4">
                        {products.length > 0 ? (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                                {products.map((product) => {
                                    const quantityInCart = cart
                                        .filter(
                                            (item) =>
                                                item.product_id === product.id,
                                        )
                                        .reduce(
                                            (total, item) => total + item.qty,
                                            0,
                                        );

                                    return (
                                        <article
                                            key={product.id}
                                            className="group flex min-h-64 flex-col overflow-hidden rounded-xl border border-stone-200 bg-white"
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    addToCart(product)
                                                }
                                                className="flex flex-1 flex-col p-3 text-left"
                                                disabled={
                                                    Number(product.stock) <= 0
                                                }
                                            >
                                                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg border border-stone-100 bg-stone-50">
                                                    {product.image_url ? (
                                                        <img
                                                            src={
                                                                product.image_url
                                                            }
                                                            alt={product.name}
                                                            className="size-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="grid size-full place-items-center text-stone-300">
                                                            <PackageOpen className="size-8" />
                                                        </div>
                                                    )}
                                                    {quantityInCart > 0 && (
                                                        <span className="absolute top-2 right-2 grid min-w-7 place-items-center rounded-full border border-lime-300 bg-lime-100 px-2 py-1 text-xs font-bold text-lime-900">
                                                            {formatNumber(
                                                                quantityInCart,
                                                            )}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-3 line-clamp-2 min-h-10 text-sm font-semibold text-stone-800">
                                                    {product.name}
                                                </p>
                                                <p className="mt-1 text-[11px] text-stone-500">
                                                    {product.sku}
                                                </p>
                                                <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                                                    <div>
                                                        <p className="font-bold text-lime-700">
                                                            {product.price_retail
                                                                ? formatCurrency(
                                                                      product.price_retail,
                                                                  )
                                                                : 'Belum ada harga'}
                                                        </p>
                                                        <p className="text-[11px] text-stone-500">
                                                            Stok{' '}
                                                            {formatNumber(
                                                                product.stock,
                                                            )}
                                                        </p>
                                                    </div>
                                                    <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-lime-300 bg-lime-100 text-lime-900 group-hover:bg-lime-200">
                                                        <Plus className="size-4" />
                                                    </span>
                                                </div>
                                            </button>
                                        </article>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="grid h-full min-h-64 place-items-center text-center">
                                <div>
                                    <PackageOpen className="mx-auto size-10 text-stone-300" />
                                    <p className="mt-3 font-semibold text-stone-700">
                                        Produk tidak ditemukan
                                    </p>
                                    <p className="mt-1 text-sm text-stone-500">
                                        Coba kata kunci atau kategori lain.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                <aside className="hidden min-h-0 border-l border-stone-200 lg:block">
                    {cartPanel}
                </aside>

                <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white p-3 lg:hidden">
                    <Button
                        type="button"
                        className="h-14 w-full justify-between px-5"
                        onClick={() => setIsCartSheetOpen(true)}
                    >
                        <span className="flex items-center gap-2">
                            <ShoppingCart className="size-5" />
                            Lihat Tagihan ({formatNumber(cartQuantity)})
                        </span>
                        <span>{formatCurrency(totalAmount)}</span>
                    </Button>
                </div>
            </div>

            <Sheet open={isCartSheetOpen} onOpenChange={setIsCartSheetOpen}>
                <SheetContent
                    side="bottom"
                    className="h-[92dvh] gap-0 rounded-t-2xl p-0 lg:hidden"
                >
                    <SheetHeader className="sr-only">
                        <SheetTitle>Tagihan Saat Ini</SheetTitle>
                        <SheetDescription>
                            Atur produk dan lanjutkan pembayaran.
                        </SheetDescription>
                    </SheetHeader>
                    {cartPanel}
                </SheetContent>
            </Sheet>

            <Dialog
                open={isParkedDialogOpen}
                onOpenChange={setIsParkedDialogOpen}
            >
                <DialogContent className="max-h-[85dvh] overflow-hidden p-0 sm:max-w-2xl">
                    <DialogHeader className="border-b border-stone-200 p-5 pr-12">
                        <DialogTitle>Antrian Transaksi</DialogTitle>
                        <DialogDescription>
                            Lanjutkan pelanggan yang sempat menunggu tanpa
                            kehilangan isi keranjang.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="max-h-[65dvh] overflow-y-auto p-4">
                        {parkedBillsRequest.processing ? (
                            <p className="py-10 text-center text-sm text-stone-500">
                                Memuat antrian…
                            </p>
                        ) : parkedBills.length > 0 ? (
                            <div className="space-y-3">
                                {parkedBills.map((bill, index) => (
                                    <article
                                        key={bill.id}
                                        className="rounded-xl border border-stone-200 p-4"
                                    >
                                        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="grid size-8 place-items-center rounded-lg bg-lime-100 text-sm font-bold text-lime-900">
                                                        {index + 1}
                                                    </span>
                                                    <div>
                                                        <p className="font-bold text-stone-800">
                                                            {bill.sale_number}
                                                        </p>
                                                        <p className="text-xs text-stone-500">
                                                            {bill.customer
                                                                ?.name ??
                                                                'Pelanggan umum'}{' '}
                                                            ·{' '}
                                                            {bill.items.length}{' '}
                                                            baris
                                                        </p>
                                                    </div>
                                                </div>
                                                <p className="mt-3 font-bold text-lime-700">
                                                    {formatCurrency(
                                                        bill.total_amount,
                                                    )}
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() =>
                                                        cancelParkedBill(bill)
                                                    }
                                                >
                                                    Batal Antrian
                                                </Button>
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    onClick={() =>
                                                        resumeParkedBill(bill)
                                                    }
                                                >
                                                    Lanjutkan
                                                </Button>
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="py-12 text-center">
                                <ReceiptText className="mx-auto size-10 text-stone-300" />
                                <p className="mt-3 font-semibold text-stone-700">
                                    Belum ada antrian
                                </p>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isCheckoutModalOpen}
                onOpenChange={setIsCheckoutModalOpen}
            >
                <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">
                            Pembayaran
                        </DialogTitle>
                        <DialogDescription>
                            Pisahkan pembayaran ke beberapa metode bila
                            diperlukan.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="rounded-xl border border-lime-200 bg-lime-50 p-4">
                        <p className="text-sm text-stone-600">Total tagihan</p>
                        <p className="mt-1 text-3xl font-bold text-stone-800">
                            {formatCurrency(totalAmount)}
                        </p>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <Label>Metode pembayaran</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addPaymentRow}
                            >
                                <Plus className="size-4" />
                                Split Pembayaran
                            </Button>
                        </div>
                        {payments.map((payment, index) => (
                            <div
                                key={payment.id}
                                className="grid gap-3 rounded-xl border border-stone-200 p-3 sm:grid-cols-[180px_minmax(0,1fr)_auto]"
                            >
                                <select
                                    aria-label={`Metode pembayaran ${index + 1}`}
                                    value={payment.method}
                                    onChange={(event) =>
                                        updatePayment(
                                            payment.id,
                                            'method',
                                            event.target.value,
                                        )
                                    }
                                    className="h-11 rounded-lg border border-stone-200 bg-white px-3 text-sm"
                                >
                                    {Object.entries(paymentMethodLabels).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </select>
                                <div className="grid gap-2 sm:grid-cols-2">
                                    <Input
                                        aria-label={`Nominal pembayaran ${index + 1}`}
                                        type="number"
                                        inputMode="numeric"
                                        min="1"
                                        value={payment.amount || ''}
                                        onChange={(event) =>
                                            updatePayment(
                                                payment.id,
                                                'amount',
                                                Number(event.target.value),
                                            )
                                        }
                                        className="h-11 text-right font-semibold"
                                        placeholder="Nominal"
                                    />
                                    <Input
                                        aria-label={`Nomor referensi pembayaran ${index + 1}`}
                                        value={payment.reference_number}
                                        onChange={(event) =>
                                            updatePayment(
                                                payment.id,
                                                'reference_number',
                                                event.target.value,
                                            )
                                        }
                                        className="h-11"
                                        placeholder="Referensi (opsional)"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Hapus metode pembayaran"
                                    disabled={payments.length === 1}
                                    onClick={() =>
                                        setPayments((rows) =>
                                            rows.filter(
                                                (row) => row.id !== payment.id,
                                            ),
                                        )
                                    }
                                >
                                    <Trash2 className="size-4 text-red-500" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {payments.some((payment) => payment.method === 'cash') && (
                        <div className="flex flex-wrap gap-2">
                            {[totalAmount, 50_000, 100_000, 200_000].map(
                                (amount) => (
                                    <Button
                                        key={amount}
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                            const cashRow = payments.find(
                                                (payment) =>
                                                    payment.method === 'cash',
                                            );

                                            if (cashRow) {
                                                updatePayment(
                                                    cashRow.id,
                                                    'amount',
                                                    amount,
                                                );
                                            }
                                        }}
                                    >
                                        {amount === totalAmount
                                            ? 'Uang pas'
                                            : formatCurrency(amount)}
                                    </Button>
                                ),
                            )}
                        </div>
                    )}

                    {usesReceivable && (
                        <div className="grid gap-2">
                            <Label htmlFor="receivable-due-date">
                                Jatuh tempo piutang
                            </Label>
                            <Input
                                id="receivable-due-date"
                                type="date"
                                value={receivableDueDate}
                                min={new Date().toISOString().slice(0, 10)}
                                onChange={(event) =>
                                    setReceivableDueDate(event.target.value)
                                }
                            />
                            {!customerId && (
                                <p className="text-xs text-red-600">
                                    Pilih pelanggan sebelum mencatat piutang.
                                </p>
                            )}
                        </div>
                    )}

                    <div className="grid gap-2 rounded-xl border border-stone-200 bg-stone-50 p-4 text-sm sm:grid-cols-3">
                        <div>
                            <p className="text-stone-500">Dibayar</p>
                            <p className="font-bold text-stone-800">
                                {formatCurrency(paymentTotal)}
                            </p>
                        </div>
                        <div>
                            <p className="text-stone-500">Kekurangan</p>
                            <p className="font-bold text-red-600">
                                {formatCurrency(paymentShortage)}
                            </p>
                        </div>
                        <div>
                            <p className="text-stone-500">Kembalian</p>
                            <p className="font-bold text-emerald-700">
                                {formatCurrency(changeAmount)}
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCheckoutModalOpen(false)}
                        >
                            Kembali
                        </Button>
                        <Button
                            type="button"
                            className="min-w-48"
                            onClick={processCheckout}
                            disabled={
                                checkoutRequest.processing ||
                                paymentShortage > 0 ||
                                (usesReceivable && !customerId)
                            }
                        >
                            <CreditCard className="size-4" />
                            {checkoutRequest.processing
                                ? 'Memproses…'
                                : 'Bayar & Cetak Struk'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isCloseShiftModalOpen}
                onOpenChange={setIsCloseShiftModalOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            Tutup Shift #{currentShift.id}
                        </DialogTitle>
                        <DialogDescription>
                            Hitung uang fisik di laci. Sistem membandingkannya
                            dengan modal awal dan transaksi tunai.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCloseShift} className="space-y-5">
                        <div className="grid gap-2">
                            <Label htmlFor="closing_balance_actual">
                                Uang fisik aktual (Rp)
                            </Label>
                            <Input
                                id="closing_balance_actual"
                                type="number"
                                inputMode="numeric"
                                min="0"
                                required
                                value={closingBalanceActual}
                                onChange={(event) =>
                                    setClosingBalanceActual(event.target.value)
                                }
                                className="h-12 text-lg font-semibold"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="closing_notes">
                                Catatan (opsional)
                            </Label>
                            <textarea
                                id="closing_notes"
                                rows={3}
                                value={closingNotes}
                                onChange={(event) =>
                                    setClosingNotes(event.target.value)
                                }
                                className="w-full rounded-lg border border-stone-200 bg-white px-3 py-2 text-sm"
                                placeholder="Contoh: uang receh disimpan terpisah"
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsCloseShiftModalOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={isClosingShift}
                                className="bg-amber-300 text-amber-950 hover:bg-amber-200"
                            >
                                {isClosingShift
                                    ? 'Menutup…'
                                    : 'Konfirmasi Tutup Shift'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </PosLayout>
    );
}
