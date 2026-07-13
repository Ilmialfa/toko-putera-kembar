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
import * as faqRoutes from '@/routes/admin/cms/faqs';

export default function Index({ faqs }: any) {
    return (
        <AdminLayout>
            <Head title="FAQ" />

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">
                        FAQ (Frequently Asked Questions)
                    </h1>
                    <p className="text-sm text-gray-500">
                        Kelola pertanyaan umum pelanggan.
                    </p>
                </div>
                <Link href={faqRoutes.create.url()}>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Tambah FAQ
                    </Button>
                </Link>
            </div>

            <div className="overflow-hidden rounded-lg border bg-white">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Urutan</TableHead>
                            <TableHead>Pertanyaan</TableHead>
                            <TableHead>Kategori</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {faqs.data.map((faq: any) => (
                            <TableRow key={faq.id}>
                                <TableCell>{faq.display_order}</TableCell>
                                <TableCell className="font-medium">
                                    {faq.question}
                                </TableCell>
                                <TableCell>{faq.category || '-'}</TableCell>
                                <TableCell>
                                    {faq.is_active ? (
                                        <span className="rounded bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                            Aktif
                                        </span>
                                    ) : (
                                        <span className="rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                                            Draft
                                        </span>
                                    )}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        <Link href={faqRoutes.edit.url(faq.id)}>
                                            <Button variant="outline" size="sm">
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </Link>
                                        <Link
                                            href={faqRoutes.destroy.url(faq.id)}
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
                        {faqs.data.length === 0 && (
                            <TableRow>
                                <TableCell
                                    colSpan={5}
                                    className="py-8 text-center text-gray-500"
                                >
                                    Belum ada FAQ.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </AdminLayout>
    );
}
