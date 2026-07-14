import { Head, Link } from '@inertiajs/react';
import { ArrowRight, Newspaper } from 'lucide-react';
import StorefrontLayout from '@/layouts/StorefrontLayout';
import { show as showBlog } from '@/routes/blog';

export default function Blog({ posts }: any) {
    return (
        <StorefrontLayout>
            <Head title="Artikel & Informasi" />

            <div className="mx-auto max-w-7xl px-4 py-10 sm:py-14">
                <div className="mb-10 max-w-2xl">
                    <p className="text-xs font-bold tracking-[0.14em] text-lime-700 uppercase">
                        Informasi Putera Kembar
                    </p>
                    <h1 className="mt-2 text-4xl font-black tracking-tight text-stone-950">
                        Artikel dan kabar terbaru
                    </h1>
                    <p className="mt-3 text-base leading-7 text-stone-600">
                        Dapatkan informasi terbaru seputar produk dan penawaran
                        spesial kami.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {posts.data.map((post: any) => (
                        <article
                            key={post.id}
                            className="overflow-hidden rounded-2xl border border-stone-200 bg-white transition hover:border-lime-400"
                        >
                            {post.cover_image_path ? (
                                <img
                                    src={`/storage/${post.cover_image_path}`}
                                    alt={post.title}
                                    className="h-48 w-full object-cover"
                                />
                            ) : (
                                <div className="grid h-48 w-full place-items-center bg-stone-50">
                                    <Newspaper className="size-8 text-stone-300" />
                                </div>
                            )}
                            <div className="p-5">
                                <p className="text-xs font-semibold text-stone-500">
                                    {new Date(
                                        post.published_at,
                                    ).toLocaleDateString('id-ID', {
                                        day: 'numeric',
                                        month: 'long',
                                        year: 'numeric',
                                    })}
                                </p>
                                <h3 className="mt-2 line-clamp-2 text-xl font-black text-stone-950">
                                    <Link
                                        href={showBlog.url(post.slug)}
                                        className="hover:text-lime-700"
                                    >
                                        {post.title}
                                    </Link>
                                </h3>
                                <p className="mt-3 line-clamp-3 text-sm leading-6 text-stone-600">
                                    {post.excerpt}
                                </p>
                                <Link
                                    href={showBlog.url(post.slug)}
                                    className="mt-5 inline-flex items-center gap-1 text-sm font-bold text-lime-700 hover:underline"
                                >
                                    Baca selengkapnya{' '}
                                    <ArrowRight className="size-4" />
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>

                {posts.data.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-stone-300 py-20 text-center text-stone-500">
                        Belum ada artikel yang dipublikasikan.
                    </div>
                )}
            </div>
        </StorefrontLayout>
    );
}
