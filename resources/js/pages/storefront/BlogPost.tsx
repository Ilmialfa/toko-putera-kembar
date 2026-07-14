import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { index as blogIndex } from '@/routes/blog';

export default function BlogPost({ post }: any) {
    return (
        <StorefrontLayout>
            <Head title={post.title} />

            <div className="bg-white py-10 sm:py-14">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <Link
                        href={blogIndex.url()}
                        className="mb-8 inline-flex items-center text-sm font-bold text-lime-700 hover:underline"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Blog
                    </Link>

                    <article className="overflow-hidden rounded-3xl border border-stone-200 bg-white">
                        {post.cover_image_path && (
                            <img
                                src={`/storage/${post.cover_image_path}`}
                                alt={post.title}
                                className="h-64 w-full object-cover md:h-96"
                            />
                        )}

                        <div className="p-6 sm:p-8 md:p-12">
                            <header className="mb-8">
                                <p className="mb-3 text-xs font-bold tracking-[0.14em] text-lime-700 uppercase">
                                    Informasi Putera Kembar
                                </p>
                                <h1 className="mb-4 text-3xl font-black tracking-tight text-stone-950 md:text-5xl">
                                    {post.title}
                                </h1>
                                <div className="flex flex-wrap items-center gap-x-2 text-sm text-stone-500">
                                    <span>
                                        Oleh {post.author?.name || 'Admin'}
                                    </span>
                                    <span className="mx-2">•</span>
                                    <span>
                                        {new Date(
                                            post.published_at,
                                        ).toLocaleDateString('id-ID', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </header>

                            <p className="max-w-none leading-8 whitespace-pre-line text-stone-700">
                                {toReadableText(post.content)}
                            </p>
                        </div>
                    </article>
                </div>
            </div>
        </StorefrontLayout>
    );
}

function toReadableText(value: string): string {
    return value
        .replace(/<br\s*\/?>(\n)?/gi, '\n')
        .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, '\n\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
}
