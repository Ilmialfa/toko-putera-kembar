import { Link, useForm } from '@inertiajs/react';
import { ImagePlus, Plus, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import BarcodeCameraScanner from '@/components/barcode-camera-scanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/AdminLayout';

type Option = { id: number; name: string; symbol?: string };
type ProductUnit = {
    unit_id: number | string;
    conversion_qty: number | string;
    is_purchase_unit: boolean;
    is_sales_unit: boolean;
};
type ProductPrice = {
    unit_id: number | string;
    price_type: string;
    customer_group_id: number | string;
    min_qty: number | string;
    max_qty: number | string;
    price: number | string;
    channel: string;
    active_from: string;
    active_until: string;
    is_active: boolean;
};
type ProductBarcode = {
    barcode: string;
    unit_id: number | string;
    is_primary: boolean;
};

interface Props {
    product?: Record<string, any>;
    categories: Option[];
    brands: Option[];
    units: Option[];
    suppliers: Option[];
    warehouses: Option[];
}

const fieldClass =
    'h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none transition focus:border-lime-500 focus:ring-4 focus:ring-lime-500/10';

export default function ProductForm({
    product,
    categories,
    brands,
    units,
    suppliers,
    warehouses,
}: Props) {
    const isEditing = Boolean(product);
    const { data, setData, post, processing, errors, transform } = useForm({
        _method: isEditing ? 'put' : 'post',
        name: product?.name ?? '',
        sku: product?.sku ?? '',
        category_id: product?.category_id ?? '',
        brand_id: product?.brand_id ?? '',
        hpp_current: product?.hpp_current ?? 0,
        default_warehouse_id:
            product?.default_warehouse_id ?? warehouses[0]?.id ?? '',
        primary_supplier_id: product?.primary_supplier_id ?? '',
        base_unit_id: product?.base_unit_id ?? '',
        online_display_unit_id:
            product?.online_display_unit_id ?? product?.base_unit_id ?? '',
        display_price_prefix: product?.display_price_prefix ?? 'exact',
        is_active: product?.is_active ?? true,
        is_sellable: product?.is_sellable ?? true,
        sellable_pos: product?.sellable_pos ?? true,
        sellable_online: product?.sellable_online ?? true,
        is_preorder: product?.is_preorder ?? false,
        preorder_eta_days: product?.preorder_eta_days ?? '',
        weight_grams: product?.weight_grams ?? '',
        description_short: product?.description_short ?? '',
        description_long: product?.description_long ?? '',
        barcodes: (product?.barcodes?.map((barcode: Record<string, any>) => ({
            barcode: barcode.barcode,
            unit_id: barcode.unit_id ?? '',
            is_primary: Boolean(barcode.is_primary),
        })) ?? []) as ProductBarcode[],
        base_retail_price:
            product?.prices?.find(
                (p: any) =>
                    p.unit_id === product.base_unit_id &&
                    p.price_type === 'retail',
            )?.price ?? 0,
        units: (product?.product_units?.map((unit: Record<string, any>) => {
            const priceRow = product?.prices?.find(
                (p: any) =>
                    p.unit_id === unit.unit_id && p.price_type === 'retail',
            );

            return {
                unit_id: unit.unit_id,
                conversion_qty: unit.conversion_qty,
                is_purchase_unit: Boolean(unit.is_purchase_unit),
                is_sales_unit: Boolean(unit.is_sales_unit),
                retail_price: priceRow?.price ?? 0,
            };
        }) ?? []) as (ProductUnit & { retail_price: number | string })[],
        prices: (product?.prices?.map((price: Record<string, any>) => ({
            unit_id: price.unit_id,
            price_type: price.price_type,
            customer_group_id: price.customer_group_id ?? '',
            min_qty: price.min_qty,
            max_qty: price.max_qty ?? '',
            price: price.price,
            channel: price.channel,
            active_from: price.active_from?.slice(0, 16) ?? '',
            active_until: price.active_until?.slice(0, 16) ?? '',
            is_active: Boolean(price.is_active),
        })) ?? []) as ProductPrice[],
        images: [] as File[],
        remove_image_ids: [] as number[],
    });

    const submit = (event: FormEvent) => {
        event.preventDefault();

        transform((currentData) => {
            const otherPrices = currentData.prices.filter(
                (p: any) => p.price_type !== 'retail',
            );
            const retailPrices: any[] = [];

            if (currentData.base_unit_id) {
                retailPrices.push({
                    unit_id: currentData.base_unit_id,
                    price_type: 'retail',
                    customer_group_id: '',
                    min_qty: 1,
                    max_qty: '',
                    price: currentData.base_retail_price,
                    channel: 'both',
                    active_from: '',
                    active_until: '',
                    is_active: true,
                });
            }

            currentData.units.forEach((u: any) => {
                if (u.unit_id && u.is_sales_unit) {
                    retailPrices.push({
                        unit_id: u.unit_id,
                        price_type: 'retail',
                        customer_group_id: '',
                        min_qty: 1,
                        max_qty: '',
                        price: u.retail_price || 0,
                        channel: 'both',
                        active_from: '',
                        active_until: '',
                        is_active: true,
                    });
                }
            });

            return {
                ...currentData,
                prices: [...otherPrices, ...retailPrices],
            };
        });

        post(
            isEditing
                ? `/admin/master/products/${product?.id}`
                : '/admin/master/products',
            { forceFormData: true },
        );
    };

    const updateUnit = (
        index: number,
        key: keyof ProductUnit,
        value: unknown,
    ) => {
        const rows = [...data.units];
        rows[index] = { ...rows[index], [key]: value };
        setData('units', rows);
    };

    const formErrors = errors as unknown as Record<string, string>;
    const errorFor = (key: string) =>
        formErrors[key] ? (
            <p className="mt-1 text-xs font-medium text-red-600">
                {formErrors[key]}
            </p>
        ) : null;

    return (
        <AdminLayout title={isEditing ? 'Ubah Produk' : 'Produk Baru'}>
            <form
                onSubmit={submit}
                className="mx-auto max-w-7xl space-y-6 p-4 pb-8 md:p-8"
            >
                <header className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-6 md:flex-row md:items-center">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-700 uppercase">
                            Katalog
                        </p>
                        <h2 className="mt-1 text-2xl font-bold text-stone-950">
                            {isEditing
                                ? `Ubah ${product?.name}`
                                : 'Tambahkan produk lengkap'}
                        </h2>
                        <p className="mt-1 text-sm text-stone-500">
                            Isi informasi inti dulu. Pengaturan satuan, harga
                            grosir, dan barcode dapat ditambahkan bila perlu.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/admin/master/products">Batal</Link>
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing}
                            className="bg-lime-300 text-lime-950 hover:bg-lime-200"
                        >
                            {processing ? 'Menyimpan…' : 'Simpan produk'}
                        </Button>
                    </div>
                </header>

                <section className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
                    <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6">
                        <SectionTitle
                            title="Informasi produk"
                            description="Data utama yang dilihat kasir dan pelanggan."
                        />
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Nama produk" error={errorFor('name')}>
                                <Input
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                    required
                                />
                            </Field>
                            <Field
                                label="SKU (otomatis jika kosong)"
                                error={errorFor('sku')}
                            >
                                <Input
                                    value={data.sku}
                                    onChange={(e) =>
                                        setData('sku', e.target.value)
                                    }
                                />
                            </Field>
                            <Field
                                label="Kategori"
                                error={errorFor('category_id')}
                            >
                                <Select
                                    value={data.category_id}
                                    onChange={(value) =>
                                        setData('category_id', value)
                                    }
                                    options={categories}
                                    placeholder="Pilih kategori"
                                />
                            </Field>
                            <Field label="Merek">
                                <Select
                                    value={data.brand_id}
                                    onChange={(value) =>
                                        setData('brand_id', value)
                                    }
                                    options={brands}
                                    placeholder="Tanpa merek"
                                    allowEmpty
                                />
                            </Field>
                            <Field
                                label="Harga modal per satuan dasar (Rp)"
                                error={errorFor('hpp_current')}
                            >
                                <Input
                                    type="text"
                                    value={
                                        data.hpp_current
                                            ? new Intl.NumberFormat(
                                                  'id-ID',
                                              ).format(Number(data.hpp_current))
                                            : ''
                                    }
                                    onChange={(e) => {
                                        const raw = e.target.value.replace(
                                            /\D/g,
                                            '',
                                        );
                                        setData('hpp_current', raw);
                                    }}
                                />
                            </Field>
                        </div>
                        <p className="mt-3 text-xs leading-5 text-stone-500">
                            Contoh: bila satuan dasar adalah <strong>pcs</strong>, masukkan modal per pcs. Saat barang diterima dari pembelian, sistem akan memperbarui HPP rata-rata secara otomatis.
                        </p>
                        <Field
                            label="Deskripsi singkat"
                            error={errorFor('description_short')}
                        >
                            <Textarea
                                value={data.description_short}
                                onChange={(e) =>
                                    setData('description_short', e.target.value)
                                }
                                rows={3}
                            />
                        </Field>
                        <Field label="Deskripsi lengkap">
                            <Textarea
                                value={data.description_long}
                                onChange={(e) =>
                                    setData('description_long', e.target.value)
                                }
                                rows={6}
                            />
                        </Field>
                    </div>

                    <div className="space-y-5 rounded-2xl border border-stone-200 bg-white p-6">
                        <SectionTitle
                            title="Status penjualan"
                            description="Kontrol visibilitas per channel."
                        />
                        <div className="grid gap-3">
                            <Toggle
                                label="Produk aktif"
                                checked={data.is_active}
                                onChange={(value) =>
                                    setData('is_active', value)
                                }
                            />
                            <Toggle
                                label="Boleh dijual"
                                checked={data.is_sellable}
                                onChange={(value) =>
                                    setData('is_sellable', value)
                                }
                            />
                            <Toggle
                                label="Tampil di POS"
                                checked={data.sellable_pos}
                                onChange={(value) =>
                                    setData('sellable_pos', value)
                                }
                            />
                            <Toggle
                                label="Tampil di website"
                                checked={data.sellable_online}
                                onChange={(value) =>
                                    setData('sellable_online', value)
                                }
                            />
                            <Toggle
                                label="Pre-order"
                                checked={data.is_preorder}
                                onChange={(value) =>
                                    setData('is_preorder', value)
                                }
                            />
                        </div>
                        {data.is_preorder && (
                            <Field label="Estimasi tersedia (hari)">
                                <Input
                                    type="number"
                                    min="1"
                                    value={data.preorder_eta_days}
                                    onChange={(e) =>
                                        setData(
                                            'preorder_eta_days',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                        )}
                    </div>
                </section>

                <section className="rounded-2xl border border-stone-200 bg-white p-6">
                    <SectionTitle
                        title="Logistik dan persediaan"
                        description="Fondasi pembelian, stok minimum, dan metode costing."
                    />
                    <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                        <Field label="Gudang default">
                            <Select
                                value={data.default_warehouse_id}
                                onChange={(value) =>
                                    setData('default_warehouse_id', value)
                                }
                                options={warehouses}
                                placeholder="Pilih gudang"
                            />
                        </Field>
                        <Field label="Supplier utama">
                            <Select
                                value={data.primary_supplier_id}
                                onChange={(value) =>
                                    setData('primary_supplier_id', value)
                                }
                                options={suppliers}
                                placeholder="Tanpa supplier"
                                allowEmpty
                            />
                        </Field>
                        <Field label="Berat (gram)">
                            <Input
                                type="number"
                                min="0"
                                value={data.weight_grams}
                                onChange={(e) =>
                                    setData('weight_grams', e.target.value)
                                }
                            />
                        </Field>
                    </div>
                </section>

                <section className="rounded-2xl border border-stone-200 bg-white p-6">
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                        <SectionTitle
                            title="Satuan dan konversi"
                            description="Stok disimpan dalam satuan dasar; penjualan dapat memakai satuan lain."
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                setData('units', [
                                    ...data.units,
                                    {
                                        unit_id: '',
                                        conversion_qty: 1,
                                        is_purchase_unit: false,
                                        is_sales_unit: true,
                                        retail_price: 0,
                                    },
                                ])
                            }
                        >
                            <Plus className="mr-2 size-4" />
                            Tambah satuan
                        </Button>
                    </div>
                    <div className="mt-5 grid gap-4 md:grid-cols-2">
                        <Field
                            label="Satuan dasar"
                            error={errorFor('base_unit_id')}
                        >
                            <Select
                                value={data.base_unit_id}
                                onChange={(value) => {
                                    setData('base_unit_id', value);

                                    if (!data.online_display_unit_id) {
                                        setData(
                                            'online_display_unit_id',
                                            value,
                                        );
                                    }
                                }}
                                options={units}
                                placeholder="Pilih satuan dasar"
                            />
                        </Field>
                        <Field
                            label="Satuan harga di website"
                            error={errorFor('online_display_unit_id')}
                        >
                            <Select
                                value={data.online_display_unit_id}
                                onChange={(value) =>
                                    setData('online_display_unit_id', value)
                                }
                                options={units}
                                placeholder="Pilih satuan display"
                            />
                        </Field>
                        <Field
                            label="Harga jual per satuan dasar (Rp)"
                            error={errorFor('prices.0.price')}
                        >
                            <Input
                                type="text"
                                value={
                                    data.base_retail_price
                                        ? new Intl.NumberFormat('id-ID').format(
                                              Number(data.base_retail_price),
                                          )
                                        : ''
                                }
                                onChange={(e) => {
                                    const raw = e.target.value.replace(
                                        /\D/g,
                                        '',
                                    );
                                    setData('base_retail_price', raw);
                                }}
                            />
                        </Field>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-stone-500">
                        Untuk jual per dus, renteng, atau lusin, tambahkan satuannya di bawah lalu isi harga jual paketnya. Sistem tetap menghitung stok dan modal dengan benar.
                    </p>
                    <div className="mt-5 space-y-3">
                        {data.units.map((row, index) => (
                            <div
                                key={index}
                                className="grid gap-3 rounded-xl bg-stone-50 p-4 md:grid-cols-[1fr_1fr_1fr_auto_auto_auto] md:items-end"
                            >
                                <Field label="Satuan">
                                    <Select
                                        value={row.unit_id}
                                        onChange={(value) =>
                                            updateUnit(index, 'unit_id', value)
                                        }
                                        options={units}
                                        placeholder="Pilih satuan"
                                    />
                                </Field>
                                <Field label="Isi dalam satuan dasar">
                                    <Input
                                        type="number"
                                        min="0.001"
                                        step="0.001"
                                        value={row.conversion_qty}
                                        onChange={(e) =>
                                            updateUnit(
                                                index,
                                                'conversion_qty',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </Field>
                                <Field label="Harga Jual (Rp)">
                                    <Input
                                        type="text"
                                        value={
                                            (row as any).retail_price
                                                ? new Intl.NumberFormat(
                                                      'id-ID',
                                                  ).format(
                                                      Number(
                                                          (row as any)
                                                              .retail_price,
                                                      ),
                                                  )
                                                : ''
                                        }
                                        onChange={(e) => {
                                            const raw = e.target.value.replace(
                                                /\D/g,
                                                '',
                                            );
                                            updateUnit(
                                                index,
                                                'retail_price' as keyof ProductUnit,
                                                raw,
                                            );
                                        }}
                                    />
                                </Field>
                                <Toggle
                                    compact
                                    label="Pembelian"
                                    checked={row.is_purchase_unit}
                                    onChange={(value) =>
                                        updateUnit(
                                            index,
                                            'is_purchase_unit',
                                            value,
                                        )
                                    }
                                />
                                <Toggle
                                    compact
                                    label="Penjualan"
                                    checked={row.is_sales_unit}
                                    onChange={(value) =>
                                        updateUnit(
                                            index,
                                            'is_sales_unit',
                                            value,
                                        )
                                    }
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Hapus satuan"
                                    onClick={() =>
                                        setData(
                                            'units',
                                            data.units.filter(
                                                (_, current) =>
                                                    current !== index,
                                            ),
                                        )
                                    }
                                >
                                    <Trash2 className="size-4 text-red-600" />
                                </Button>
                            </div>
                        ))}
                    </div>
                    <details className="mt-5 rounded-xl border border-stone-200 bg-stone-50 p-4">
                        <summary className="cursor-pointer text-sm font-bold text-stone-800">
                            Harga grosir & harga khusus (opsional)
                        </summary>
                        <p className="mt-2 text-xs leading-5 text-stone-500">
                            Gunakan hanya bila harga berubah saat pelanggan membeli banyak. Harga normal di atas tetap berlaku untuk pembelian biasa.
                        </p>
                        <div className="mt-4 space-y-3">
                            {data.prices
                                .filter((row) => row.price_type !== 'retail')
                                .map((row) => {
                                    const sourceIndex = data.prices.findIndex(
                                        (source) => source === row,
                                    );

                                    return (
                                        <div
                                            key={`${row.unit_id}-${sourceIndex}`}
                                            className="grid gap-3 rounded-xl border border-stone-200 bg-white p-3 md:grid-cols-[1fr_0.75fr_1fr_auto] md:items-end"
                                        >
                                            <Field label="Satuan">
                                                <Select
                                                    value={row.unit_id}
                                                    onChange={(value) => {
                                                        const rows = [...data.prices];
                                                        rows[sourceIndex] = { ...row, unit_id: value };
                                                        setData('prices', rows);
                                                    }}
                                                    options={units}
                                                    placeholder="Satuan"
                                                />
                                            </Field>
                                            <Field label="Mulai jumlah">
                                                <Input
                                                    type="number"
                                                    min="2"
                                                    value={row.min_qty}
                                                    onChange={(event) => {
                                                        const rows = [...data.prices];
                                                        rows[sourceIndex] = { ...row, min_qty: event.target.value };
                                                        setData('prices', rows);
                                                    }}
                                                />
                                            </Field>
                                            <Field label="Harga per satuan (Rp)">
                                                <Input
                                                    type="text"
                                                    value={row.price ? new Intl.NumberFormat('id-ID').format(Number(row.price)) : ''}
                                                    onChange={(event) => {
                                                        const rows = [...data.prices];
                                                        rows[sourceIndex] = { ...row, price: event.target.value.replace(/\D/g, '') };
                                                        setData('prices', rows);
                                                    }}
                                                />
                                            </Field>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                aria-label="Hapus harga grosir"
                                                onClick={() => setData('prices', data.prices.filter((_, current) => current !== sourceIndex))}
                                            >
                                                <Trash2 className="size-4 text-red-600" />
                                            </Button>
                                        </div>
                                    );
                                })}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="mt-4"
                            onClick={() =>
                                setData('prices', [
                                    ...data.prices,
                                    {
                                        unit_id: data.base_unit_id,
                                        price_type: 'wholesale_tier',
                                        customer_group_id: '',
                                        min_qty: 12,
                                        max_qty: '',
                                        price: 0,
                                        channel: 'both',
                                        active_from: '',
                                        active_until: '',
                                        is_active: true,
                                    },
                                ])
                            }
                        >
                            <Plus className="mr-2 size-4" />
                            Tambah harga grosir
                        </Button>
                    </details>
                </section>

                <section className="grid gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl border border-stone-200 bg-white p-6">
                        <div className="flex flex-wrap justify-between gap-3">
                            <SectionTitle
                                title="Barcode"
                                description="Barcode dapat diarahkan ke satuan tertentu."
                            />
                            <div className="flex gap-2">
                            <BarcodeCameraScanner
                                label="Scan kamera"
                                onDetected={(barcode) => {
                                    const blankIndex = data.barcodes.findIndex((row) => !row.barcode);
                                    const barcodeRow = {
                                        barcode,
                                        unit_id: data.base_unit_id,
                                        is_primary: data.barcodes.length === 0,
                                    };

                                    if (blankIndex >= 0) {
                                        const rows = [...data.barcodes];
                                        rows[blankIndex] = barcodeRow;
                                        setData('barcodes', rows);
                                    } else {
                                        setData('barcodes', [...data.barcodes, barcodeRow]);
                                    }
                                }}
                            />
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() =>
                                    setData('barcodes', [
                                        ...data.barcodes,
                                        {
                                            barcode: '',
                                            unit_id: '',
                                            is_primary: false,
                                        },
                                    ])
                                }
                            >
                                <Plus className="mr-2 size-4" />
                                Tambah
                            </Button>
                            </div>
                        </div>
                        <div className="mt-5 space-y-3">
                            {data.barcodes.map((row, index) => (
                                <div
                                    key={index}
                                    className="grid gap-3 rounded-xl bg-stone-50 p-4 md:grid-cols-[1fr_1fr_auto_auto]"
                                >
                                    <Input
                                        placeholder="Kode barcode"
                                        value={row.barcode}
                                        onChange={(e) => {
                                            const rows = [...data.barcodes];
                                            rows[index] = {
                                                ...row,
                                                barcode: e.target.value,
                                            };
                                            setData('barcodes', rows);
                                        }}
                                    />
                                    <Select
                                        value={row.unit_id}
                                        onChange={(value) => {
                                            const rows = [...data.barcodes];
                                            rows[index] = {
                                                ...row,
                                                unit_id: value,
                                            };
                                            setData('barcodes', rows);
                                        }}
                                        options={units}
                                        placeholder="Satuan"
                                        allowEmpty
                                    />
                                    <Toggle
                                        compact
                                        label="Utama"
                                        checked={row.is_primary}
                                        onChange={(value) => {
                                            const rows = data.barcodes.map(
                                                (barcode, current) => ({
                                                    ...barcode,
                                                    is_primary:
                                                        current === index
                                                            ? value
                                                            : false,
                                                }),
                                            );
                                            setData('barcodes', rows);
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            setData(
                                                'barcodes',
                                                data.barcodes.filter(
                                                    (_, current) =>
                                                        current !== index,
                                                ),
                                            )
                                        }
                                    >
                                        <Trash2 className="size-4 text-red-600" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="rounded-2xl border border-stone-200 bg-white p-6">
                        <SectionTitle
                            title="Galeri produk"
                            description="Maksimal 8 foto JPG, PNG, atau WebP; foto pertama menjadi utama."
                        />
                        <label className="mt-5 flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-stone-300 bg-stone-50 text-center transition hover:border-lime-500 hover:bg-lime-50">
                            <ImagePlus className="mb-2 size-7 text-stone-500" />
                            <span className="text-sm font-semibold">
                                Pilih foto produk
                            </span>
                            <span className="text-xs text-stone-500">
                                Maksimal 4 MB per foto
                            </span>
                            <input
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                multiple
                                className="sr-only"
                                onChange={(e) =>
                                    setData(
                                        'images',
                                        Array.from(e.target.files ?? []),
                                    )
                                }
                            />
                        </label>
                        {data.images.length > 0 && (
                            <p className="mt-2 text-xs text-stone-600">
                                {data.images.length} foto baru dipilih.
                            </p>
                        )}
                        <div className="mt-4 grid grid-cols-3 gap-3">
                            {product?.images
                                ?.filter(
                                    (image: Record<string, any>) =>
                                        !data.remove_image_ids.includes(
                                            image.id,
                                        ),
                                )
                                .map((image: Record<string, any>) => (
                                    <div
                                        key={image.id}
                                        className="relative aspect-square overflow-hidden rounded-xl border bg-stone-100"
                                    >
                                        <img
                                            src={`/storage/${image.path}`}
                                            alt="Foto produk"
                                            className="h-full w-full object-cover"
                                        />
                                        <button
                                            type="button"
                                            aria-label="Hapus foto"
                                            className="absolute top-2 right-2 rounded-full border border-stone-200 bg-white p-1.5 text-red-600"
                                            onClick={() =>
                                                setData('remove_image_ids', [
                                                    ...data.remove_image_ids,
                                                    image.id,
                                                ])
                                            }
                                        >
                                            <Trash2 className="size-4" />
                                        </button>
                                    </div>
                                ))}
                        </div>
                    </div>
                </section>
            </form>
        </AdminLayout>
    );
}

function SectionTitle({
    title,
    description,
}: {
    title: string;
    description: string;
}) {
    return (
        <div>
            <h3 className="text-lg font-bold text-stone-950">{title}</h3>
            <p className="mt-1 text-sm text-stone-500">{description}</p>
        </div>
    );
}

function Field({
    label,
    children,
    error,
}: {
    label: string;
    children: React.ReactNode;
    error?: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
            {error}
        </div>
    );
}

function Select({
    value,
    onChange,
    options,
    placeholder,
    allowEmpty = false,
}: {
    value: string | number;
    onChange: (value: string) => void;
    options: Option[];
    placeholder: string;
    allowEmpty?: boolean;
}) {
    return (
        <select
            className={fieldClass}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={!allowEmpty}
        >
            <option value="">{placeholder}</option>
            {options.map((option) => (
                <option key={option.id} value={option.id}>
                    {option.name}
                    {option.symbol ? ` (${option.symbol})` : ''}
                </option>
            ))}
        </select>
    );
}

function Toggle({
    label,
    checked,
    onChange,
    compact = false,
}: {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    compact?: boolean;
}) {
    return (
        <label
            className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white ${compact ? 'min-h-11 px-3' : 'p-3'}`}
        >
            <span className="text-sm font-medium text-stone-700">{label}</span>
            <input
                type="checkbox"
                className="size-4 accent-lime-600"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
        </label>
    );
}
