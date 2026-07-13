import { Head, Link } from '@inertiajs/react';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { show as showBlog } from '@/routes/blog';

export default function Blog({ posts }: any) {
    return (
        <StorefrontLayout>
            <Head title="Blog & Promo" />

            <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
                <div className="mb-12 text-center">
                    <h1 className="mb-4 text-4xl font-bold text-gray-900">
                        Blog & Promo Terkini
                    </h1>
                    <p className="text-lg text-gray-600">
                        Dapatkan informasi terbaru seputar produk dan penawaran
                        spesial kami.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                    {posts.data.map((post: any) => (
                        <div
                            key={post.id}
                            className="overflow-hidden rounded-xl border bg-white shadow-sm transition-shadow hover:shadow-md"
                        >
                            {post.cover_image_path ? (
                                <img
                                    src={`/storage/${post.cover_image_path}`}
                                    alt={post.title}
                                    className="h-48 w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-48 w-full items-center justify-center bg-gray-200">
                                    <span className="text-gray-400">
                                        No Image
                                    </span>
                                </div>
                            )}
                            <div className="p-6">
                                <p className="mb-2 text-sm font-medium text-blue-600">
                                    {new Date(
                                        post.published_at,
                                    ).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                                <h3 className="mb-2 line-clamp-2 text-xl font-bold text-gray-900">
                                    <Link
                                        href={showBlog.url(post.slug)}
                                        className="hover:text-blue-600"
                                    >
                                        {post.title}
                                    </Link>
                                </h3>
                                <p className="mb-4 line-clamp-3 text-gray-600">
                                    {post.excerpt}
                                </p>
                                <Link
                                    href={showBlog.url(post.slug)}
                                    className="inline-flex items-center font-medium text-blue-600 hover:underline"
                                >
                                    Baca selengkapnya{' '}
                                    <span className="ml-1">&rarr;</span>
                                </Link>
                            </div>
                        </div>
                    ))}
                </div>

                {posts.data.length === 0 && (
                    <div className="py-20 text-center text-gray-500">
                        Belum ada artikel yang dipublikasikan.
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
