<?php

namespace App\Domain\Cms\Controllers;

use App\Http\Controllers\Controller;
use App\Models\CmsPage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CmsPageController extends Controller
{
    public function index()
    {
        $pages = CmsPage::latest()->paginate(10);

        return Inertia::render('admin/cms/pages/Index', ['pages' => $pages]);
    }

    public function create()
    {
        return Inertia::render('admin/cms/pages/Form');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:cms_pages',
            'is_active' => 'boolean',
        ]);

        $validated['updated_by'] = auth()->id();
        CmsPage::create($validated);

        return redirect()->route('admin.cms.pages.index')->with('success', 'Halaman berhasil dibuat.');
    }

    public function edit(CmsPage $page)
    {
        $page->load('sections');

        return Inertia::render('admin/cms/pages/Form', ['cmsPage' => $page]);
    }

    public function update(Request $request, CmsPage $page)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:cms_pages,slug,'.$page->id,
            'is_active' => 'boolean',
        ]);

        $validated['updated_by'] = auth()->id();
        $page->update($validated);

        return redirect()->route('admin.cms.pages.index')->with('success', 'Halaman berhasil diupdate.');
    }

    public function destroy(CmsPage $page)
    {
        $page->delete();

        return redirect()->route('admin.cms.pages.index')->with('success', 'Halaman berhasil dihapus.');
    }
}
