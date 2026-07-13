import { Head, Link } from '@inertiajs/react';
import { ArrowLeft } from 'lucide-react';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { index as blogIndex } from '@/routes/blog';

export default function BlogPost({ post }: any) {
    return (
        <StorefrontLayout>
            <Head title={post.title} />

            <div className="bg-gray-50 py-12">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <Link
                        href={blogIndex.url()}
                        className="mb-8 inline-flex items-center text-blue-600 hover:underline"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Blog
                    </Link>

                    <article className="overflow-hidden rounded-2xl border bg-white shadow-sm">
                        {post.cover_image_path && (
                            <img
                                src={`/storage/${post.cover_image_path}`}
                                alt={post.title}
                                className="h-64 w-full object-cover md:h-96"
                            />
                        )}

                        <div className="p-8 md:p-12">
                            <header className="mb-8">
                                <h1 className="mb-4 text-3xl font-bold text-gray-900 md:text-5xl">
                                    {post.title}
                                </h1>
                                <div className="flex items-center text-sm text-gray-500">
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

                            <div
                                className="prose prose-blue prose-img:rounded-xl prose-img:w-full max-w-none"
                                dangerouslySetInnerHTML={{
                                    __html: post.content,
                                }}
                            />
                        </div>
                    </article>
                </div>
            </div>
        </StorefrontLayout>
    );
}
