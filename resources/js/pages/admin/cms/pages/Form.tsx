import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/AdminLayout';
import * as pageRoutes from '@/routes/admin/cms/pages';

export default function Form({ cmsPage }: any) {
    const isEditing = !!cmsPage;

    const { data, setData, post, put, processing, errors } = useForm({
        title: cmsPage?.title || '',
        slug: cmsPage?.slug || '',
        is_active: cmsPage?.is_active ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            put(pageRoutes.update.url(cmsPage.id));
        } else {
            post(pageRoutes.store.url());
        }
    };

    return (
        <AdminLayout>
            <Head title={isEditing ? 'Edit Halaman' : 'Tambah Halaman'} />

            <div className="mb-6 flex items-center gap-4">
                <Link href={pageRoutes.index.url()}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">
                        {isEditing ? 'Edit Halaman' : 'Tambah Halaman Baru'}
                    </h1>
                    <p className="text-sm text-gray-500">
                        Informasi dasar halaman dinamis
                    </p>
                </div>
            </div>

            <div className="max-w-2xl rounded-lg border bg-white p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Judul Halaman</Label>
                        <Input
                            id="title"
                            value={data.title}
                            onChange={(e) => setData('title', e.target.value)}
                            placeholder="Contoh: Tentang Kami"
                        />
                        {errors.title && (
                            <p className="text-sm text-red-500">
                                {errors.title}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="slug">Slug (URL)</Label>
                        <Input
                            id="slug"
                            value={data.slug}
                            onChange={(e) => setData('slug', e.target.value)}
                            placeholder="Contoh: about-us"
                        />
                        {errors.slug && (
                            <p className="text-sm text-red-500">
                                {errors.slug}
                            </p>
                        )}
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={data.is_active}
                            onChange={(e) =>
                                setData('is_active', e.target.checked)
                            }
                            className="h-4 w-4 rounded border-gray-300"
                        />
                        <Label htmlFor="is_active">
                            Aktif (Publikasikan halaman)
                        </Label>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" /> Simpan
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
