import { Head } from '@inertiajs/react';
import StorefrontLayout from '@/layouts/StorefrontLayout';

export default function Page({ cmsPage }: any) {
    return (
        <StorefrontLayout>
            <Head title={cmsPage.title} />

            <div className="min-h-screen bg-white">
                {/* Render Dynamic Sections */}
                {cmsPage.sections && cmsPage.sections.length > 0 ? (
                    cmsPage.sections.map((section: any) => (
                        <div
                            key={section.id}
                            className="border-b py-12 last:border-0"
                        >
                            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                                {section.section_type === 'text_block' && (
                                    <div
                                        className="prose prose-blue prose-img:rounded-xl max-w-none"
                                        dangerouslySetInnerHTML={{
                                            __html:
                                                section.content_json?.content ||
                                                '',
                                        }}
                                    />
                                )}

                                {section.section_type === 'hero_banner' && (
                                    <div className="relative overflow-hidden rounded-2xl bg-blue-600 text-white shadow-xl">
                                        {section.content_json?.image_url && (
                                            <img
                                                src={
                                                    section.content_json
                                                        .image_url
                                                }
                                                alt="Banner"
                                                className="absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-overlay"
                                            />
                                        )}
                                        <div className="relative p-12 text-center md:p-24">
                                            <h2 className="mb-4 text-4xl font-extrabold md:text-5xl">
                                                {section.content_json?.title}
                                            </h2>
                                            <p className="mx-auto max-w-2xl text-xl opacity-90">
                                                {section.content_json?.subtitle}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Fallback for unknown section types */}
                                {section.section_type !== 'text_block' &&
                                    section.section_type !== 'hero_banner' && (
                                        <div className="rounded-xl bg-gray-50 p-8 text-center text-gray-500">
                                            [{section.section_type}] section not
                                            implemented
                                        </div>
                                    )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="mx-auto max-w-7xl px-4 py-24 text-center">
                        <h1 className="mb-4 text-4xl font-bold text-gray-900">
                            {cmsPage.title}
                        </h1>
                        <p className="text-gray-500">
                            Halaman ini belum memiliki konten.
                        </p>
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
