import { router, useForm, usePage } from '@inertiajs/react';
import {
    ArrowRightLeft,
    ClipboardCheck,
    PackageMinus,
    Plus,
    RotateCcw,
    ShoppingCart,
} from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
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
import AdminLayout from '@/layouts/AdminLayout';

type Option = { id: number; name: string };
type Product = Option & {
    sku: string;
    base_unit_id: number;
    stok_saat_ini: string;
    base_unit: Option & { symbol: string };
    product_units: Array<{
        unit_id: number;
        unit: Option & { symbol: string };
    }>;
};
type Line = {
    product_id: string | number;
    unit_id: string | number;
    qty: string | number;
    price_per_unit?: string | number;
    qty_ordered?: string | number;
};
const statusColor: Record<string, string> = {
    draft: 'bg-stone-100 text-stone-700',
    pending: 'bg-amber-100 text-amber-700',
    sent: 'bg-blue-100 text-blue-700',
    in_transit: 'bg-violet-100 text-violet-700',
    received: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-emerald-100 text-emerald-700',
    approved: 'bg-emerald-100 text-emerald-700',
    cancelled: 'bg-red-100 text-red-700',
};

export default function InventoryOperations(props: any) {
    const {
        purchaseOrders,
        transfers,
        opnames,
        adjustments,
        supplierReturns,
        products,
        warehouses,
        suppliers,
    } = props as {
        purchaseOrders: any[];
        transfers: any[];
        opnames: any[];
        adjustments: any[];
        supplierReturns: any[];
        products: Product[];
        warehouses: Option[];
        suppliers: Option[];
    };
    const permissions: string[] =
        (usePage().props as any).auth.user.permissions ?? [];
    const [dialog, setDialog] = useState<string | null>(null);
    const po = useForm({
        supplier_id: suppliers[0]?.id ?? '',
        warehouse_id: warehouses[0]?.id ?? '',
        expected_date: '',
        notes: '',
        items: [
            { product_id: '', unit_id: '', qty_ordered: 1, price_per_unit: 0 },
        ],
    });
    const transfer = useForm({
        from_warehouse_id: warehouses[0]?.id ?? '',
        to_warehouse_id: warehouses[1]?.id ?? '',
        notes: '',
        items: [{ product_id: '', unit_id: '', qty: 1 }] as Line[],
    });
    const opname = useForm({
        warehouse_id: warehouses[0]?.id ?? '',
        scheduled_date: new Date().toISOString().slice(0, 10),
        scope_type: 'full',
        scope_ids: [] as number[],
        notes: '',
    });
    const adjustment = useForm({
        warehouse_id: warehouses[0]?.id ?? '',
        product_id: '',
        unit_id: '',
        qty: 1,
        reason_type: 'damaged',
        notes: '',
    });
    const supplierReturn = useForm({
        supplier_id: suppliers[0]?.id ?? '',
        warehouse_id: warehouses[0]?.id ?? '',
        notes: '',
        items: [
            { product_id: '', unit_id: '', qty: 1, price_per_unit: 0 },
        ] as Line[],
    });
    const opnameCount = useForm({
        counts: [] as Array<{
            product_id: number;
            physical_qty: string | number;
            notes: string;
        }>,
    });
    const [selectedOpname, setSelectedOpname] = useState<any>(null);
    const submit = (event: FormEvent, form: any, url: string) => {
        event.preventDefault();
        form.post(url, { onSuccess: () => setDialog(null) });
    };
    const beginCount = (item: any) => {
        setSelectedOpname(item);
        opnameCount.setData(
            'counts',
            products.map((product) => ({
                product_id: product.id,
                physical_qty: product.stok_saat_ini,
                notes: '',
            })),
        );
        setDialog('count');
    };

    return (
        <AdminLayout title="Operasional Stok">
            <div className="space-y-6 p-4 md:p-8">
                <header className="rounded-2xl bg-stone-950 p-6 text-white">
                    <p className="text-xs font-bold tracking-[0.18em] text-lime-400 uppercase">
                        Inventory control tower
                    </p>
                    <h2 className="mt-1 text-2xl font-bold">
                        PO, transfer, opname, adjustment & retur
                    </h2>
                    <p className="mt-1 max-w-3xl text-sm text-stone-400">
                        Setiap penyelesaian operasi menulis stock ledger
                        immutable dan menjalankan approval sesuai permission.
                    </p>
                </header>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <Action
                        icon={ShoppingCart}
                        label="Purchase order"
                        onClick={() => setDialog('po')}
                    />
                    <Action
                        icon={ArrowRightLeft}
                        label="Transfer gudang"
                        onClick={() => setDialog('transfer')}
                    />
                    <Action
                        icon={ClipboardCheck}
                        label="Stock opname"
                        onClick={() => setDialog('opname')}
                    />
                    <Action
                        icon={PackageMinus}
                        label="Barang keluar"
                        onClick={() => setDialog('adjustment')}
                    />
                    <Action
                        icon={RotateCcw}
                        label="Retur supplier"
                        onClick={() => setDialog('return')}
                    />
                </div>
                <OperationSection
                    title="Purchase order"
                    rows={purchaseOrders}
                    columns={[
                        ['Nomor', 'po_number'],
                        ['Supplier', 'supplier.name'],
                        ['Total', 'total_amount'],
                        ['Status', 'status'],
                    ]}
                    action={(row) =>
                        row.status === 'draft' && (
                            <div className="flex gap-2">
                                <Small
                                    onClick={() =>
                                        router.patch(
                                            `/admin/inventory/purchase-orders/${row.id}/status`,
                                            { status: 'sent' },
                                        )
                                    }
                                >
                                    Kirim
                                </Small>
                                <Small
                                    onClick={() =>
                                        router.patch(
                                            `/admin/inventory/purchase-orders/${row.id}/status`,
                                            { status: 'cancelled' },
                                        )
                                    }
                                >
                                    Batal
                                </Small>
                            </div>
                        )
                    }
                />
                <OperationSection
                    title="Transfer gudang"
                    rows={transfers}
                    columns={[
                        ['Nomor', 'transfer_number'],
                        ['Dari', 'from_warehouse.name'],
                        ['Tujuan', 'to_warehouse.name'],
                        ['Status', 'status'],
                    ]}
                    action={(row) =>
                        row.status === 'draft' ? (
                            <Small
                                onClick={() =>
                                    router.patch(
                                        `/admin/inventory/transfers/${row.id}/status`,
                                        { status: 'in_transit' },
                                    )
                                }
                            >
                                Setujui & kirim
                            </Small>
                        ) : row.status === 'in_transit' ? (
                            <Small
                                onClick={() =>
                                    router.patch(
                                        `/admin/inventory/transfers/${row.id}/status`,
                                        { status: 'received' },
                                    )
                                }
                            >
                                Terima
                            </Small>
                        ) : null
                    }
                />
                <OperationSection
                    title="Stock opname"
                    rows={opnames}
                    columns={[
                        ['Nomor', 'opname_number'],
                        ['Gudang', 'warehouse.name'],
                        ['Jadwal', 'scheduled_date'],
                        ['Status', 'status'],
                    ]}
                    action={(row) =>
                        row.status !== 'completed' && (
                            <Small onClick={() => beginCount(row)}>
                                Input hitungan
                            </Small>
                        )
                    }
                />
                <OperationSection
                    title="Adjustment barang keluar"
                    rows={adjustments}
                    columns={[
                        ['Produk', 'product.name'],
                        ['Alasan', 'reason_type'],
                        ['Qty', 'qty'],
                        ['Status', 'status'],
                    ]}
                    action={(row) =>
                        row.status === 'pending' &&
                        permissions.includes(
                            'inventory.adjustment.approve',
                        ) && (
                            <Small
                                onClick={() =>
                                    router.post(
                                        `/admin/inventory/adjustments/${row.id}/approve`,
                                    )
                                }
                            >
                                Setujui
                            </Small>
                        )
                    }
                />
                <OperationSection
                    title="Retur supplier"
                    rows={supplierReturns}
                    columns={[
                        ['Nomor', 'return_number'],
                        ['Supplier', 'supplier.name'],
                        ['Total', 'total_amount'],
                        ['Status', 'status'],
                    ]}
                    action={(row) =>
                        row.status === 'draft' && (
                            <Small
                                onClick={() =>
                                    router.post(
                                        `/admin/inventory/supplier-returns/${row.id}/complete`,
                                    )
                                }
                            >
                                Selesaikan retur
                            </Small>
                        )
                    }
                />
            </div>
            <SimpleDialog
                open={dialog === 'po'}
                onClose={() => setDialog(null)}
                title="Purchase order baru"
                description="PO tidak mengubah stok sampai barang diterima melalui menu Barang Masuk."
            >
                <form
                    onSubmit={(e) =>
                        submit(e, po, '/admin/inventory/purchase-orders')
                    }
                    className="space-y-4"
                >
                    <TwoSelect
                        firstLabel="Supplier"
                        first={po.data.supplier_id}
                        firstOptions={suppliers}
                        setFirst={(value: number) =>
                            po.setData('supplier_id', value)
                        }
                        secondLabel="Gudang tujuan"
                        second={po.data.warehouse_id}
                        secondOptions={warehouses}
                        setSecond={(value: number) =>
                            po.setData('warehouse_id', value)
                        }
                    />
                    <Input
                        type="date"
                        value={po.data.expected_date}
                        onChange={(e) =>
                            po.setData('expected_date', e.target.value)
                        }
                    />
                    <Lines
                        products={products}
                        lines={po.data.items.map((line) => ({
                            ...line,
                            qty: line.qty_ordered,
                        }))}
                        onChange={(lines) =>
                            po.setData(
                                'items',
                                lines.map((line) => ({
                                    product_id: String(line.product_id),
                                    unit_id: String(line.unit_id),
                                    qty_ordered: Number(line.qty),
                                    price_per_unit: Number(
                                        line.price_per_unit ?? 0,
                                    ),
                                })),
                            )
                        }
                        price
                    />
                    <Footer processing={po.processing} />
                </form>
            </SimpleDialog>
            <SimpleDialog
                open={dialog === 'transfer'}
                onClose={() => setDialog(null)}
                title="Transfer gudang"
                description="Stok keluar saat in-transit dan masuk gudang tujuan saat diterima."
            >
                <form
                    onSubmit={(e) =>
                        submit(e, transfer, '/admin/inventory/transfers')
                    }
                    className="space-y-4"
                >
                    <TwoSelect
                        firstLabel="Gudang asal"
                        first={transfer.data.from_warehouse_id}
                        firstOptions={warehouses}
                        setFirst={(value: number) =>
                            transfer.setData('from_warehouse_id', value)
                        }
                        secondLabel="Gudang tujuan"
                        second={transfer.data.to_warehouse_id}
                        secondOptions={warehouses}
                        setSecond={(value: number) =>
                            transfer.setData('to_warehouse_id', value)
                        }
                    />
                    <Lines
                        products={products}
                        lines={transfer.data.items}
                        onChange={(lines) => transfer.setData('items', lines)}
                    />
                    <Footer processing={transfer.processing} />
                </form>
            </SimpleDialog>
            <SimpleDialog
                open={dialog === 'opname'}
                onClose={() => setDialog(null)}
                title="Jadwalkan stock opname"
                description="Opname dapat dijalankan penuh atau sebagian."
            >
                <form
                    onSubmit={(e) =>
                        submit(e, opname, '/admin/inventory/opnames')
                    }
                    className="space-y-4"
                >
                    <Select
                        label="Gudang"
                        value={opname.data.warehouse_id}
                        options={warehouses}
                        onChange={(value) =>
                            opname.setData('warehouse_id', value)
                        }
                    />
                    <Input
                        type="date"
                        value={opname.data.scheduled_date}
                        onChange={(e) =>
                            opname.setData('scheduled_date', e.target.value)
                        }
                    />
                    <select
                        className="h-10 w-full rounded-md border px-3"
                        value={opname.data.scope_type}
                        onChange={(e) =>
                            opname.setData('scope_type', e.target.value)
                        }
                    >
                        <option value="full">Semua produk</option>
                        <option value="partial">Sebagian produk</option>
                    </select>
                    <Footer processing={opname.processing} />
                </form>
            </SimpleDialog>
            <SimpleDialog
                open={dialog === 'adjustment'}
                onClose={() => setDialog(null)}
                title="Barang keluar non-penjualan"
                description="Catatan wajib dan perlu persetujuan Admin/Owner."
            >
                <form
                    onSubmit={(e) =>
                        submit(e, adjustment, '/admin/inventory/adjustments')
                    }
                    className="space-y-4"
                >
                    <Select
                        label="Gudang"
                        value={adjustment.data.warehouse_id}
                        options={warehouses}
                        onChange={(value) =>
                            adjustment.setData('warehouse_id', value)
                        }
                    />
                    <ProductUnitFields
                        products={products}
                        productId={adjustment.data.product_id}
                        unitId={adjustment.data.unit_id}
                        setProduct={(value, unit) =>
                            adjustment.setData((data) => ({
                                ...data,
                                product_id: String(value),
                                unit_id: String(unit),
                            }))
                        }
                        setUnit={(value) =>
                            adjustment.setData('unit_id', String(value))
                        }
                    />
                    <Input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={adjustment.data.qty}
                        onChange={(e) =>
                            adjustment.setData('qty', Number(e.target.value))
                        }
                    />
                    <select
                        className="h-10 w-full rounded-md border px-3"
                        value={adjustment.data.reason_type}
                        onChange={(e) =>
                            adjustment.setData('reason_type', e.target.value)
                        }
                    >
                        <option value="damaged">Rusak</option>
                        <option value="waste">Kedaluwarsa/terbuang</option>
                        <option value="lost">Hilang</option>
                        <option value="internal_use">Pemakaian internal</option>
                    </select>
                    <Input
                        placeholder="Catatan wajib"
                        value={adjustment.data.notes}
                        onChange={(e) =>
                            adjustment.setData('notes', e.target.value)
                        }
                    />
                    <Footer processing={adjustment.processing} />
                </form>
            </SimpleDialog>
            <SimpleDialog
                open={dialog === 'return'}
                onClose={() => setDialog(null)}
                title="Retur ke supplier"
                description="Penyelesaian retur mengurangi stok dan menulis ledger."
            >
                <form
                    onSubmit={(e) =>
                        submit(
                            e,
                            supplierReturn,
                            '/admin/inventory/supplier-returns',
                        )
                    }
                    className="space-y-4"
                >
                    <TwoSelect
                        firstLabel="Supplier"
                        first={supplierReturn.data.supplier_id}
                        firstOptions={suppliers}
                        setFirst={(value: number) =>
                            supplierReturn.setData('supplier_id', value)
                        }
                        secondLabel="Gudang"
                        second={supplierReturn.data.warehouse_id}
                        secondOptions={warehouses}
                        setSecond={(value: number) =>
                            supplierReturn.setData('warehouse_id', value)
                        }
                    />
                    <Input
                        placeholder="Alasan retur"
                        value={supplierReturn.data.notes}
                        onChange={(e) =>
                            supplierReturn.setData('notes', e.target.value)
                        }
                    />
                    <Lines
                        products={products}
                        lines={supplierReturn.data.items}
                        onChange={(lines) =>
                            supplierReturn.setData('items', lines)
                        }
                        price
                    />
                    <Footer processing={supplierReturn.processing} />
                </form>
            </SimpleDialog>
            <SimpleDialog
                open={dialog === 'count'}
                onClose={() => setDialog(null)}
                title={`Hitung ${selectedOpname?.opname_number ?? ''}`}
                description="Masukkan jumlah fisik; selisih akan langsung dibuatkan ledger koreksi."
            >
                <form
                    onSubmit={(e) =>
                        submit(
                            e,
                            opnameCount,
                            `/admin/inventory/opnames/${selectedOpname?.id}/complete`,
                        )
                    }
                    className="max-h-[60vh] space-y-3 overflow-y-auto pr-2"
                >
                    {opnameCount.data.counts.map((count, index) => (
                        <div
                            key={count.product_id}
                            className="grid grid-cols-[1fr_140px] items-center gap-3 rounded-xl bg-stone-50 p-3"
                        >
                            <div>
                                <div className="text-sm font-semibold">
                                    {
                                        products.find(
                                            (p) => p.id === count.product_id,
                                        )?.name
                                    }
                                </div>
                                <div className="text-xs text-stone-500">
                                    Sistem:{' '}
                                    {
                                        products.find(
                                            (p) => p.id === count.product_id,
                                        )?.stok_saat_ini
                                    }
                                </div>
                            </div>
                            <Input
                                type="number"
                                min="0"
                                step="0.001"
                                value={count.physical_qty}
                                onChange={(e) => {
                                    const rows = [...opnameCount.data.counts];
                                    rows[index] = {
                                        ...count,
                                        physical_qty: e.target.value,
                                    };
                                    opnameCount.setData('counts', rows);
                                }}
                            />
                        </div>
                    ))}
                    <Footer processing={opnameCount.processing} />
                </form>
            </SimpleDialog>
        </AdminLayout>
    );
}

function Action({
    icon: Icon,
    label,
    onClick,
}: {
    icon: typeof Plus;
    label: string;
    onClick: () => void;
}) {
    return (
        <button
            onClick={onClick}
            className="flex items-center gap-3 rounded-2xl border bg-white p-4 text-left font-semibold text-stone-800 transition hover:-translate-y-0.5 hover:border-lime-400 hover:shadow-md"
        >
            <span className="flex size-10 items-center justify-center rounded-xl bg-lime-100 text-lime-800">
                <Icon className="size-5" />
            </span>
            {label}
        </button>
    );
}
function OperationSection({
    title,
    rows,
    columns,
    action,
}: {
    title: string;
    rows: any[];
    columns: Array<[string, string]>;
    action: (row: any) => React.ReactNode;
}) {
    const value = (row: any, path: string) =>
        path.split('.').reduce((current, key) => current?.[key], row);

    return (
        <section className="overflow-hidden rounded-2xl border bg-white">
            <div className="border-b px-5 py-4">
                <h3 className="font-bold">{title}</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-stone-50 text-left text-xs text-stone-500 uppercase">
                        <tr>
                            {columns.map(([label]) => (
                                <th key={label} className="px-5 py-3">
                                    {label}
                                </th>
                            ))}
                            <th className="px-5 py-3 text-right">Tindakan</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {rows.map((row) => (
                            <tr key={row.id}>
                                {columns.map(([label, path]) => (
                                    <td key={label} className="px-5 py-3">
                                        {path === 'status' ? (
                                            <span
                                                className={`rounded-full px-2 py-1 text-xs font-semibold ${statusColor[value(row, path)] ?? 'bg-stone-100'}`}
                                            >
                                                {value(row, path)}
                                            </span>
                                        ) : (
                                            (value(row, path) ?? '—')
                                        )}
                                    </td>
                                ))}
                                <td className="px-5 py-3 text-right">
                                    {action(row)}
                                </td>
                            </tr>
                        ))}
                        {rows.length === 0 && (
                            <tr>
                                <td
                                    colSpan={columns.length + 1}
                                    className="px-5 py-8 text-center text-stone-500"
                                >
                                    Belum ada data.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
function Small({
    children,
    onClick,
}: {
    children: React.ReactNode;
    onClick: () => void;
}) {
    return (
        <Button size="sm" variant="outline" onClick={onClick}>
            {children}
        </Button>
    );
}
function SimpleDialog({
    open,
    onClose,
    title,
    description,
    children,
}: {
    open: boolean;
    onClose: () => void;
    title: string;
    description: string;
    children: React.ReactNode;
}) {
    return (
        <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{description}</DialogDescription>
                </DialogHeader>
                {children}
            </DialogContent>
        </Dialog>
    );
}
function Footer({ processing }: { processing: boolean }) {
    return (
        <DialogFooter className="pt-3">
            <Button disabled={processing}>
                {processing ? 'Memproses…' : 'Simpan'}
            </Button>
        </DialogFooter>
    );
}
function Select({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string | number;
    options: Option[];
    onChange: (value: number) => void;
}) {
    return (
        <div>
            <Label>{label}</Label>
            <select
                className="mt-1 h-10 w-full rounded-md border px-3"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
            >
                {options.map((option) => (
                    <option key={option.id} value={option.id}>
                        {option.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
function TwoSelect({
    firstLabel,
    first,
    firstOptions,
    setFirst,
    secondLabel,
    second,
    secondOptions,
    setSecond,
}: any) {
    return (
        <div className="grid gap-4 md:grid-cols-2">
            <Select
                label={firstLabel}
                value={first}
                options={firstOptions}
                onChange={setFirst}
            />
            <Select
                label={secondLabel}
                value={second}
                options={secondOptions}
                onChange={setSecond}
            />
        </div>
    );
}
function ProductUnitFields({
    products,
    productId,
    unitId,
    setProduct,
    setUnit,
}: {
    products: Product[];
    productId: string | number;
    unitId: string | number;
    setProduct: (value: number, unit: number) => void;
    setUnit: (value: number) => void;
}) {
    const product = products.find((item) => item.id === Number(productId));
    const units = product
        ? [product.base_unit, ...product.product_units.map((item) => item.unit)]
        : [];

    return (
        <div className="grid gap-3 md:grid-cols-2">
            <select
                className="h-10 rounded-md border px-3"
                value={productId}
                onChange={(e) => {
                    const next = products.find(
                        (item) => item.id === Number(e.target.value),
                    );
                    setProduct(Number(e.target.value), next?.base_unit_id ?? 0);
                }}
            >
                <option value="">Pilih produk</option>
                {products.map((item) => (
                    <option key={item.id} value={item.id}>
                        {item.name} — {item.sku}
                    </option>
                ))}
            </select>
            <select
                className="h-10 rounded-md border px-3"
                value={unitId}
                onChange={(e) => setUnit(Number(e.target.value))}
            >
                <option value="">Pilih satuan</option>
                {units.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                        {unit.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
function Lines({
    products,
    lines,
    onChange,
    price = false,
}: {
    products: Product[];
    lines: Line[];
    onChange: (lines: Line[]) => void;
    price?: boolean;
}) {
    const update = (index: number, patch: Partial<Line>) => {
        const rows = [...lines];
        rows[index] = { ...rows[index], ...patch };
        onChange(rows);
    };

    return (
        <div className="space-y-3">
            <div className="flex justify-between">
                <Label>Daftar produk</Label>
                <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                        onChange([
                            ...lines,
                            {
                                product_id: '',
                                unit_id: '',
                                qty: 1,
                                price_per_unit: 0,
                            },
                        ])
                    }
                >
                    <Plus className="mr-1 size-3" />
                    Baris
                </Button>
            </div>
            {lines.map((line, index) => (
                <div
                    key={index}
                    className={`grid gap-2 rounded-xl bg-stone-50 p-3 ${price ? 'md:grid-cols-[1fr_110px_140px_auto]' : 'md:grid-cols-[1fr_130px_auto]'}`}
                >
                    <ProductUnitFields
                        products={products}
                        productId={line.product_id}
                        unitId={line.unit_id}
                        setProduct={(value, unit) =>
                            update(index, { product_id: value, unit_id: unit })
                        }
                        setUnit={(value) => update(index, { unit_id: value })}
                    />
                    <Input
                        type="number"
                        min="0.001"
                        step="0.001"
                        value={line.qty}
                        onChange={(e) => update(index, { qty: e.target.value })}
                        placeholder="Qty"
                    />
                    {price && (
                        <Input
                            type="number"
                            min="0"
                            value={line.price_per_unit ?? 0}
                            onChange={(e) =>
                                update(index, {
                                    price_per_unit: e.target.value,
                                })
                            }
                            placeholder="Harga"
                        />
                    )}
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                            onChange(
                                lines.filter((_, current) => current !== index),
                            )
                        }
                    >
                        ×
                    </Button>
                </div>
            ))}
        </div>
    );
}
