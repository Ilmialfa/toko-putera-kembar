<?php

namespace App\Domain\Cms\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Inertia\Inertia;

class PublicBlogController extends Controller
{
    public function index()
    {
        $posts = BlogPost::where('status', 'published')
            ->where('published_at', '<=', now())
            ->with('author')
            ->latest('published_at')
            ->paginate(12);

        return Inertia::render('storefront/Blog', ['posts' => $posts]);
    }

    public function show($slug)
    {
        $post = BlogPost::where('slug', $slug)
            ->where('status', 'published')
            ->where('published_at', '<=', now())
            ->with('author')
            ->firstOrFail();

        return Inertia::render('storefront/BlogPost', ['post' => $post]);
    }
}
