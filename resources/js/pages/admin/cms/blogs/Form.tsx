import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import React from 'react';
import RichTextEditor from '@/components/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/AdminLayout';
import * as blogRoutes from '@/routes/admin/cms/blogs';

export default function Form({ post }: any) {
    const isEditing = !!post;

    const {
        data,
        setData,
        post: postForm,
        transform,
        processing,
        errors,
    } = useForm({
        title: post?.title || '',
        slug: post?.slug || '',
        excerpt: post?.excerpt || '',
        content: post?.content || '',
        status: post?.status || 'draft',
        published_at: post?.published_at || '',
        cover_image: null as File | null,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            transform((values) => ({ ...values, _method: 'put' }));
            postForm(blogRoutes.update.url(post.id), {
                forceFormData: true,
            });
        } else {
            postForm(blogRoutes.store.url(), {
                forceFormData: true,
            });
        }
    };

    return (
        <AdminLayout>
            <Head title={isEditing ? 'Edit Artikel' : 'Tulis Artikel'} />

            <div className="mb-6 flex items-center gap-4">
                <Link href={blogRoutes.index.url()}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">
                        {isEditing ? 'Edit Artikel' : 'Tulis Artikel Baru'}
                    </h1>
                    <p className="text-sm text-gray-500">
                        Tulis berita atau promosi terbaru
                    </p>
                </div>
            </div>

            <div className="rounded-lg border bg-white p-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                        <div className="space-y-4 md:col-span-2">
                            <div className="space-y-2">
                                <Label htmlFor="title">Judul Artikel</Label>
                                <Input
                                    id="title"
                                    value={data.title}
                                    onChange={(e) =>
                                        setData('title', e.target.value)
                                    }
                                    placeholder="Contoh: Promo Ramadhan"
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
                                    onChange={(e) =>
                                        setData('slug', e.target.value)
                                    }
                                    placeholder="Contoh: promo-ramadhan"
                                />
                                {errors.slug && (
                                    <p className="text-sm text-red-500">
                                        {errors.slug}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="excerpt">
                                    Ringkasan (Excerpt)
                                </Label>
                                <Input
                                    id="excerpt"
                                    value={data.excerpt}
                                    onChange={(e) =>
                                        setData('excerpt', e.target.value)
                                    }
                                />
                                {errors.excerpt && (
                                    <p className="text-sm text-red-500">
                                        {errors.excerpt}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label>Konten Utama</Label>
                                <RichTextEditor
                                    value={data.content}
                                    onChange={(val) => setData('content', val)}
                                />
                                {errors.content && (
                                    <p className="text-sm text-red-500">
                                        {errors.content}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <select
                                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    value={data.status}
                                    onChange={(e) =>
                                        setData('status', e.target.value)
                                    }
                                >
                                    <option value="draft">Draft</option>
                                    <option value="published">Published</option>
                                </select>
                                {errors.status && (
                                    <p className="text-sm text-red-500">
                                        {errors.status}
                                    </p>
                                )}
                            </div>

                            {data.status === 'published' && (
                                <div className="space-y-2">
                                    <Label>Tanggal Publikasi</Label>
                                    <Input
                                        type="datetime-local"
                                        value={
                                            data.published_at
                                                ? data.published_at.slice(0, 16)
                                                : ''
                                        }
                                        onChange={(e) =>
                                            setData(
                                                'published_at',
                                                e.target.value,
                                            )
                                        }
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label>Cover Image</Label>
                                {isEditing && post?.cover_image_path && (
                                    <div className="mb-2">
                                        <img
                                            src={`/storage/${post.cover_image_path}`}
                                            alt="Current Cover"
                                            className="h-32 w-full rounded object-cover"
                                        />
                                    </div>
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) =>
                                        setData(
                                            'cover_image',
                                            e.target.files
                                                ? e.target.files[0]
                                                : null,
                                        )
                                    }
                                />
                                {errors.cover_image && (
                                    <p className="text-sm text-red-500">
                                        {errors.cover_image}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end border-t pt-4">
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" /> Simpan
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
