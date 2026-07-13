import { Head } from '@inertiajs/react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import StorefrontLayout from '@/layouts/StorefrontLayout';

export default function Faq({ groupedFaqs }: any) {
    const [openId, setOpenId] = useState<number | null>(null);

    const toggle = (id: number) => {
        setOpenId(openId === id ? null : id);
    };

    const categories = Object.keys(groupedFaqs);

    return (
        <StorefrontLayout>
            <Head title="FAQ - Pertanyaan Umum" />

            <div className="min-h-screen bg-gray-50 py-16">
                <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-12 text-center">
                        <h1 className="mb-4 text-4xl font-bold text-gray-900">
                            FAQ
                        </h1>
                        <p className="text-lg text-gray-600">
                            Jawaban untuk pertanyaan yang sering diajukan
                            pelanggan.
                        </p>
                    </div>

                    <div className="space-y-8">
                        {categories.map((category) => (
                            <div
                                key={category}
                                className="rounded-xl border bg-white p-6 shadow-sm"
                            >
                                <h2 className="mb-4 border-b pb-2 text-xl font-bold text-gray-900">
                                    {category || 'Umum'}
                                </h2>

                                <div className="space-y-4">
                                    {groupedFaqs[category].map((faq: any) => (
                                        <div
                                            key={faq.id}
                                            className="border-b pb-4 last:border-0 last:pb-0"
                                        >
                                            <button
                                                onClick={() => toggle(faq.id)}
                                                className="flex w-full items-center justify-between text-left focus:outline-none"
                                            >
                                                <span className="font-medium text-gray-900">
                                                    {faq.question}
                                                </span>
                                                {openId === faq.id ? (
                                                    <ChevronUp className="ml-4 h-5 w-5 flex-shrink-0 text-gray-500" />
                                                ) : (
                                                    <ChevronDown className="ml-4 h-5 w-5 flex-shrink-0 text-gray-500" />
                                                )}
                                            </button>

                                            {openId === faq.id && (
                                                <div className="mt-3 leading-relaxed text-gray-600">
                                                    {faq.answer
                                                        .split('\n')
                                                        .map(
                                                            (
                                                                line: string,
                                                                i: number,
                                                            ) => (
                                                                <p
                                                                    key={i}
                                                                    className="mb-2 last:mb-0"
                                                                >
                                                                    {line}
                                                                </p>
                                                            ),
                                                        )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {categories.length === 0 && (
                            <div className="text-center text-gray-500">
                                Belum ada FAQ.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </StorefrontLayout>
    );
}
