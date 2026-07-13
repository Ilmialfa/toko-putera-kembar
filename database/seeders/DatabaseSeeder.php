<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\CashAccount;
use App\Models\Category;
use App\Models\Employee;
use App\Models\ExpenseCategory;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\ProductUnit;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use App\Models\Warehouse;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            StoreLocationSeeder::class,
            RolePermissionSeeder::class,
            ChartOfAccountSeeder::class,
        ]);

        if (app()->isProduction()) {
            $this->createProductionOwner();

            return;
        }

        // ═══════════════════════════════════
        // USERS
        // ═══════════════════════════════════
        $owner = User::firstOrCreate(
            ['email' => 'owner@puterakembar.com'],
            [
                'name' => 'Owner Putera Kembar',
                'password' => Hash::make('password123'),
                'store_id' => 1,
            ]
        );
        $owner->syncRoles('Owner');

        $admin = User::firstOrCreate(
            ['email' => 'admin@puterakembar.com'],
            [
                'name' => 'Admin Sistem',
                'password' => Hash::make('password123'),
                'store_id' => 1,
            ]
        );
        $admin->syncRoles('Admin');

        $kasir = User::firstOrCreate(
            ['email' => 'kasir@puterakembar.com'],
            [
                'name' => 'Budi Kasir',
                'password' => Hash::make('password123'),
                'store_id' => 1,
            ]
        );
        $kasir->syncRoles('Kasir');

        // ═══════════════════════════════════
        // MASTER DATA
        // ═══════════════════════════════════

        // Units (Satuan)
        $pcs = Unit::firstOrCreate(['name' => 'Pcs'], ['symbol' => 'pcs', 'is_active' => true]);
        $lusin = Unit::firstOrCreate(['name' => 'Lusin'], ['symbol' => 'lsn', 'is_active' => true]);
        $dus = Unit::firstOrCreate(['name' => 'Dus'], ['symbol' => 'dus', 'is_active' => true]);
        $kg = Unit::firstOrCreate(['name' => 'Kg'], ['symbol' => 'kg',  'is_active' => true]);
        $rntng = Unit::firstOrCreate(['name' => 'Renteng'], ['symbol' => 'rtg', 'is_active' => true]);

        // Categories
        $catMinuman = Category::firstOrCreate(['slug' => 'minuman'], ['name' => 'Minuman',    'is_active' => true, 'display_order' => 1]);
        $catMakanan = Category::firstOrCreate(['slug' => 'makanan'], ['name' => 'Makanan',    'is_active' => true, 'display_order' => 2]);
        $catSembako = Category::firstOrCreate(['slug' => 'sembako'], ['name' => 'Sembako',    'is_active' => true, 'display_order' => 3]);
        $catRokok = Category::firstOrCreate(['slug' => 'rokok'], ['name' => 'Rokok',      'is_active' => true, 'display_order' => 4]);
        $catCleaning = Category::firstOrCreate(['slug' => 'kebersihan'], ['name' => 'Kebersihan', 'is_active' => true, 'display_order' => 5]);

        // Brands
        $bIndofood = Brand::firstOrCreate(['slug' => 'indofood'], ['name' => 'Indofood',     'is_active' => true]);
        $bNestle = Brand::firstOrCreate(['slug' => 'nestle'], ['name' => 'Nestle',       'is_active' => true]);
        $bUnilever = Brand::firstOrCreate(['slug' => 'unilever'], ['name' => 'Unilever',     'is_active' => true]);
        $bMayora = Brand::firstOrCreate(['slug' => 'mayora'], ['name' => 'Mayora',       'is_active' => true]);
        $bAqua = Brand::firstOrCreate(['slug' => 'aqua-danone'], ['name' => 'Aqua/Danone',  'is_active' => true]);

        // Supplier
        $supplier = Supplier::firstOrCreate(
            ['code' => 'SUP-001'],
            [
                'name' => 'PT. Distributor Utama',
                'phone' => '021-5550001',
                'address' => 'Jl. Raya Distributor No. 1, Jakarta',
                'is_active' => true,
                'store_id' => 1,
            ]
        );

        // Warehouse
        $gudang = Warehouse::firstOrCreate(
            ['code' => 'WH-001'],
            [
                'name' => 'Gudang Utama',
                'is_default' => true,
                'is_active' => true,
                'store_location_id' => 1,
            ]
        );

        // Cash Account
        CashAccount::firstOrCreate(
            ['name' => 'Kas Toko Utama'],
            [
                'type' => 'cash',
                'is_active' => true,
                'store_id' => 1,
            ]
        );

        // Expense Categories
        ExpenseCategory::firstOrCreate(['name' => 'Gaji & Upah'], ['is_active' => true]);
        ExpenseCategory::firstOrCreate(['name' => 'Sewa'], ['is_active' => true]);
        ExpenseCategory::firstOrCreate(['name' => 'Listrik & Air'], ['is_active' => true]);
        ExpenseCategory::firstOrCreate(['name' => 'Transportasi'], ['is_active' => true]);
        ExpenseCategory::firstOrCreate(['name' => 'Lain-lain'], ['is_active' => true]);

        // Employees
        $cashierEmployee = Employee::firstOrCreate(
            ['nip' => 'EMP001'],
            [
                'name' => 'Budi Santoso',
                'position' => 'Kasir',
                'phone' => '08123456789',
                'join_date' => now()->subYear()->toDateString(),
                'is_active' => true,
                'store_location_id' => 1,
            ]
        );
        $kasir->update(['employee_id' => $cashierEmployee->id]);

        Employee::firstOrCreate(
            ['nip' => 'EMP002'],
            [
                'name' => 'Siti Rahayu',
                'position' => 'Staff Gudang',
                'phone' => '08234567890',
                'join_date' => now()->subMonths(6)->toDateString(),
                'is_active' => true,
                'store_location_id' => 1,
            ]
        );

        // ═══════════════════════════════════
        // PRODUCTS (10 produk contoh)
        // ═══════════════════════════════════
        $productsData = [
            [
                'name' => 'Indomie Goreng Original',
                'category_id' => $catMakanan->id,
                'brand_id' => $bIndofood->id,
                'base_unit_id' => $pcs->id,
                'sku' => 'MKN-000001',
                'slug' => 'indomie-goreng-original',
                'description_short' => 'Mie instan goreng rasa original favorit semua kalangan.',
                'hpp_current' => 2500,
                'stok_saat_ini' => 240,
                'min_stock' => 24,
                'units' => [['unit_id' => $rntng->id, 'conversion_qty' => 40]],
                'retail_price' => 3500,
                'wholesale_price' => 3000,
            ],
            [
                'name' => 'Mie Sedaap Goreng Spesial',
                'category_id' => $catMakanan->id,
                'brand_id' => $bIndofood->id,
                'base_unit_id' => $pcs->id,
                'sku' => 'MKN-000002',
                'slug' => 'mie-sedaap-goreng-spesial',
                'description_short' => 'Mie instan goreng dengan bumbu spesial.',
                'hpp_current' => 2300,
                'stok_saat_ini' => 120,
                'min_stock' => 24,
                'units' => [['unit_id' => $rntng->id, 'conversion_qty' => 40]],
                'retail_price' => 3200,
                'wholesale_price' => 2800,
            ],
            [
                'name' => 'Aqua Galon 19 Liter',
                'category_id' => $catMinuman->id,
                'brand_id' => $bAqua->id,
                'base_unit_id' => $pcs->id,
                'sku' => 'MNM-000001',
                'slug' => 'aqua-galon-19-liter',
                'description_short' => 'Air mineral galon Aqua 19 liter.',
                'hpp_current' => 17000,
                'stok_saat_ini' => 50,
                'min_stock' => 10,
                'units' => [],
                'retail_price' => 22000,
                'wholesale_price' => 20000,
            ],
            [
                'name' => 'Aqua Botol 600ml',
                'category_id' => $catMinuman->id,
                'brand_id' => $bAqua->id,
                'base_unit_id' => $pcs->id,
                'sku' => 'MNM-000002',
                'slug' => 'aqua-botol-600ml',
                'description_short' => 'Air mineral botol 600ml praktis dibawa.',
                'hpp_current' => 2200,
                'stok_saat_ini' => 200,
                'min_stock' => 24,
                'units' => [['unit_id' => $dus->id, 'conversion_qty' => 24]],
                'retail_price' => 4000,
                'wholesale_price' => 3500,
            ],
            [
                'name' => 'Beras Premium 5 Kg',
                'category_id' => $catSembako->id,
                'brand_id' => null,
                'base_unit_id' => $pcs->id,
                'sku' => 'SMB-000001',
                'slug' => 'beras-premium-5kg',
                'description_short' => 'Beras premium pulen, wangi, putih bersih 5 kg.',
                'hpp_current' => 55000,
                'stok_saat_ini' => 100,
                'min_stock' => 20,
                'units' => [],
                'retail_price' => 65000,
                'wholesale_price' => 60000,
            ],
            [
                'name' => 'Gula Pasir 1 Kg',
                'category_id' => $catSembako->id,
                'brand_id' => null,
                'base_unit_id' => $pcs->id,
                'sku' => 'SMB-000002',
                'slug' => 'gula-pasir-1kg',
                'description_short' => 'Gula pasir putih bersih 1 kg.',
                'hpp_current' => 13000,
                'stok_saat_ini' => 150,
                'min_stock' => 25,
                'units' => [['unit_id' => $dus->id, 'conversion_qty' => 25]],
                'retail_price' => 17000,
                'wholesale_price' => 15000,
            ],
            [
                'name' => 'Minyak Goreng Bimoli 2 Liter',
                'category_id' => $catSembako->id,
                'brand_id' => null,
                'base_unit_id' => $pcs->id,
                'sku' => 'SMB-000003',
                'slug' => 'minyak-goreng-bimoli-2l',
                'description_short' => 'Minyak goreng kelapa sawit 2 liter.',
                'hpp_current' => 28000,
                'stok_saat_ini' => 80,
                'min_stock' => 15,
                'units' => [['unit_id' => $dus->id, 'conversion_qty' => 12]],
                'retail_price' => 35000,
                'wholesale_price' => 32000,
            ],
            [
                'name' => 'Pocari Sweat 350ml',
                'category_id' => $catMinuman->id,
                'brand_id' => $bNestle->id,
                'base_unit_id' => $pcs->id,
                'sku' => 'MNM-000003',
                'slug' => 'pocari-sweat-350ml',
                'description_short' => 'Minuman isotonik 350ml menggantikan ion tubuh.',
                'hpp_current' => 5500,
                'stok_saat_ini' => 120,
                'min_stock' => 24,
                'units' => [['unit_id' => $dus->id, 'conversion_qty' => 24]],
                'retail_price' => 8000,
                'wholesale_price' => 7000,
            ],
            [
                'name' => 'Sunlight Sabun Cuci Piring 800ml',
                'category_id' => $catCleaning->id,
                'brand_id' => $bUnilever->id,
                'base_unit_id' => $pcs->id,
                'sku' => 'KBR-000001',
                'slug' => 'sunlight-800ml',
                'description_short' => 'Sabun cuci piring Sunlight 800ml jernih dan efektif.',
                'hpp_current' => 12000,
                'stok_saat_ini' => 60,
                'min_stock' => 12,
                'units' => [['unit_id' => $dus->id, 'conversion_qty' => 12]],
                'retail_price' => 18000,
                'wholesale_price' => 15000,
            ],
            [
                'name' => 'Kopi Kapal Api Spesial Mix 20 Sachet',
                'category_id' => $catMinuman->id,
                'brand_id' => null,
                'base_unit_id' => $pcs->id,
                'sku' => 'MNM-000004',
                'slug' => 'kopi-kapal-api-mix-20s',
                'description_short' => 'Kopi susu 3 in 1 isi 20 sachet.',
                'hpp_current' => 22000,
                'stok_saat_ini' => 75,
                'min_stock' => 15,
                'units' => [['unit_id' => $dus->id, 'conversion_qty' => 24]],
                'retail_price' => 30000,
                'wholesale_price' => 27000,
            ],
        ];

        foreach ($productsData as $prodData) {
            $units = $prodData['units'];
            $retailPrice = $prodData['retail_price'];
            $wholesalePrice = $prodData['wholesale_price'];
            unset($prodData['units'], $prodData['retail_price'], $prodData['wholesale_price']);

            $product = Product::firstOrCreate(
                ['sku' => $prodData['sku']],
                array_merge($prodData, [
                    'default_warehouse_id' => $gudang->id,
                    'primary_supplier_id' => $supplier->id,
                    'store_id' => 1,
                    'product_type' => 'physical',
                    'costing_method' => 'WAC',
                    'is_active' => true,
                    'is_sellable' => true,
                    'sellable_pos' => true,
                    'sellable_online' => true,
                    'track_batch' => false,
                    'track_expiry' => false,
                    'track_serial_number' => false,
                    'qr_code' => 'QR-'.$prodData['sku'],
                ])
            );

            // Unit conversions
            foreach ($units as $u) {
                ProductUnit::firstOrCreate(
                    ['product_id' => $product->id, 'unit_id' => $u['unit_id']],
                    [
                        'conversion_qty' => $u['conversion_qty'],
                        'is_purchase_unit' => true,
                        'is_sales_unit' => true,
                    ]
                );
            }

            // Retail price (all customers, no group restriction)
            ProductPrice::updateOrCreate(
                [
                    'product_id' => $product->id,
                    'store_id' => 1,
                    'unit_id' => $product->base_unit_id,
                    'min_qty' => 1,
                ],
                [
                    'price' => $retailPrice,
                    'price_type' => 'retail',
                    'channel' => 'both',
                    'is_active' => true,
                ]
            );

            // Wholesale tier: min 12 pcs
            ProductPrice::updateOrCreate(
                [
                    'product_id' => $product->id,
                    'store_id' => 1,
                    'unit_id' => $product->base_unit_id,
                    'min_qty' => 12,
                ],
                [
                    'price' => $wholesalePrice,
                    'price_type' => 'wholesale_tier',
                    'channel' => 'both',
                    'is_active' => true,
                ]
            );
        }
    }

    private function createProductionOwner(): void
    {
        $email = config('app.initial_admin.email');
        $password = config('app.initial_admin.password');

        if (! is_string($email) || ! is_string($password) || strlen($password) < 12) {
            throw new \RuntimeException('Set INITIAL_ADMIN_EMAIL and INITIAL_ADMIN_PASSWORD (minimum 12 characters) before production seeding.');
        }

        $owner = User::query()->firstOrCreate(
            ['email' => $email],
            [
                'name' => config('app.initial_admin.name'),
                'password' => Hash::make($password),
                'store_id' => 1,
                'email_verified_at' => now(),
            ],
        );
        $owner->syncRoles('Owner');
    }
}
