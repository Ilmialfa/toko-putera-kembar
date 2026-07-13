<?php

namespace App\Domain\Inventory\Controllers;

use App\Http\Controllers\Controller;
use App\Models\StoreLocation;
use App\Models\Warehouse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class WarehouseController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');

        $warehouses = Warehouse::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            })
            ->with('storeLocation')
            ->latest()
            ->paginate(15)
            ->withQueryString();

        $storeLocations = StoreLocation::where('is_active', true)->get(['id', 'name']);

        return Inertia::render('admin/inventory/warehouses/Index', [
            'warehouses' => $warehouses,
            'storeLocations' => $storeLocations,
            'filters' => $request->only(['search']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'store_location_id' => 'required|exists:store_locations,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:warehouses,code',
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        Warehouse::create($validated);

        return redirect()->back()->with('success', 'Warehouse created successfully');
    }

    public function update(Request $request, Warehouse $warehouse)
    {
        $validated = $request->validate([
            'store_location_id' => 'required|exists:store_locations,id',
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:255|unique:warehouses,code,'.$warehouse->id,
            'is_default' => 'boolean',
            'is_active' => 'boolean',
        ]);

        $warehouse->update($validated);

        return redirect()->back()->with('success', 'Warehouse updated successfully');
    }

    public function destroy(Warehouse $warehouse)
    {
        $warehouse->delete();

        return redirect()->back()->with('success', 'Warehouse deleted successfully');
    }
}
