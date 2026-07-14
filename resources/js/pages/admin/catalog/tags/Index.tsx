import { router, useForm } from '@inertiajs/react';
import { Pencil, Plus, Search, Tags, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useConfirmation } from '@/components/confirmation-dialog';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
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

interface Tag {
    id: number;
    name: string;
    slug: string;
}
interface TagIndexProps {
    tags: { data: Tag[]; total?: number };
    filters: { search?: string };
}

export default function TagIndex({ tags, filters }: TagIndexProps) {
    const confirm = useConfirmation();
    const [search, setSearch] = useState(filters.search ?? '');
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const {
        data,
        setData,
        post,
        put,
        delete: destroy,
        processing,
        errors,
        reset,
    } = useForm({ name: '' });

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        router.get('/admin/master/tags', { search }, { preserveState: true });
    };
    const closeDialog = () => {
        reset();
        setEditingTag(null);
    };
    const saveNewTag = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        post('/admin/master/tags', {
            onSuccess: () => {
                setIsCreateOpen(false);
                closeDialog();
            },
        });
    };
    const openEdit = (tag: Tag) => {
        setEditingTag(tag);
        setData({ name: tag.name });
        setIsEditOpen(true);
    };
    const saveTag = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (!editingTag) {
            return;
        }

        put(`/admin/master/tags/${editingTag.id}`, {
            onSuccess: () => {
                setIsEditOpen(false);
                closeDialog();
            },
        });
    };
    const removeTag = async (tag: Tag) => {
        if (
            await confirm({
                title: `Hapus tag ${tag.name}?`,
                description: 'Tag akan dihapus dari katalog produk.',
                confirmLabel: 'Hapus tag',
                destructive: true,
            })
        ) {
            destroy(`/admin/master/tags/${tag.id}`);
        }
    };

    const tagForm = (
        formId: string,
        submit: (event: FormEvent<HTMLFormElement>) => void,
        title: string,
    ) => (
        <form onSubmit={submit} className="space-y-5">
            <DialogHeader>
                <DialogTitle>{title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-2">
                <Label htmlFor={`${formId}-name`}>Nama tag</Label>
                <Input
                    id={`${formId}-name`}
                    value={data.name}
                    onChange={(event) => setData('name', event.target.value)}
                    autoFocus
                />
                {errors.name && (
                    <p className="text-sm text-red-600">{errors.name}</p>
                )}
            </div>
            <DialogFooter>
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                        setIsCreateOpen(false);
                        setIsEditOpen(false);
                    }}
                >
                    Batal
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? 'Menyimpan...' : 'Simpan tag'}
                </Button>
            </DialogFooter>
        </form>
    );

    return (
        <AdminLayout title="Tag">
            <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-700 uppercase">
                            Master data
                        </p>
                        <h2 className="mt-1 text-2xl font-bold tracking-tight text-stone-900">
                            Tag produk
                        </h2>
                        <p className="mt-1 text-sm text-stone-500">
                            Buat penanda singkat untuk pengelompokan dan
                            pencarian katalog.
                        </p>
                    </div>
                    <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-11 px-4">
                                <Plus className="size-4" /> Tambah tag
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            {tagForm('new-tag', saveNewTag, 'Tambah tag')}
                        </DialogContent>
                    </Dialog>
                </header>
                <section className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                    <div className="flex flex-col gap-3 border-b border-stone-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <form
                            onSubmit={handleSearch}
                            className="flex w-full max-w-md gap-2"
                        >
                            <div className="relative min-w-0 flex-1">
                                <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-stone-400" />
                                <Input
                                    placeholder="Cari tag"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    className="h-10 w-full pl-9"
                                />
                            </div>
                            <Button
                                type="submit"
                                variant="outline"
                                className="h-10"
                            >
                                Cari
                            </Button>
                        </form>
                        <span className="inline-flex items-center gap-2 text-sm text-stone-500">
                            <Tags className="size-4 text-lime-700" />
                            {tags.total ?? tags.data.length} tag
                        </span>
                    </div>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Slug</TableHead>
                                    <TableHead className="text-right">
                                        Tindakan
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tags.data.length > 0 ? (
                                    tags.data.map((tag) => (
                                        <TableRow key={tag.id}>
                                            <TableCell className="font-semibold text-stone-800">
                                                {tag.name}
                                            </TableCell>
                                            <TableCell className="font-mono text-xs text-stone-500">
                                                {tag.slug}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            openEdit(tag)
                                                        }
                                                    >
                                                        <Pencil className="size-3.5" />{' '}
                                                        Ubah
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                                                        onClick={() =>
                                                            removeTag(tag)
                                                        }
                                                    >
                                                        <Trash2 className="size-3.5" />{' '}
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={3}
                                            className="h-48 text-center text-sm text-stone-500"
                                        >
                                            Tag belum ditemukan.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </section>
                <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
                    <DialogContent>
                        {tagForm('edit-tag', saveTag, 'Ubah tag')}
                    </DialogContent>
                </Dialog>
            </div>
        </AdminLayout>
    );
}
