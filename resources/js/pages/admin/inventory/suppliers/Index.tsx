import { useForm, router } from '@inertiajs/react';
import React, { useState } from 'react';
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

    const handleDelete = (supplier: Supplier) => {
        if (confirm(`Are you sure you want to delete ${supplier.name}?`)) {
            destroy(`/admin/inventory/suppliers/${supplier.id}`);
        }
    };

    return (
        <AdminLayout title="Suppliers">
            <div className="mb-6 flex items-center justify-between">
                <form onSubmit={handleSearch} className="flex gap-2">
                    <Input
                        placeholder="Search suppliers..."
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
                        <Button>Add Supplier</Button>
                    </DialogTrigger>
                    <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                        <form onSubmit={handleCreateSubmit}>
                            <DialogHeader>
                                <DialogTitle>Add New Supplier</DialogTitle>
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
                                        id="is_active"
                                        checked={data.is_active}
                                        onChange={(e) =>
                                            setData(
                                                'is_active',
                                                e.target.checked,
                                            )
                                        }
                                    />
                                    <Label htmlFor="is_active">Active</Label>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsCreateOpen(false)}
                                >
                                    Cancel
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
                                <TableCell>{supplier.phone || '-'}</TableCell>
                                <TableCell>
                                    {supplier.payment_terms_days} days
                                </TableCell>
                                <TableCell>
                                    {supplier.is_active ? 'Active' : 'Inactive'}
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
                                        onClick={() => handleDelete(supplier)}
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
                <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
                    <form onSubmit={handleEditSubmit}>
                        <DialogHeader>
                            <DialogTitle>Edit Supplier</DialogTitle>
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
                                        setData('is_active', e.target.checked)
                                    }
                                />
                                <Label htmlFor="edit_is_active">Active</Label>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsEditOpen(false)}
                            >
                                Cancel
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
