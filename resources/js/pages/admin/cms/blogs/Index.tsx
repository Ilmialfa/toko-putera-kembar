import { Head, Link } from '@inertiajs/react';
import { Edit, Eye, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import AdminLayout from '@/layouts/AdminLayout';
import * as blogRoutes from '@/routes/admin/cms/blogs';

export default function Index({ posts }: any) {
    return (
        <AdminLayout>
            <Head title="Artikel & Informasi" />

            <div className="space-y-6 p-4 md:p-8">
                <div className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-white p-5 md:flex-row md:items-center md:justify-between md:p-6">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-700 uppercase">
                            Konten website
                        </p>
                        <h1 className="mt-1 text-2xl font-bold">
                            Artikel & Informasi
                        </h1>
                        <p className="mt-1 text-sm text-stone-500">
                            Artikel terbit akan muncul di halaman Promo dan
                            dapat dibaca penuh pelanggan.
                        </p>
                    </div>
                    <Link href={blogRoutes.create.url()}>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" /> Buat artikel
                        </Button>
                    </Link>
                </div>

                <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Judul</TableHead>
                                <TableHead>Ringkasan</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Tanggal Publikasi</TableHead>
                                <TableHead className="text-right">
                                    Aksi
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {posts.data.map((post: any) => (
                                <TableRow key={post.id}>
                                    <TableCell className="font-medium">
                                        {post.title}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate text-stone-500">
                                        {post.excerpt}
                                    </TableCell>
                                    <TableCell>
                                        {post.status === 'published' ? (
                                            <span className="rounded-full border border-lime-300 px-2.5 py-1 text-xs font-medium text-lime-800">
                                                Terbit
                                            </span>
                                        ) : (
                                            <span className="rounded-full border border-stone-200 px-2.5 py-1 text-xs font-medium text-stone-600">
                                                Draft
                                            </span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {post.published_at
                                            ? new Date(
                                                  post.published_at,
                                              ).toLocaleDateString()
                                            : '-'}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            {post.status === 'published' && (
                                                <Link
                                                    href={`/blog/${post.slug}`}
                                                    target="_blank"
                                                >
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                            )}
                                            <Link
                                                href={blogRoutes.edit.url(
                                                    post.id,
                                                )}
                                            >
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                            <Link
                                                href={blogRoutes.destroy.url(
                                                    post.id,
                                                )}
                                                method="delete"
                                                as="button"
                                            >
                                                <Button
                                                    variant="destructive"
                                                    size="sm"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {posts.data.length === 0 && (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="py-8 text-center text-gray-500"
                                    >
                                        Belum ada artikel.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
        </AdminLayout>
    );
}
