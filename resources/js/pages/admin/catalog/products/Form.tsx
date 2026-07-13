import { useForm, Link } from '@inertiajs/react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/AdminLayout';
export default function ProductForm({
    product,
    categories,
    brands,
    units,
    suppliers,
    warehouses,
}: any) {
    const isEditing = !!product;

    const { data, setData, post, put, processing, errors } = useForm({
        name: product?.name || '',
        sku: product?.sku || '',
        category_id: product?.category_id || '',
        brand_id: product?.brand_id || '',
        default_warehouse_id:
            product?.default_warehouse_id ||
            (warehouses.length > 0 ? warehouses[0].id : ''),
        primary_supplier_id: product?.primary_supplier_id || '',
        base_unit_id: product?.base_unit_id || '',
        product_type: product?.product_type || 'physical',
        costing_method: product?.costing_method || 'WAC',
        is_active: product?.is_active ?? true,
        is_sellable: product?.is_sellable ?? true,
        sellable_pos: product?.sellable_pos ?? true,
        sellable_online: product?.sellable_online ?? true,
        is_preorder: product?.is_preorder ?? false,
        preorder_eta_days: product?.preorder_eta_days || '',
        weight_grams: product?.weight_grams || '',
        min_stock: product?.min_stock || 0,
        description_short: product?.description_short || '',
        barcodes: product?.barcodes || [],
        units: product?.product_units || [],
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            put(`/admin/catalog/products/${product.id}`);
        } else {
            post('/admin/catalog/products');
        }
    };

    const addBarcode = () => {
        setData('barcodes', [
            ...data.barcodes,
            { barcode: '', is_primary: false },
        ]);
    };

    return (
        <AdminLayout title={isEditing ? 'Edit Product' : 'Add Product'}>
            <form onSubmit={handleSubmit} className="space-y-8 pb-12">
                {/* Basic Info Section */}
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 border-b pb-2 text-lg font-semibold">
                        Basic Information
                    </h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <Label>
                                Product Name{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                required
                            />
                            {errors.name && (
                                <div className="mt-1 text-sm text-red-500">
                                    {errors.name}
                                </div>
                            )}
                        </div>
                        <div>
                            <Label>SKU (Leave blank to auto-generate)</Label>
                            <Input
                                value={data.sku}
                                onChange={(e) => setData('sku', e.target.value)}
                            />
                            {errors.sku && (
                                <div className="mt-1 text-sm text-red-500">
                                    {errors.sku}
                                </div>
                            )}
                        </div>

                        <div>
                            <Label>
                                Category <span className="text-red-500">*</span>
                            </Label>
                            <select
                                className="h-10 w-full rounded-md border border-input bg-background px-3"
                                value={data.category_id}
                                onChange={(e) =>
                                    setData('category_id', e.target.value)
                                }
                                required
                            >
                                <option value="" disabled>
                                    Select Category
                                </option>
                                {categories.map((c: any) => (
                                    <option key={c.id} value={c.id}>
                                        {c.name}
                                    </option>
                                ))}
                            </select>
                            {errors.category_id && (
                                <div className="mt-1 text-sm text-red-500">
                                    {errors.category_id}
                                </div>
                            )}
                        </div>

                        <div>
                            <Label>Brand</Label>
                            <select
                                className="h-10 w-full rounded-md border border-input bg-background px-3"
                                value={data.brand_id}
                                onChange={(e) =>
                                    setData('brand_id', e.target.value)
                                }
                            >
                                <option value="">No Brand</option>
                                {brands.map((b: any) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="md:col-span-2">
                            <Label>Short Description</Label>
                            <Textarea
                                value={data.description_short}
                                onChange={(e) =>
                                    setData('description_short', e.target.value)
                                }
                                rows={3}
                            />
                        </div>
                    </div>
                </div>

                {/* Logistics & Defaults */}
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 border-b pb-2 text-lg font-semibold">
                        Logistics & Defaults
                    </h2>
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <div>
                            <Label>
                                Base Unit{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <select
                                className="h-10 w-full rounded-md border border-input bg-background px-3"
                                value={data.base_unit_id}
                                onChange={(e) =>
                                    setData('base_unit_id', e.target.value)
                                }
                                required
                            >
                                <option value="" disabled>
                                    Select Base Unit
                                </option>
                                {units.map((u: any) => (
                                    <option key={u.id} value={u.id}>
                                        {u.name}
                                    </option>
                                ))}
                            </select>
                            {errors.base_unit_id && (
                                <div className="mt-1 text-sm text-red-500">
                                    {errors.base_unit_id}
                                </div>
                            )}
                        </div>
                        <div>
                            <Label>
                                Default Warehouse{' '}
                                <span className="text-red-500">*</span>
                            </Label>
                            <select
                                className="h-10 w-full rounded-md border border-input bg-background px-3"
                                value={data.default_warehouse_id}
                                onChange={(e) =>
                                    setData(
                                        'default_warehouse_id',
                                        e.target.value,
                                    )
                                }
                                required
                            >
                                <option value="" disabled>
                                    Select Warehouse
                                </option>
                                {warehouses.map((w: any) => (
                                    <option key={w.id} value={w.id}>
                                        {w.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Primary Supplier</Label>
                            <select
                                className="h-10 w-full rounded-md border border-input bg-background px-3"
                                value={data.primary_supplier_id}
                                onChange={(e) =>
                                    setData(
                                        'primary_supplier_id',
                                        e.target.value,
                                    )
                                }
                            >
                                <option value="">No Default Supplier</option>
                                {suppliers.map((s: any) => (
                                    <option key={s.id} value={s.id}>
                                        {s.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <Label>Weight (grams)</Label>
                            <Input
                                type="number"
                                value={data.weight_grams}
                                onChange={(e) =>
                                    setData('weight_grams', e.target.value)
                                }
                            />
                        </div>
                    </div>
                </div>

                {/* Configuration */}
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <h2 className="mb-4 border-b pb-2 text-lg font-semibold">
                        Configuration
                    </h2>
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_active"
                                checked={data.is_active}
                                onChange={(e) =>
                                    setData('is_active', e.target.checked)
                                }
                            />
                            <Label htmlFor="is_active">Active (Global)</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_sellable"
                                checked={data.is_sellable}
                                onChange={(e) =>
                                    setData('is_sellable', e.target.checked)
                                }
                            />
                            <Label htmlFor="is_sellable">
                                Sellable (Global)
                            </Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="sellable_pos"
                                checked={data.sellable_pos}
                                onChange={(e) =>
                                    setData('sellable_pos', e.target.checked)
                                }
                            />
                            <Label htmlFor="sellable_pos">Sell on POS</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="sellable_online"
                                checked={data.sellable_online}
                                onChange={(e) =>
                                    setData('sellable_online', e.target.checked)
                                }
                            />
                            <Label htmlFor="sellable_online">Sell Online</Label>
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="is_preorder"
                                checked={data.is_preorder}
                                onChange={(e) =>
                                    setData('is_preorder', e.target.checked)
                                }
                            />
                            <Label htmlFor="is_preorder">Is Pre-order</Label>
                        </div>
                    </div>
                    {data.is_preorder && (
                        <div className="mt-4 md:w-1/4">
                            <Label>Pre-order ETA (Days)</Label>
                            <Input
                                type="number"
                                value={data.preorder_eta_days}
                                onChange={(e) =>
                                    setData('preorder_eta_days', e.target.value)
                                }
                            />
                        </div>
                    )}
                </div>

                {/* Additional Barcodes */}
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                    <div className="mb-4 flex items-center justify-between border-b pb-2">
                        <h2 className="text-lg font-semibold">
                            Additional Barcodes
                        </h2>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addBarcode}
                        >
                            Add Barcode
                        </Button>
                    </div>
                    {data.barcodes.map((b: any, index: number) => (
                        <div key={index} className="mb-3 flex items-end gap-4">
                            <div className="flex-1">
                                <Label>Barcode</Label>
                                <Input
                                    value={b.barcode}
                                    onChange={(e) => {
                                        const newBarcodes = [...data.barcodes];
                                        newBarcodes[index].barcode =
                                            e.target.value;
                                        setData('barcodes', newBarcodes);
                                    }}
                                />
                            </div>
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-red-500"
                                onClick={() =>
                                    setData(
                                        'barcodes',
                                        data.barcodes.filter(
                                            (_: any, i: number) => i !== index,
                                        ),
                                    )
                                }
                            >
                                Remove
                            </Button>
                        </div>
                    ))}
                    {data.barcodes.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                            No additional barcodes.
                        </p>
                    )}
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" asChild>
                        <Link href="/admin/catalog/products">Cancel</Link>
                    </Button>
                    <Button type="submit" disabled={processing}>
                        {isEditing ? 'Update Product' : 'Create Product'}
                    </Button>
                </div>
            </form>
        </AdminLayout>
    );
}
