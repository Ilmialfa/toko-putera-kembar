import { useForm } from '@inertiajs/react';
import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
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

type SaleItem = {
    id: number;
    product_id: number;
    qty: number;
    price_per_unit: number;
    subtotal: number;
    product: {
        id: number;
        name: string;
        sku: string;
    };
};

type SaleDetail = {
    id: number;
    sale_number: string;
    total_amount: number;
    items: SaleItem[];
};

type ReturnItemForm = {
    sale_item_id: number;
    qty: number | string;
    condition: string;
};

export default function ReturnDialog({
    saleId,
    isOpen,
    onOpenChange,
}: {
    saleId: number | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [sale, setSale] = useState<SaleDetail | null>(null);
    const [returnItems, setReturnItems] = useState<ReturnItemForm[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);

    const { setData, post, processing, errors, clearErrors, transform } =
        useForm({
            sale_id: '',
            type: 'return',
            total_refund_amount: 0,
            items: [] as ReturnItemForm[],
        });

    useEffect(() => {
        if (!isOpen || saleId === null) {
            return;
        }

        let isCancelled = false;

        const loadSale = async () => {
            try {
                const response = await fetch(
                    `/admin/sales/transactions/${saleId}`,
                );

                if (!response.ok) {
                    throw new Error('Data transaksi tidak dapat dimuat.');
                }

                const saleDetail = (await response.json()) as SaleDetail;

                if (isCancelled) {
                    return;
                }

                setSale(saleDetail);
                setReturnItems(
                    saleDetail.items.map((item) => ({
                        sale_item_id: item.id,
                        qty: '',
                        condition: 'good',
                    })),
                );
                setData({
                    sale_id: saleDetail.id.toString(),
                    type: 'return',
                    total_refund_amount: 0,
                    items: [],
                });
                clearErrors();
                setLoadError(null);
            } catch (error) {
                if (!isCancelled) {
                    setLoadError(
                        error instanceof Error
                            ? error.message
                            : 'Data transaksi tidak dapat dimuat.',
                    );
                }
            }
        };

        void loadSale();

        return () => {
            isCancelled = true;
        };
    }, [clearErrors, isOpen, saleId, setData]);

    const isLoading = isOpen && saleId !== null && sale?.id !== saleId;

    const totalRefundAmount = useMemo(() => {
        if (!sale) {
            return 0;
        }

        return returnItems.reduce((total, returnItem) => {
            const saleItem = sale.items.find(
                (item) => item.id === returnItem.sale_item_id,
            );

            return (
                total +
                (Number(returnItem.qty) || 0) *
                    Number(saleItem?.price_per_unit || 0)
            );
        }, 0);
    }, [returnItems, sale]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Filter out items with 0 qty before submitting
        const itemsToReturn = returnItems
            .filter((item) => Number(item.qty) > 0)
            .map((item) => ({ ...item, qty: Number(item.qty) }));

        if (itemsToReturn.length === 0) {
            toast.error(
                'Pilih minimal 1 barang untuk diretur dengan kuantitas lebih dari 0.',
            );

            return;
        }

        transform((currentData) => ({
            ...currentData,
            total_refund_amount: totalRefundAmount,
            items: itemsToReturn,
        }));

        post('/admin/pos/sale-returns', {
            onSuccess: () => {
                onOpenChange(false);
            },
        });
    };

    const updateItem = <Field extends keyof ReturnItemForm>(
        index: number,
        field: Field,
        value: ReturnItemForm[Field],
    ) => {
        setReturnItems((currentItems) =>
            currentItems.map((currentItem, currentIndex) =>
                currentIndex === index
                    ? { ...currentItem, [field]: value }
                    : currentItem,
            ),
        );
    };

    const updateQuantity = (index: number, value: string) => {
        const normalizedValue = value
            .replace(',', '.')
            .replace(/[^\d.]/g, '')
            .replace(/(\..*)\./g, '$1');

        updateItem(index, 'qty', normalizedValue);
    };

    const limitQuantity = (index: number, maximumQuantity: number) => {
        setReturnItems((currentItems) =>
            currentItems.map((currentItem, currentIndex) => {
                if (currentIndex !== index) {
                    return currentItem;
                }

                const quantity = Number(currentItem.qty);

                return {
                    ...currentItem,
                    qty:
                        Number.isFinite(quantity) && quantity > 0
                            ? String(Math.min(quantity, maximumQuantity))
                            : '',
                };
            }),
        );
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto p-0 sm:max-w-5xl sm:rounded-2xl">
                <DialogHeader className="border-b px-6 py-5 sm:px-8">
                    <DialogTitle>Ajukan Retur Penjualan</DialogTitle>
                    <DialogDescription>
                        {sale
                            ? `Transaksi: ${sale.sale_number}`
                            : 'Memuat data...'}
                    </DialogDescription>
                </DialogHeader>

                {isLoading ? (
                    <div className="flex h-32 items-center justify-center">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                ) : sale ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="px-6 pt-6 sm:px-8">
                            <div className="hidden overflow-hidden rounded-xl border bg-background md:block">
                                <table className="w-full text-left text-sm">
                                    <thead className="border-b bg-stone-50 text-xs text-stone-500 uppercase">
                                        <tr>
                                            <th className="w-[34%] px-5 py-3.5">
                                                Produk
                                            </th>
                                            <th className="w-[16%] px-5 py-3.5">
                                                Harga
                                            </th>
                                            <th className="w-[10%] px-5 py-3.5">
                                                Dibeli
                                            </th>
                                            <th className="w-[23%] px-5 py-3.5">
                                                Jumlah retur
                                            </th>
                                            <th className="w-[17%] px-5 py-3.5">
                                                Kondisi
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {sale.items.map((item, index) => {
                                            const formItem = returnItems[index];

                                            return (
                                                <tr key={item.id}>
                                                    <td className="px-5 py-4">
                                                        <p className="font-medium text-stone-800">
                                                            {item.product?.name}
                                                        </p>
                                                        <p className="text-xs text-stone-500">
                                                            {item.product?.sku}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-4 font-medium text-stone-700 tabular-nums">
                                                        Rp{' '}
                                                        {new Intl.NumberFormat(
                                                            'id-ID',
                                                        ).format(
                                                            Number(
                                                                item.price_per_unit,
                                                            ),
                                                        )}
                                                    </td>
                                                    <td className="px-5 py-4 text-stone-600 tabular-nums">
                                                        {Number(item.qty)}
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <Input
                                                                aria-label={`Jumlah retur ${item.product?.name}`}
                                                                type="text"
                                                                inputMode="decimal"
                                                                autoComplete="off"
                                                                value={
                                                                    formItem?.qty ??
                                                                    ''
                                                                }
                                                                onChange={(e) =>
                                                                    updateQuantity(
                                                                        index,
                                                                        e.target
                                                                            .value,
                                                                    )
                                                                }
                                                                onBlur={() =>
                                                                    limitQuantity(
                                                                        index,
                                                                        Number(
                                                                            item.qty,
                                                                        ),
                                                                    )
                                                                }
                                                                placeholder="0"
                                                                className="h-11 min-w-24 flex-1 text-right font-medium tabular-nums"
                                                            />
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() =>
                                                                    updateItem(
                                                                        index,
                                                                        'qty',
                                                                        String(
                                                                            item.qty,
                                                                        ),
                                                                    )
                                                                }
                                                                className="h-11 shrink-0 px-3"
                                                            >
                                                                Semua
                                                            </Button>
                                                        </div>
                                                        <p className="mt-1.5 text-xs text-muted-foreground">
                                                            Maks.{' '}
                                                            {Number(item.qty)}
                                                        </p>
                                                    </td>
                                                    <td className="px-5 py-4">
                                                        <select
                                                            value={
                                                                formItem?.condition ||
                                                                'good'
                                                            }
                                                            onChange={(e) =>
                                                                updateItem(
                                                                    index,
                                                                    'condition',
                                                                    e.target
                                                                        .value,
                                                                )
                                                            }
                                                            className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                                                        >
                                                            <option value="good">
                                                                Bagus
                                                            </option>
                                                            <option value="damaged">
                                                                Rusak
                                                            </option>
                                                        </select>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-3 md:hidden">
                                {sale.items.map((item, index) => {
                                    const formItem = returnItems[index];

                                    return (
                                        <article
                                            key={item.id}
                                            className="rounded-xl border bg-background p-4"
                                        >
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <p className="font-medium text-stone-800">
                                                        {item.product?.name}
                                                    </p>
                                                    <p className="mt-0.5 text-xs text-stone-500">
                                                        {item.product?.sku}
                                                    </p>
                                                </div>
                                                <p className="shrink-0 font-medium text-stone-700 tabular-nums">
                                                    Rp{' '}
                                                    {new Intl.NumberFormat(
                                                        'id-ID',
                                                    ).format(
                                                        Number(
                                                            item.price_per_unit,
                                                        ),
                                                    )}
                                                </p>
                                            </div>

                                            <div className="mt-4 grid grid-cols-2 gap-3">
                                                <div className="rounded-lg bg-stone-50 px-3 py-2.5">
                                                    <p className="text-xs text-stone-500">
                                                        Dibeli
                                                    </p>
                                                    <p className="mt-1 font-medium text-stone-800 tabular-nums">
                                                        {Number(item.qty)}
                                                    </p>
                                                </div>
                                                <label className="block">
                                                    <span className="text-xs text-stone-500">
                                                        Kondisi
                                                    </span>
                                                    <select
                                                        value={
                                                            formItem?.condition ||
                                                            'good'
                                                        }
                                                        onChange={(e) =>
                                                            updateItem(
                                                                index,
                                                                'condition',
                                                                e.target.value,
                                                            )
                                                        }
                                                        className="mt-1 h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm"
                                                    >
                                                        <option value="good">
                                                            Bagus
                                                        </option>
                                                        <option value="damaged">
                                                            Rusak
                                                        </option>
                                                    </select>
                                                </label>
                                            </div>

                                            <label className="mt-3 block">
                                                <span className="text-xs text-stone-500">
                                                    Jumlah retur (maks.{' '}
                                                    {Number(item.qty)})
                                                </span>
                                                <div className="mt-1 flex items-center gap-2">
                                                    <Input
                                                        aria-label={`Jumlah retur ${item.product?.name}`}
                                                        type="text"
                                                        inputMode="decimal"
                                                        autoComplete="off"
                                                        value={
                                                            formItem?.qty ?? ''
                                                        }
                                                        onChange={(e) =>
                                                            updateQuantity(
                                                                index,
                                                                e.target.value,
                                                            )
                                                        }
                                                        onBlur={() =>
                                                            limitQuantity(
                                                                index,
                                                                Number(
                                                                    item.qty,
                                                                ),
                                                            )
                                                        }
                                                        placeholder="0"
                                                        className="h-11 flex-1 text-right font-medium tabular-nums"
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() =>
                                                            updateItem(
                                                                index,
                                                                'qty',
                                                                String(
                                                                    item.qty,
                                                                ),
                                                            )
                                                        }
                                                        className="h-11 shrink-0 px-3"
                                                    >
                                                        Semua
                                                    </Button>
                                                </div>
                                            </label>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="mx-6 flex items-center justify-between rounded-xl border bg-stone-50 p-4 sm:mx-8 sm:px-5">
                            <div>
                                <p className="text-sm font-medium text-stone-500">
                                    Total Pengembalian Dana
                                </p>
                            </div>
                            <p className="text-xl font-bold text-stone-900">
                                Rp{' '}
                                {new Intl.NumberFormat('id-ID').format(
                                    totalRefundAmount,
                                )}
                            </p>
                        </div>

                        {Object.keys(errors).length > 0 && (
                            <div className="mx-6 rounded-md bg-red-50 p-4 text-sm text-red-600 sm:mx-8">
                                Ada kesalahan input. Silakan periksa kembali.
                            </div>
                        )}

                        <DialogFooter className="sticky bottom-0 border-t bg-background px-6 py-4 sm:px-8">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={processing || totalRefundAmount <= 0}
                            >
                                Proses Retur
                            </Button>
                        </DialogFooter>
                    </form>
                ) : loadError ? (
                    <div className="px-6 py-8 text-sm text-destructive sm:px-8">
                        {loadError}
                    </div>
                ) : null}
            </DialogContent>
        </Dialog>
    );
}
