<?php

use App\Domain\Catalog\Controllers\BrandController;
use App\Domain\Catalog\Controllers\CategoryController;
use App\Domain\Catalog\Controllers\ProductController;
use App\Domain\Catalog\Controllers\ProductQuoteController;
use App\Domain\Catalog\Controllers\StorefrontController;
use App\Domain\Catalog\Controllers\TagController;
use App\Domain\Catalog\Controllers\UnitController;
use App\Domain\Cms\Controllers\BlogPostController;
use App\Domain\Cms\Controllers\CmsPageController;
use App\Domain\Cms\Controllers\FaqController;
use App\Domain\Cms\Controllers\PublicBlogController;
use App\Domain\Cms\Controllers\PublicFaqController;
use App\Domain\Finance\Controllers\DashboardController;
use App\Domain\Finance\Controllers\ExpenseController;
use App\Domain\Finance\Controllers\FinanceOperationController;
use App\Domain\Finance\Controllers\FinanceReportController;
use App\Domain\Finance\Controllers\ReceivableController;
use App\Domain\HR\Controllers\AttendanceController;
use App\Domain\HR\Controllers\AttendanceCorrectionController;
use App\Domain\HR\Controllers\EmployeeController;
use App\Domain\Identity\Controllers\RoleManagementController;
use App\Domain\Identity\Controllers\UserManagementController;
use App\Domain\Inventory\Controllers\InventoryOperationController;
use App\Domain\Inventory\Controllers\InventoryReportController;
use App\Domain\Inventory\Controllers\StockInController;
use App\Domain\Inventory\Controllers\SupplierController;
use App\Domain\Inventory\Controllers\WarehouseController;
use App\Domain\Promotion\Controllers\PromotionController;
use App\Domain\Promotion\Controllers\VoucherValidationController;
use App\Domain\Sales\Controllers\CashierShiftController;
use App\Domain\Sales\Controllers\CheckoutController;
use App\Domain\Sales\Controllers\ParkBillController;
use App\Domain\Sales\Controllers\PosProductController;
use App\Domain\Sales\Controllers\SaleReturnController;
use App\Domain\Storefront\Controllers\AdminOrderController;
use App\Domain\Storefront\Controllers\CartController;
use App\Domain\Storefront\Controllers\CustomerAuthController;
use App\Models\CashierShift;
use App\Models\Sale;
use App\Models\StoreLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/', [StorefrontController::class, 'index'])->name('storefront.index');
Route::get('/home', [StorefrontController::class, 'index'])->name('home'); // Required by Fortify post-auth redirect
Route::get('/about', [StorefrontController::class, 'page'])->name('storefront.about');
Route::get('/product/{slug}', [StorefrontController::class, 'show'])->name('storefront.show');
Route::post('/price-quote', ProductQuoteController::class)->middleware('throttle:60,1')->name('products.quote');

Route::get('/blog', [PublicBlogController::class, 'index'])->name('blog.index');
Route::get('/blog/{slug}', [PublicBlogController::class, 'show'])->name('blog.show');
Route::get('/faq', [PublicFaqController::class, 'index'])->name('faq.index');

Route::middleware('guest:customer')->group(function () {
    Route::get('/akun/masuk', [CustomerAuthController::class, 'showLogin'])->name('customer.login');
    Route::post('/akun/masuk', [CustomerAuthController::class, 'login'])->middleware('throttle:5,15')->name('customer.login.store');
    Route::get('/akun/daftar', [CustomerAuthController::class, 'showRegister'])->name('customer.register');
    Route::post('/akun/daftar', [CustomerAuthController::class, 'register'])->middleware('throttle:5,15')->name('customer.register.store');
});

Route::middleware('auth:customer')->group(function () {
    Route::get('/akun', [CustomerAuthController::class, 'account'])->name('customer.account');
    Route::post('/akun/keluar', [CustomerAuthController::class, 'logout'])->name('customer.logout');
});

// Cart
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::post('/cart', [CartController::class, 'store'])->name('cart.store');
Route::put('/cart/{cartItem}', [CartController::class, 'update'])->name('cart.update');
Route::delete('/cart/{cartItem}', [CartController::class, 'destroy'])->name('cart.destroy');

// Checkout
Route::get('/checkout', [App\Domain\Storefront\Controllers\CheckoutController::class, 'index'])->name('checkout.index');
Route::post('/checkout', [App\Domain\Storefront\Controllers\CheckoutController::class, 'store'])->name('checkout.store');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/attendance', [AttendanceController::class, 'create'])->name('attendance.portal');
    Route::redirect('dashboard', '/admin/dashboard')->name('dashboard');

    // Admin Routes
    Route::prefix('admin')->name('admin.')->group(function () {
        // Dashboard
        Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

        Route::prefix('access')->name('access.')->group(function () {
            Route::get('users', [UserManagementController::class, 'index'])->middleware('permission:users.view')->name('users.index');
            Route::post('users', [UserManagementController::class, 'store'])->middleware('permission:users.manage')->name('users.store');
            Route::put('users/{user}', [UserManagementController::class, 'update'])->middleware('permission:users.manage')->name('users.update');
            Route::put('users/{user}/password', [UserManagementController::class, 'resetPassword'])->middleware('permission:users.manage')->name('users.password');
            Route::delete('users/{user}/sessions', [UserManagementController::class, 'revokeSessions'])->middleware('permission:users.manage')->name('users.sessions.destroy');

            Route::get('roles', [RoleManagementController::class, 'index'])->middleware('permission:roles.manage')->name('roles.index');
            Route::post('roles', [RoleManagementController::class, 'store'])->middleware('permission:roles.manage')->name('roles.store');
            Route::put('roles/{role}', [RoleManagementController::class, 'update'])->middleware('permission:roles.manage')->name('roles.update');
            Route::delete('roles/{role}', [RoleManagementController::class, 'destroy'])->middleware('permission:roles.manage')->name('roles.destroy');
        });

        Route::prefix('orders')->name('orders.')->middleware('permission:manage settings')->group(function () {
            Route::get('/', [AdminOrderController::class, 'index'])->name('index');
            Route::get('{order}', [AdminOrderController::class, 'show'])->name('show');
            Route::post('{order}/confirm', [AdminOrderController::class, 'confirm'])->name('confirm');
            Route::patch('{order}/status', [AdminOrderController::class, 'updateStatus'])->name('status.update');
            Route::get('{order}/payment-proof', [AdminOrderController::class, 'paymentProof'])->name('payment-proof');
        });

        // Master Data
        Route::prefix('master')->name('master.')->middleware('permission:manage catalog')->group(function () {
            Route::resource('categories', CategoryController::class)->except(['create', 'edit', 'show']);
            Route::resource('brands', BrandController::class)->except(['create', 'edit', 'show']);
            Route::resource('units', UnitController::class)->except(['create', 'edit', 'show']);
            Route::resource('tags', TagController::class)->except(['create', 'edit', 'show']);
            Route::resource('products', ProductController::class);
        });

        // Finance
        Route::prefix('finance')->name('finance.')->middleware('permission:manage finance')->group(function () {
            Route::get('expenses', [ExpenseController::class, 'index'])->name('expenses.index');
            Route::post('expenses', [ExpenseController::class, 'store'])->name('expenses.store');

            Route::get('receivables', [ReceivableController::class, 'index'])->name('receivables.index');
            Route::post('receivables/{receivable}/payment', [ReceivableController::class, 'storePayment'])->name('receivables.payment');

            Route::get('reports/profit-loss', [FinanceReportController::class, 'profitLoss'])->name('reports.profit-loss');
            Route::get('operations', [FinanceOperationController::class, 'index'])->name('operations.index');
            Route::post('cash-movements', [FinanceOperationController::class, 'storeMovement'])->name('cash-movements.store');
            Route::post('payables/{payable}/payment', [FinanceOperationController::class, 'payPayable'])->name('payables.payment');
        });

        // Inventory
        Route::prefix('inventory')->name('inventory.')->middleware('permission:manage inventory')->group(function () {
            Route::resource('suppliers', SupplierController::class)->except(['create', 'edit', 'show']);
            Route::resource('warehouses', WarehouseController::class)->except(['create', 'edit', 'show']);
            Route::resource('stock-ins', StockInController::class)->only(['index', 'create', 'store', 'show']);
            Route::get('reports', [InventoryReportController::class, 'index'])->name('reports.index');
            Route::get('operations', [InventoryOperationController::class, 'index'])->name('operations.index');
            Route::post('purchase-orders', [InventoryOperationController::class, 'storePurchaseOrder'])->name('purchase-orders.store');
            Route::patch('purchase-orders/{purchaseOrder}/status', [InventoryOperationController::class, 'updatePurchaseOrderStatus'])->name('purchase-orders.status');
            Route::post('transfers', [InventoryOperationController::class, 'storeTransfer'])->name('transfers.store');
            Route::patch('transfers/{stockTransfer}/status', [InventoryOperationController::class, 'transitionTransfer'])->name('transfers.status');
            Route::post('opnames', [InventoryOperationController::class, 'storeOpname'])->name('opnames.store');
            Route::post('opnames/{stockOpname}/complete', [InventoryOperationController::class, 'completeOpname'])->name('opnames.complete');
            Route::post('adjustments', [InventoryOperationController::class, 'storeAdjustment'])->name('adjustments.store');
            Route::post('adjustments/{stockOutAdjustment}/approve', [InventoryOperationController::class, 'approveAdjustment'])->name('adjustments.approve');
            Route::post('supplier-returns', [InventoryOperationController::class, 'storeSupplierReturn'])->name('supplier-returns.store');
            Route::post('supplier-returns/{supplierReturn}/complete', [InventoryOperationController::class, 'completeSupplierReturn'])->name('supplier-returns.complete');
        });

        // POS
        Route::prefix('pos')->name('pos.')->middleware('permission:manage pos')->group(function () {
            Route::get('/', function (Request $request) {
                $shift = CashierShift::where('user_id', $request->user()->id)
                    ->where('store_id', $request->user()->store_id)
                    ->where('status', 'open')
                    ->first();

                return Inertia\Inertia::render('pos/Index', ['currentShift' => $shift]);
            })->name('index');

            Route::get('shift/current', [CashierShiftController::class, 'current'])->name('shift.current');
            Route::post('shift/open', [CashierShiftController::class, 'open'])->name('shift.open');
            Route::post('shift/close', [CashierShiftController::class, 'close'])->name('shift.close');

            Route::get('products', [PosProductController::class, 'search'])->name('products.search');
            Route::post('vouchers/validate', [VoucherValidationController::class, 'validateVoucher'])->name('vouchers.validate');
            Route::post('checkout', [CheckoutController::class, 'store'])->name('checkout');

            Route::get('print/{sale}', function (Sale $sale) {
                return Inertia\Inertia::render('pos/PrintReceipt', [
                    'sale' => $sale->load('items.product'),
                    'store' => StoreLocation::find($sale->store_id),
                ]);
            })->name('print');

            Route::resource('parked-bills', ParkBillController::class)->only(['index', 'store', 'destroy']);
            Route::resource('sale-returns', SaleReturnController::class)->only(['index', 'store']);
        });

        // Promotions
        Route::prefix('promotions')->name('promotions.')->middleware('permission:promotions.view')->group(function () {
            Route::get('/', [PromotionController::class, 'index'])->name('index');
            Route::middleware('permission:promotions.manage')->group(function () {
                Route::get('create', [PromotionController::class, 'create'])->name('create');
                Route::post('/', [PromotionController::class, 'store'])->name('store');
                Route::get('{promotion}/edit', [PromotionController::class, 'edit'])->name('edit');
                Route::put('{promotion}', [PromotionController::class, 'update'])->name('update');
                Route::post('{promotion}/toggle', [PromotionController::class, 'toggle'])->name('toggle');
                Route::post('{promotion}/duplicate', [PromotionController::class, 'duplicate'])->name('duplicate');
                Route::delete('{promotion}', [PromotionController::class, 'destroy'])->name('destroy');
            });

            Route::post('vouchers/validate', [VoucherValidationController::class, 'validateVoucher'])->name('vouchers.validate');
        });

        // CMS
        Route::prefix('cms')->name('cms.')->middleware('permission:manage settings')->group(function () {
            Route::resource('pages', CmsPageController::class)->except(['show']);
            Route::resource('blogs', BlogPostController::class)->except(['show']);
            Route::resource('faqs', FaqController::class)->except(['show']);
        });

        // HR
        Route::prefix('hr')->name('hr.')->middleware('permission:manage hr')->group(function () {
            Route::get('attendances', [AttendanceController::class, 'index'])->name('attendances.index');
            Route::post('attendances/corrections', [AttendanceCorrectionController::class, 'store'])->name('attendances.corrections.store');
            Route::get('employees', [EmployeeController::class, 'index'])->name('employees.index');
            Route::post('employees', [EmployeeController::class, 'store'])->name('employees.store');
            Route::put('employees/{employee}', [EmployeeController::class, 'update'])->name('employees.update');
        });
    });
});

require __DIR__.'/settings.php';
