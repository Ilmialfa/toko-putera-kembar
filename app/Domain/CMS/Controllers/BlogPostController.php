<?php

namespace App\Domain\Cms\Controllers;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class BlogPostController extends Controller
{
    public function index(): Response
    {
        $posts = BlogPost::with('author')->latest()->paginate(10);

        return Inertia::render('admin/cms/blogs/Index', ['posts' => $posts]);
    }

    public function create(): Response
    {
        return Inertia::render('admin/cms/blogs/Form');
    }

    public function store(Request $request): RedirectResponse
    {
        $attributes = $this->attributes($request);
        $attributes['author_id'] = $request->user()->id;

        if ($request->hasFile('cover_image')) {
            $attributes['cover_image_path'] = $request->file('cover_image')->store('blog', 'public');
        }

        BlogPost::create($attributes);

        return redirect()->route('admin.cms.blogs.index')->with('success', 'Blog berhasil dibuat.');
    }

    public function edit(BlogPost $blog): Response
    {
        return Inertia::render('admin/cms/blogs/Form', ['post' => $blog]);
    }

    public function update(Request $request, BlogPost $blog): RedirectResponse
    {
        $attributes = $this->attributes($request, $blog);

        if ($request->hasFile('cover_image')) {
            if ($blog->cover_image_path !== null) {
                Storage::disk('public')->delete($blog->cover_image_path);
            }

            $attributes['cover_image_path'] = $request->file('cover_image')->store('blog', 'public');
        }

        $blog->update($attributes);

        return redirect()->route('admin.cms.blogs.index')->with('success', 'Blog berhasil diupdate.');
    }

    public function destroy(BlogPost $blog): RedirectResponse
    {
        if ($blog->cover_image_path !== null) {
            Storage::disk('public')->delete($blog->cover_image_path);
        }

        $blog->delete();

        return redirect()->route('admin.cms.blogs.index')->with('success', 'Blog berhasil dihapus.');
    }

    /** @return array<string, mixed> */
    private function attributes(Request $request, ?BlogPost $post = null): array
    {
        $validated = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255'],
            'excerpt' => ['required', 'string', 'max:500'],
            'content' => ['required', 'string', 'max:50000'],
            'status' => ['required', Rule::in(['draft', 'published'])],
            'published_at' => ['nullable', 'date'],
            'cover_image' => ['nullable', 'image', 'max:5120'],
        ]);

        unset($validated['cover_image']);

        $slug = Str::slug((string) ($validated['slug'] ?: $validated['title']));
        $validated['slug'] = $this->uniqueSlug($slug, $post);

        if ($validated['status'] === 'published') {
            $validated['published_at'] ??= now();
        } else {
            $validated['published_at'] = null;
        }

        return $validated;
    }

    private function uniqueSlug(string $slug, ?BlogPost $post): string
    {
        $baseSlug = $slug !== '' ? $slug : 'artikel';
        $candidate = $baseSlug;
        $sequence = 2;

        while (BlogPost::query()
            ->where('slug', $candidate)
            ->when($post, fn ($query) => $query->whereKeyNot($post->id))
            ->exists()) {
            $candidate = "{$baseSlug}-{$sequence}";
            $sequence++;
        }

        return $candidate;
    }
}
