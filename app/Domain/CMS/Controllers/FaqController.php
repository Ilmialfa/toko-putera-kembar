<?php

namespace App\Domain\Cms\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;
use Inertia\Inertia;

class FaqController extends Controller
{
    public function index()
    {
        $faqs = Faq::orderBy('display_order')->paginate(20);

        return Inertia::render('admin/cms/faqs/Index', ['faqs' => $faqs]);
    }

    public function create()
    {
        return Inertia::render('admin/cms/faqs/Form');
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
            'category' => 'nullable|string|max:50',
            'display_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        Faq::create($validated);

        return redirect()->route('admin.cms.faqs.index')->with('success', 'FAQ berhasil dibuat.');
    }

    public function edit(Faq $faq)
    {
        return Inertia::render('admin/cms/faqs/Form', ['faq' => $faq]);
    }

    public function update(Request $request, Faq $faq)
    {
        $validated = $request->validate([
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
            'category' => 'nullable|string|max:50',
            'display_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $faq->update($validated);

        return redirect()->route('admin.cms.faqs.index')->with('success', 'FAQ berhasil diupdate.');
    }

    public function destroy(Faq $faq)
    {
        $faq->delete();

        return redirect()->route('admin.cms.faqs.index')->with('success', 'FAQ berhasil dihapus.');
    }
}
