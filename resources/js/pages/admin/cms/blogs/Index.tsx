import { Head, Link } from '@inertiajs/react';
import { Plus, Edit, Trash2 } from 'lucide-react';
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
            <Head title="Blog Posts" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">Blog / Artikel</h1>
                    <p className="text-sm text-gray-500">
                        Kelola artikel dan berita untuk pelanggan.
                    </p>
                </div>
                <Link href={blogRoutes.create.url()}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Tulis Artikel
                    </Button>
                </Link>
            </div>

            <div className="overflow-hidden rounded-lg border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Judul</TableHead>
                            <TableHead>Penulis</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Tanggal Publikasi</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {posts.data.map((post: any) => (
                            <TableRow key={post.id}>
                                <TableCell className="font-medium">
                                    {post.title}
                                </TableCell>
                                <TableCell>
                                    {post.author?.name || 'Unknown'}
                                </TableCell>
                                <TableCell>
                                    {post.status === 'published' ? (
                                        <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                            Published
                                        </span>
                                    ) : (
                                        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
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
                                        <Link
                                            href={blogRoutes.edit.url(post.id)}
                                        >
                                            <Button variant="outline" size="sm">
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
        </AdminLayout>
    );
}
