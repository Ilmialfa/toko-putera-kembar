import { useForm, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { useConfirmation } from '@/components/confirmation-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/AdminLayout';

interface Warehouse {
    id: number;
    store_location_id: number;
    name: string;
    code: string;
    is_default: boolean;
    is_active: boolean;
    store_location?: {
        id: number;
        name: string;
    };
}

export default function WarehouseIndex({
    warehouses,
    storeLocations,
    filters,
}: any) {
    const confirm = useConfirmation();
    const [search, setSearch] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
        null,
    );

    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
    } = useForm({
        store_location_id:
            storeLocations.length > 0 ? storeLocations[0].id : '',
        name: '',
        code: '',
        is_default: false,
        is_active: true,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/inventory/warehouses',
            { search },
            { preserveState: true },
        );
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/inventory/warehouses', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const openEdit = (warehouse: Warehouse) => {
        setEditingWarehouse(warehouse);
        setData({
            store_location_id: warehouse.store_location_id,
            name: warehouse.name,
            code: warehouse.code,
            is_default: warehouse.is_default,
            is_active: warehouse.is_active,
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingWarehouse) {
            return;
        }

        put(`/admin/inventory/warehouses/${editingWarehouse.id}`, {
            onSuccess: () => {
                setIsEditOpen(false);
                reset();
            },
        });
    };

    const handleDelete = async (warehouse: Warehouse) => {
        if (
            await confirm({
                title: `Hapus gudang ${warehouse.name}?`,
                description:
                    'Gudang ini akan dihapus dari data operasional toko.',
                confirmLabel: 'Hapus gudang',
                destructive: true,
            })
        ) {
            destroy(`/admin/inventory/warehouses/${warehouse.id}`);
        }
    };

    return (
        <AdminLayout title="Warehouses">
            <div className="mb-6 flex items-center justify-between">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        placeholder="Search warehouses..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-64"
                    />
                    <Button type="submit" variant="secondary">
                        Search
                    </Button>
                </form>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button>Tambah Gudang</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <form onSubmit={handleCreateSubmit}>
                            <DialogHeader>
                                <DialogTitle>Tambah Gudang</DialogTitle>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div>
                                    <Label>Store Location</Label>
                                    <select
                                        className="h-10 w-full rounded-md border border-input bg-transparent px-3"
                                        value={data.store_location_id}
                                        onChange={(e) =>
                                            setData(
                                                'store_location_id',
                                                e.target.value,
                                            )
                                        }
                                    >
                                        <option value="" disabled>
                                            Select Store Location
                                        </option>
                                        {storeLocations.map((loc: any) => (
                                            <option key={loc.id} value={loc.id}>
                                                {loc.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.store_location_id && (
                                        <div className="text-sm text-red-500">
                                            {errors.store_location_id}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label>Name</Label>
                                    <Input
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                    />
                                    {errors.name && (
                                        <div className="text-sm text-red-500">
                                            {errors.name}
                                        </div>
                                    )}
                                </div>
                                <div>
                                    <Label>Code</Label>
                                    <Input
                                        value={data.code}
                                        onChange={(e) =>
                                            setData('code', e.target.value)
                                        }
                                    />
                                    {errors.code && (
                                        <div className="text-sm text-red-500">
                                            {errors.code}
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_default"
                                            checked={data.is_default}
                                            onChange={(e) =>
                                                setData(
                                                    'is_default',
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        <Label htmlFor="is_default">
                                            Is Default
                                        </Label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="is_active"
                                            checked={data.is_active}
                                            onChange={(e) =>
                                                setData(
                                                    'is_active',
                                                    e.target.checked,
                                                )
                                            }
                                        />
                                        <Label htmlFor="is_active">
                                            Active
                                        </Label>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                >
                                    Batal
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    Save
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Location</TableHead>
                            <TableHead>Code</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Default</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">
                                Actions
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {warehouses.data.map((warehouse: Warehouse) => (
                            <TableRow key={warehouse.id}>
                                <TableCell>
                                    {warehouse.store_location?.name}
                                </TableCell>
                                <TableCell>{warehouse.code}</TableCell>
                                <TableCell className="font-medium">
                                    {warehouse.name}
                                </TableCell>
                                <TableCell>
                                    {warehouse.is_default ? 'Yes' : 'No'}
                                </TableCell>
                                <TableCell>
                                    {warehouse.is_active
                                        ? 'Active'
                                        : 'Inactive'}
                                </TableCell>
                                <TableCell className="gap-2 text-right">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => openEdit(warehouse)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-red-500"
                                        onClick={() => handleDelete(warehouse)}
                                    >
                                        Delete
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                <DialogContent>
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle>Ubah Gudang</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div>
                                <Label>Store Location</Label>
                                <select
                                    className="h-10 w-full rounded-md border border-input bg-transparent px-3"
                                    value={data.store_location_id}
                                    onChange={(e) =>
                                        setData(
                                            'store_location_id',
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="" disabled>
                                        Select Store Location
                                    </option>
                                    {storeLocations.map((loc: any) => (
                                        <option key={loc.id} value={loc.id}>
                                            {loc.name}
                                        </option>
                                    ))}
                                </select>
                                {errors.store_location_id && (
                                    <div className="text-sm text-red-500">
                                        {errors.store_location_id}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label>Name</Label>
                                <Input
                                    value={data.name}
                                    onChange={(e) =>
                                        setData('name', e.target.value)
                                    }
                                />
                                {errors.name && (
                                    <div className="text-sm text-red-500">
                                        {errors.name}
                                    </div>
                                )}
                            </div>
                            <div>
                                <Label>Code</Label>
                                <Input
                                    value={data.code}
                                    onChange={(e) =>
                                        setData('code', e.target.value)
                                    }
                                />
                                {errors.code && (
                                    <div className="text-sm text-red-500">
                                        {errors.code}
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="edit_is_default"
                                        checked={data.is_default}
                                        onChange={(e) =>
                                            setData(
                                                'is_default',
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    <Label htmlFor="edit_is_default">
                                        Is Default
                                    </Label>
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="edit_is_active"
                                        checked={data.is_active}
                                        onChange={(e) =>
                                            setData(
                                                'is_active',
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    <Label htmlFor="edit_is_active">
                                        Active
                                    </Label>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditOpen(false)}
                            >
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                Update
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
