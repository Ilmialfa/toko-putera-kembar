<?php

namespace App\Domain\Cms\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Inertia\Inertia;

class PublicFaqController extends Controller
{
    public function index()
    {
        $faqs = Faq::where('is_active', true)
            ->orderBy('display_order')
            ->get();

        // Group by category for nicer UI
        $groupedFaqs = $faqs->groupBy('category');

        return Inertia::render('storefront/Faq', ['groupedFaqs' => $groupedFaqs]);
    }
}
