<?php

namespace App\Domain\Catalog\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $categories = Category::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->with('parent')
            ->orderBy('display_order')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('admin/catalog/categories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'image' => ['nullable', 'image', 'max:5120'],
            'icon' => ['nullable', 'string', 'max:80'],
            'display_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        $validated['slug'] = Str::slug($validated['name']).'-'.strtolower(Str::random(4));
        unset($validated['image']);

        if ($request->hasFile('image')) {
            $validated['image_path'] = $request->file('image')->store('categories', 'public');
        }

        Category::create($validated);

        return redirect()->back()->with('success', 'Category created successfully');
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'parent_id' => 'nullable|exists:categories,id',
            'image' => ['nullable', 'image', 'max:5120'],
            'icon' => ['nullable', 'string', 'max:80'],
            'display_order' => 'integer',
            'is_active' => 'boolean',
        ]);

        unset($validated['image']);

        if ($request->hasFile('image')) {
            if ($category->image_path !== null) {
                Storage::disk('public')->delete($category->image_path);
            }

            $validated['image_path'] = $request->file('image')->store('categories', 'public');
        }

        if ($request->name !== $category->name) {
            $validated['slug'] = Str::slug($validated['name']).'-'.strtolower(Str::random(4));
        }

        $category->update($validated);

        return redirect()->back()->with('success', 'Category updated successfully');
    }

    public function destroy(Category $category)
    {
        if ($category->image_path !== null) {
            Storage::disk('public')->delete($category->image_path);
        }

        $category->delete();

        return redirect()->back()->with('success', 'Category deleted successfully');
    }
}
