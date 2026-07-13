<?php

namespace App\Domain\Cms\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\Request;
use Inertia\Inertia;

class BlogPostController extends Controller
{
    public function index()
    {
        $posts = BlogPost::with('author')->latest()->paginate(10);

        return Inertia::render('admin/cms/blogs/Index', ['posts' => $posts]);
    }

    public function create()
    {
        return Inertia::render('admin/cms/blogs/Form');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:blog_posts',
            'excerpt' => 'nullable|string',
            'content' => 'nullable|string',
            'status' => 'required|in:draft,published',
            'published_at' => 'nullable|date',
        ]);

        $validated['author_id'] = auth()->id();

        if ($request->hasFile('cover_image')) {
            $validated['cover_image_path'] = $request->file('cover_image')->store('blog', 'public');
        }

        BlogPost::create($validated);

        return redirect()->route('admin.cms.blogs.index')->with('success', 'Blog berhasil dibuat.');
    }

    public function edit(BlogPost $blog)
    {
        return Inertia::render('admin/cms/blogs/Form', ['post' => $blog]);
    }

    public function update(Request $request, BlogPost $blog)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:blog_posts,slug,'.$blog->id,
            'excerpt' => 'nullable|string',
            'content' => 'nullable|string',
            'status' => 'required|in:draft,published',
            'published_at' => 'nullable|date',
        ]);

        if ($request->hasFile('cover_image')) {
            $validated['cover_image_path'] = $request->file('cover_image')->store('blog', 'public');
        }

        $blog->update($validated);

        return redirect()->route('admin.cms.blogs.index')->with('success', 'Blog berhasil diupdate.');
    }

    public function destroy(BlogPost $blog)
    {
        $blog->delete();

        return redirect()->route('admin.cms.blogs.index')->with('success', 'Blog berhasil dihapus.');
    }
}
