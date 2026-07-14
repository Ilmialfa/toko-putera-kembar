import { Head, Link, useForm } from '@inertiajs/react';
import { Trash2, Plus, ArrowLeft } from 'lucide-react';
import React from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/AdminLayout';
import * as stockInRoutes from '@/routes/admin/inventory/stock-ins';

interface Product {
    id: number;
    name: string;
    sku: string;
    units: { id: number; name: string }[];
    base_unit_id: number;
}

interface DetailForm {
    product_id: string;
    unit_id: string;
    qty: string;
    purchase_price_per_unit: string;
    batch_number: string;
    expiry_date: string;
}

interface Props {
    suppliers: { id: number; name: string }[];
    warehouses: { id: number; name: string }[];
    products: Product[];
    units: { id: number; name: string }[];
}

export default function Create({
    suppliers,
    warehouses,
    products,
    units,
}: Props) {
    const { data, setData, post, processing, errors } = useForm({
        supplier_id: '',
        warehouse_id: '',
        invoice_number: '',
        payment_status: 'paid',
        paid_amount: '0',
        due_date: '',
        details: [] as DetailForm[],
    });

    const addProduct = () => {
        setData('details', [
            ...data.details,
            {
                product_id: '',
                unit_id: '',
                qty: '1',
                purchase_price_per_unit: '0',
                batch_number: '',
                expiry_date: '',
            },
        ]);
    };

    const removeProduct = (index: number) => {
        const newDetails = [...data.details];
        newDetails.splice(index, 1);
        setData('details', newDetails);
    };

    const updateDetail = (
        index: number,
        field: keyof DetailForm,
        value: string,
    ) => {
        const newDetails = [...data.details];
        newDetails[index][field] = value;

        // Auto-select base unit when product is selected
        if (field === 'product_id') {
            const product = products.find((p) => p.id.toString() === value);

            if (product) {
                newDetails[index].unit_id = product.base_unit_id.toString();
            }
        }

        setData('details', newDetails);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (data.details.length === 0) {
            toast.error('Mohon tambahkan minimal 1 produk.');

            return;
        }

        post(stockInRoutes.store.url());
    };

    const calculateTotal = () => {
        return data.details.reduce((sum, item) => {
            const qty = parseFloat(item.qty) || 0;
            const price = parseFloat(item.purchase_price_per_unit) || 0;

            return sum + qty * price;
        }, 0);
    };

    return (
        <AdminLayout>
            <Head title="Catat Barang Masuk" />

            <div className="flex flex-col gap-6 p-4 sm:p-6 lg:p-8">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" asChild>
                        <Link href={stockInRoutes.index.url()}>
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Catat Barang Masuk
                        </h1>
                        <p className="text-muted-foreground">
                            Penerimaan stok dari supplier
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-6 md:col-span-1">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Informasi Penerimaan</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="supplier_id">
                                            Supplier{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={data.supplier_id}
                                            onValueChange={(val) =>
                                                setData('supplier_id', val)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Supplier" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {suppliers.map((s) => (
                                                    <SelectItem
                                                        key={s.id}
                                                        value={s.id.toString()}
                                                    >
                                                        {s.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.supplier_id && (
                                            <p className="text-sm text-red-500">
                                                {errors.supplier_id}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="warehouse_id">
                                            Gudang Tujuan{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={data.warehouse_id}
                                            onValueChange={(val) =>
                                                setData('warehouse_id', val)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Gudang" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {warehouses.map((w) => (
                                                    <SelectItem
                                                        key={w.id}
                                                        value={w.id.toString()}
                                                    >
                                                        {w.name}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        {errors.warehouse_id && (
                                            <p className="text-sm text-red-500">
                                                {errors.warehouse_id}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="invoice_number">
                                            No. Invoice
                                        </Label>
                                        <Input
                                            id="invoice_number"
                                            value={data.invoice_number}
                                            onChange={(e) =>
                                                setData(
                                                    'invoice_number',
                                                    e.target.value,
                                                )
                                            }
                                            placeholder="Opsional"
                                        />
                                        {errors.invoice_number && (
                                            <p className="text-sm text-red-500">
                                                {errors.invoice_number}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="payment_status">
                                            Status Pembayaran{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </Label>
                                        <Select
                                            value={data.payment_status}
                                            onValueChange={(val) =>
                                                setData('payment_status', val)
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Pilih Status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="paid">
                                                    Lunas (Paid)
                                                </SelectItem>
                                                <SelectItem value="partial">
                                                    Sebagian (Partial)
                                                </SelectItem>
                                                <SelectItem value="credit">
                                                    Hutang (Credit)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                        {errors.payment_status && (
                                            <p className="text-sm text-red-500">
                                                {errors.payment_status}
                                            </p>
                                        )}
                                    </div>

                                    {data.payment_status === 'partial' && (
                                        <div className="space-y-2">
                                            <Label htmlFor="paid_amount">
                                                Nominal Dibayar{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="paid_amount"
                                                type="text"
                                                value={
                                                    data.paid_amount
                                                        ? new Intl.NumberFormat(
                                                              'id-ID',
                                                          ).format(
                                                              Number(
                                                                  data.paid_amount,
                                                              ),
                                                          )
                                                        : ''
                                                }
                                                onChange={(e) => {
                                                    const raw =
                                                        e.target.value.replace(
                                                            /\D/g,
                                                            '',
                                                        );
                                                    setData('paid_amount', raw);
                                                }}
                                            />
                                            {errors.paid_amount && (
                                                <p className="text-sm text-red-500">
                                                    {errors.paid_amount}
                                                </p>
                                            )}
                                        </div>
                                    )}

                                    {['credit', 'partial'].includes(
                                        data.payment_status,
                                    ) && (
                                        <div className="space-y-2">
                                            <Label htmlFor="due_date">
                                                Jatuh Tempo{' '}
                                                <span className="text-red-500">
                                                    *
                                                </span>
                                            </Label>
                                            <Input
                                                id="due_date"
                                                type="date"
                                                value={data.due_date}
                                                onChange={(e) =>
                                                    setData(
                                                        'due_date',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {errors.due_date && (
                                                <p className="text-sm text-red-500">
                                                    {errors.due_date}
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        <div className="space-y-6 md:col-span-2">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle>Daftar Produk</CardTitle>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addProduct}
                                    >
                                        <Plus className="mr-2 h-4 w-4" /> Tambah
                                        Produk
                                    </Button>
                                </CardHeader>
                                <CardContent>
                                    {errors.details && (
                                        <p className="mb-4 text-sm text-red-500">
                                            {errors.details}
                                        </p>
                                    )}

                                    <div className="overflow-x-auto rounded-md border">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="min-w-[200px]">
                                                        Produk
                                                    </TableHead>
                                                    <TableHead className="w-[120px]">
                                                        Satuan
                                                    </TableHead>
                                                    <TableHead className="w-[100px]">
                                                        Qty
                                                    </TableHead>
                                                    <TableHead className="w-[150px]">
                                                        Harga/Unit (Rp)
                                                    </TableHead>
                                                    <TableHead className="w-[120px]">
                                                        Batch No
                                                    </TableHead>
                                                    <TableHead className="w-[150px]">
                                                        Exp Date
                                                    </TableHead>
                                                    <TableHead className="w-[50px]"></TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {data.details.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell
                                                            colSpan={7}
                                                            className="h-24 text-center text-muted-foreground"
                                                        >
                                                            Klik tombol "Tambah
                                                            Produk" untuk
                                                            memulai.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    data.details.map(
                                                        (item, index) => {
                                                            const p =
                                                                products.find(
                                                                    (prod) =>
                                                                        prod.id.toString() ===
                                                                        item.product_id,
                                                                );
                                                            const itemUnits = p
                                                                ? [
                                                                      ...p.units.map(
                                                                          (u) =>
                                                                              units.find(
                                                                                  (
                                                                                      unit,
                                                                                  ) =>
                                                                                      unit.id ===
                                                                                      u.id,
                                                                              ),
                                                                      ),
                                                                      units.find(
                                                                          (u) =>
                                                                              u.id ===
                                                                              p.base_unit_id,
                                                                      ),
                                                                  ].filter(
                                                                      Boolean,
                                                                  )
                                                                : units;

                                                            return (
                                                                <TableRow
                                                                    key={index}
                                                                >
                                                                    <TableCell>
                                                                        <Select
                                                                            value={
                                                                                item.product_id
                                                                            }
                                                                            onValueChange={(
                                                                                val,
                                                                            ) =>
                                                                                updateDetail(
                                                                                    index,
                                                                                    'product_id',
                                                                                    val,
                                                                                )
                                                                            }
                                                                        >
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Pilih..." />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {products.map(
                                                                                    (
                                                                                        p,
                                                                                    ) => (
                                                                                        <SelectItem
                                                                                            key={
                                                                                                p.id
                                                                                            }
                                                                                            value={p.id.toString()}
                                                                                        >
                                                                                            {
                                                                                                p.name
                                                                                            }
                                                                                        </SelectItem>
                                                                                    ),
                                                                                )}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Select
                                                                            value={
                                                                                item.unit_id
                                                                            }
                                                                            onValueChange={(
                                                                                val,
                                                                            ) =>
                                                                                updateDetail(
                                                                                    index,
                                                                                    'unit_id',
                                                                                    val,
                                                                                )
                                                                            }
                                                                        >
                                                                            <SelectTrigger>
                                                                                <SelectValue placeholder="Satuan" />
                                                                            </SelectTrigger>
                                                                            <SelectContent>
                                                                                {itemUnits.map(
                                                                                    (
                                                                                        u,
                                                                                    ) =>
                                                                                        u && (
                                                                                            <SelectItem
                                                                                                key={
                                                                                                    u.id
                                                                                                }
                                                                                                value={u.id.toString()}
                                                                                            >
                                                                                                {
                                                                                                    u.name
                                                                                                }
                                                                                            </SelectItem>
                                                                                        ),
                                                                                )}
                                                                            </SelectContent>
                                                                        </Select>
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Input
                                                                            type="number"
                                                                            min="0.001"
                                                                            step="0.001"
                                                                            value={
                                                                                item.qty
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateDetail(
                                                                                    index,
                                                                                    'qty',
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Input
                                                                            type="text"
                                                                            value={
                                                                                item.purchase_price_per_unit
                                                                                    ? new Intl.NumberFormat(
                                                                                          'id-ID',
                                                                                      ).format(
                                                                                          Number(
                                                                                              item.purchase_price_per_unit,
                                                                                          ),
                                                                                      )
                                                                                    : ''
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) => {
                                                                                const raw =
                                                                                    e.target.value.replace(
                                                                                        /\D/g,
                                                                                        '',
                                                                                    );
                                                                                updateDetail(
                                                                                    index,
                                                                                    'purchase_price_per_unit',
                                                                                    raw,
                                                                                );
                                                                            }}
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Input
                                                                            placeholder="Opsional"
                                                                            value={
                                                                                item.batch_number
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateDetail(
                                                                                    index,
                                                                                    'batch_number',
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Input
                                                                            type="date"
                                                                            value={
                                                                                item.expiry_date
                                                                            }
                                                                            onChange={(
                                                                                e,
                                                                            ) =>
                                                                                updateDetail(
                                                                                    index,
                                                                                    'expiry_date',
                                                                                    e
                                                                                        .target
                                                                                        .value,
                                                                                )
                                                                            }
                                                                        />
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        <Button
                                                                            type="button"
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            onClick={() =>
                                                                                removeProduct(
                                                                                    index,
                                                                                )
                                                                            }
                                                                            className="text-red-500 hover:text-red-700"
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        },
                                                    )
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>

                                    {data.details.length > 0 && (
                                        <div className="mt-4 flex justify-end">
                                            <div className="inline-flex flex-col items-end rounded-md bg-muted p-4">
                                                <span className="text-sm text-muted-foreground">
                                                    Total Tagihan (Estimasi)
                                                </span>
                                                <span className="text-2xl font-bold">
                                                    Rp{' '}
                                                    {new Intl.NumberFormat(
                                                        'id-ID',
                                                    ).format(calculateTotal())}
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                                <CardFooter className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        asChild
                                    >
                                        <Link href={stockInRoutes.index.url()}>
                                            Batal
                                        </Link>
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={
                                            processing ||
                                            data.details.length === 0
                                        }
                                    >
                                        Simpan & Proses Barang Masuk
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
