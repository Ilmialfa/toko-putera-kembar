<?php

namespace App\Domain\Finance\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Expense;
use App\Models\JournalEntryLine;
use App\Models\Product;
use App\Models\Receivable;
use App\Models\Sale;
use App\Models\SalePayment;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        if (! $request->user()->can('finance.view')) {
            if ($request->user()->can('pos.use')) {
                return redirect()->route('admin.pos.index');
            }

            if ($request->user()->can('orders.view')) {
                return redirect()->route('admin.orders.index');
            }

            if ($request->user()->can('inventory.view')) {
                return redirect()->route('admin.inventory.reports.index');
            }

            abort(403);
        }

        $startOfMonth = now()->startOfMonth()->toDateString();

        $incomeThisMonth = Sale::query()
            ->where('payment_status', 'paid')
            ->whereDate('created_at', '>=', $startOfMonth)
            ->sum('total_amount');

        $expenseThisMonth = Expense::query()
            ->whereDate('date', '>=', $startOfMonth)
            ->sum('amount');

        $revenue = JournalEntryLine::query()
            ->whereHas('chartOfAccount', fn ($query) => $query->where('code', '4100'))
            ->whereHas('journalEntry', fn ($query) => $query->whereDate('entry_date', '>=', $startOfMonth))
            ->sum('credit');

        $costOfGoodsSold = JournalEntryLine::query()
            ->whereHas('chartOfAccount', fn ($query) => $query->where('code', '5100'))
            ->whereHas('journalEntry', fn ($query) => $query->whereDate('entry_date', '>=', $startOfMonth))
            ->sum('debit');

        $totalReceivable = Receivable::query()
            ->whereIn('status', ['unpaid', 'partial'])
            ->selectRaw('COALESCE(SUM(amount - paid_amount), 0) as total')
            ->value('total');

        $salesTrend = collect(range(6, 0))->map(function (int $daysAgo): array {
            $date = now()->subDays($daysAgo);

            return [
                'date' => $date->translatedFormat('d M'),
                'amount' => (float) Sale::query()
                    ->whereDate('created_at', $date->toDateString())
                    ->sum('total_amount'),
            ];
        });

        $paymentMethods = SalePayment::query()
            ->whereHas('sale', fn ($query) => $query->whereDate('created_at', '>=', $startOfMonth))
            ->selectRaw('method, SUM(amount) as total')
            ->groupBy('method')
            ->get()
            ->map(fn (SalePayment $payment): array => [
                'name' => str($payment->method)->replace('_', ' ')->title()->toString(),
                'value' => (float) $payment->getAttribute('total'),
            ]);

        $lowStockProducts = Product::query()
            ->whereColumn('stok_saat_ini', '<=', 'min_stock')
            ->where('is_active', true)
            ->orderBy('stok_saat_ini')
            ->take(5)
            ->get(['id', 'name', 'stok_saat_ini', 'sku'])
            ->map(fn (Product $product): array => [
                'id' => $product->id,
                'name' => $product->name,
                'stok_tersedia' => (float) $product->stok_saat_ini,
                'sku' => $product->sku,
            ]);

        return Inertia::render('admin/dashboard/Index', [
            'metrics' => [
                'incomeThisMonth' => (float) $incomeThisMonth,
                'expenseThisMonth' => (float) $expenseThisMonth,
                'netProfit' => (float) $revenue - (float) $costOfGoodsSold - (float) $expenseThisMonth,
                'totalReceivable' => (float) $totalReceivable,
            ],
            'charts' => [
                'salesTrend' => $salesTrend,
                'paymentMethods' => $paymentMethods,
            ],
            'alerts' => ['lowStock' => $lowStockProducts],
        ]);
    }
}
