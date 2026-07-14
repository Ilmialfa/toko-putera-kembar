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
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/AdminLayout';
interface Supplier {
    id: number;
    name: string;
    code: string;
    contact_person: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    payment_terms_days: number;
    is_active: boolean;
}

export default function SupplierIndex({ suppliers, filters }: any) {
    const confirm = useConfirmation();
    const [search, setSearch] = useState(filters.search || '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(
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
        name: '',
        code: '',
        contact_person: '',
        phone: '',
        email: '',
        address: '',
        payment_terms_days: 0,
        is_active: true,
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get(
            '/admin/inventory/suppliers',
            { search },
            { preserveState: true },
        );
    };

    const handleCreateSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/admin/inventory/suppliers', {
            onSuccess: () => {
                setIsCreateOpen(false);
                reset();
            },
        });
    };

    const openEdit = (supplier: Supplier) => {
        setEditingSupplier(supplier);
        setData({
            name: supplier.name,
            code: supplier.code,
            contact_person: supplier.contact_person || '',
            phone: supplier.phone || '',
            email: supplier.email || '',
            address: supplier.address || '',
            payment_terms_days: supplier.payment_terms_days,
            is_active: supplier.is_active,
        });
        setIsEditOpen(true);
    };

    const handleEditSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!editingSupplier) {
            return;
        }

        put(`/admin/inventory/suppliers/${editingSupplier.id}`, {
            onSuccess: () => {
                setIsEditOpen(false);
                reset();
            },
        });
    };

    const handleDelete = async (supplier: Supplier) => {
        if (
            await confirm({
                title: `Hapus supplier ${supplier.name}?`,
                description:
                    'Supplier ini akan dihapus dari data operasional toko.',
                confirmLabel: 'Hapus supplier',
                destructive: true,
            })
        ) {
            destroy(`/admin/inventory/suppliers/${supplier.id}`);
        }
    };

    return (
        <AdminLayout title="Data Supplier">
            <div className="space-y-6 p-4 md:p-8">
                <header className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-6 md:flex-row md:items-start">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-700 uppercase">
                            Persediaan
                        </p>
                        <h2 className="mt-1 text-2xl font-bold text-stone-800">
                            Data Supplier
                        </h2>
                        <p className="mt-1 max-w-3xl text-sm text-stone-500">
                            Kelola daftar supplier atau pemasok barang.
                        </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center">
                        <form onSubmit={handleSearch} className="flex gap-2">
                            <Input
                                placeholder="Cari supplier..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-64 bg-white"
                            />
                            <Button type="submit" variant="secondary">
                                Cari
                            </Button>
                        </form>

                        <Dialog
                            open={isCreateOpen}
                            onOpenChange={setIsCreateOpen}
                        >
                            <DialogTrigger asChild>
                                <Button>Tambah Supplier</Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                                <form onSubmit={handleCreateSubmit}>
                                    <DialogHeader>
                                        <DialogTitle>
                                            Tambah Supplier
                                        </DialogTitle>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-4 py-4">
                                        <div className="col-span-2 sm:col-span-1">
                                            <Label>Name</Label>
                                            <Input
                                                value={data.name}
                                                onChange={(e) =>
                                                    setData(
                                                        'name',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {errors.name && (
                                                <div className="text-sm text-red-500">
                                                    {errors.name}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <Label>Code</Label>
                                            <Input
                                                value={data.code}
                                                onChange={(e) =>
                                                    setData(
                                                        'code',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                            {errors.code && (
                                                <div className="text-sm text-red-500">
                                                    {errors.code}
                                                </div>
                                            )}
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <Label>Contact Person</Label>
                                            <Input
                                                value={data.contact_person}
                                                onChange={(e) =>
                                                    setData(
                                                        'contact_person',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <Label>Phone</Label>
                                            <Input
                                                value={data.phone}
                                                onChange={(e) =>
                                                    setData(
                                                        'phone',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <Label>Email</Label>
                                            <Input
                                                type="email"
                                                value={data.email}
                                                onChange={(e) =>
                                                    setData(
                                                        'email',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="col-span-2 sm:col-span-1">
                                            <Label>Payment Terms (Days)</Label>
                                            <Input
                                                type="number"
                                                value={data.payment_terms_days}
                                                onChange={(e) =>
                                                    setData(
                                                        'payment_terms_days',
                                                        parseInt(
                                                            e.target.value,
                                                        ) || 0,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="col-span-2">
                                            <Label>Address</Label>
                                            <Textarea
                                                value={data.address}
                                                onChange={(e) =>
                                                    setData(
                                                        'address',
                                                        e.target.value,
                                                    )
                                                }
                                            />
                                        </div>
                                        <div className="col-span-2 flex items-center gap-2">
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
                                    <DialogFooter>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() =>
                                                setIsCreateOpen(false)
                                            }
                                        >
                                            Batal
                                        </Button>
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            Save
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </header>

                <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Code</TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead>Contact</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Terms</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">
                                    Actions
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {suppliers.data.map((supplier: Supplier) => (
                                <TableRow key={supplier.id}>
                                    <TableCell>{supplier.code}</TableCell>
                                    <TableCell className="font-medium">
                                        {supplier.name}
                                    </TableCell>
                                    <TableCell>
                                        {supplier.contact_person || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {supplier.phone || '-'}
                                    </TableCell>
                                    <TableCell>
                                        {supplier.payment_terms_days} days
                                    </TableCell>
                                    <TableCell>
                                        {supplier.is_active
                                            ? 'Active'
                                            : 'Inactive'}
                                    </TableCell>
                                    <TableCell className="gap-2 text-right">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => openEdit(supplier)}
                                        >
                                            Edit
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500"
                                            onClick={() =>
                                                handleDelete(supplier)
                                            }
                                        >
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </section>

                {/* Edit Dialog */}
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                        <form onSubmit={handleEditSubmit}>
                            <DialogHeader>
                                <DialogTitle>Ubah Supplier</DialogTitle>
                            </DialogHeader>
                            <div className="grid grid-cols-2 gap-4 py-4">
                                <div className="col-span-2 sm:col-span-1">
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
                                <div className="col-span-2 sm:col-span-1">
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
                                <div className="col-span-2 sm:col-span-1">
                                    <Label>Contact Person</Label>
                                    <Input
                                        value={data.contact_person}
                                        onChange={(e) =>
                                            setData(
                                                'contact_person',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <Label>Phone</Label>
                                    <Input
                                        value={data.phone}
                                        onChange={(e) =>
                                            setData('phone', e.target.value)
                                        }
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <Label>Email</Label>
                                    <Input
                                        type="email"
                                        value={data.email}
                                        onChange={(e) =>
                                            setData('email', e.target.value)
                                        }
                                    />
                                </div>
                                <div className="col-span-2 sm:col-span-1">
                                    <Label>Payment Terms (Days)</Label>
                                    <Input
                                        type="number"
                                        value={data.payment_terms_days}
                                        onChange={(e) =>
                                            setData(
                                                'payment_terms_days',
                                                parseInt(e.target.value) || 0,
                                            )
                                        }
                                    />
                                </div>
                                <div className="col-span-2">
                                    <Label>Address</Label>
                                    <Textarea
                                        value={data.address}
                                        onChange={(e) =>
                                            setData('address', e.target.value)
                                        }
                                    />
                                </div>
                                <div className="col-span-2 flex items-center gap-2">
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
            </div>
        </AdminLayout>
    );
}
