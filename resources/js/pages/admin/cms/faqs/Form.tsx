import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/AdminLayout';
import * as faqRoutes from '@/routes/admin/cms/faqs';

export default function Form({ faq }: any) {
    const isEditing = !!faq;

    const { data, setData, post, put, processing, errors } = useForm({
        question: faq?.question || '',
        answer: faq?.answer || '',
        category: faq?.category || '',
        display_order: faq?.display_order || 0,
        is_active: faq?.is_active ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (isEditing) {
            put(faqRoutes.update.url(faq.id));
        } else {
            post(faqRoutes.store.url());
        }
    };

    return (
        <AdminLayout>
            <Head title={isEditing ? 'Edit FAQ' : 'Tambah FAQ'} />

            <div className="mb-6 flex items-center gap-4">
                <Link href={faqRoutes.index.url()}>
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold">
                        {isEditing ? 'Edit FAQ' : 'Tambah FAQ Baru'}
                    </h1>
                    <p className="text-sm text-gray-500">
                        Berikan jawaban untuk pertanyaan pelanggan
                    </p>
                </div>
            </div>

            <div className="max-w-2xl rounded-lg border bg-white p-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="question">Pertanyaan</Label>
                        <Input
                            id="question"
                            value={data.question}
                            onChange={(e) =>
                                setData('question', e.target.value)
                            }
                            placeholder="Contoh: Bagaimana cara melakukan retur?"
                        />
                        {errors.question && (
                            <p className="text-sm text-red-500">
                                {errors.question}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="answer">Jawaban</Label>
                        <Textarea
                            id="answer"
                            value={data.answer}
                            onChange={(e) => setData('answer', e.target.value)}
                            rows={5}
                        />
                        {errors.answer && (
                            <p className="text-sm text-red-500">
                                {errors.answer}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="category">Kategori (Opsional)</Label>
                        <Input
                            id="category"
                            value={data.category}
                            onChange={(e) =>
                                setData('category', e.target.value)
                            }
                            placeholder="Contoh: Pembayaran"
                        />
                        {errors.category && (
                            <p className="text-sm text-red-500">
                                {errors.category}
                            </p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="display_order">
                            Urutan Tampil (Makin kecil makin atas)
                        </Label>
                        <Input
                            id="display_order"
                            type="number"
                            value={data.display_order}
                            onChange={(e) =>
                                setData('display_order', Number(e.target.value))
                            }
                        />
                        {errors.display_order && (
                            <p className="text-sm text-red-500">
                                {errors.display_order}
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
                        <Label htmlFor="is_active">Aktif (Tampilkan)</Label>
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
