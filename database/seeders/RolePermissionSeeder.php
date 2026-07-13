<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Permission granular adalah sumber kebenaran. Permission "manage" dipertahankan
        // sementara untuk kompatibilitas route lama selama migrasi bertahap.
        $permissions = [
            'manage pos',
            'manage inventory',
            'manage catalog',
            'manage finance',
            'manage settings',
            'manage hr',
            'manage users',
            'view reports',
            'pos.discount.override_limit',
            'attendance.remote.allowed',
            'products.view',
            'products.create',
            'products.edit',
            'products.delete',
            'products.view_hpp',
            'products.prices.edit',
            'inventory.view',
            'inventory.receive',
            'inventory.transfer',
            'inventory.opname',
            'inventory.adjustment.create',
            'inventory.adjustment.approve',
            'inventory.reports.view',
            'pos.use',
            'pos.shift.manage',
            'pos.discount.manual',
            'pos.retur.create',
            'pos.retur.approve',
            'pos.void.own',
            'pos.void.any',
            'orders.view',
            'orders.manage',
            'customers.view',
            'customers.manage',
            'promotions.view',
            'promotions.manage',
            'finance.view',
            'finance.manage',
            'reports.view',
            'hr.view',
            'hr.manage',
            'attendance.self',
            'attendance.correct',
            'cms.view',
            'cms.manage',
            'users.view',
            'users.manage',
            'roles.manage',
            'settings.manage',
            'audit_log.view',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // 1. Owner - gets all permissions
        $roleOwner = Role::firstOrCreate(['name' => 'Owner']);
        $roleOwner->syncPermissions(Permission::all());

        // 2. Admin - gets all except sensitive finance/settings
        $roleAdmin = Role::firstOrCreate(['name' => 'Admin']);
        $roleAdmin->syncPermissions([
            'manage pos',
            'manage inventory',
            'manage catalog',
            'manage hr',
            'manage settings',
            'view reports',
            'pos.discount.override_limit',
            'products.view',
            'products.create',
            'products.edit',
            'products.view_hpp',
            'products.prices.edit',
            'inventory.view',
            'inventory.receive',
            'inventory.transfer',
            'inventory.opname',
            'inventory.adjustment.create',
            'inventory.adjustment.approve',
            'inventory.reports.view',
            'pos.use',
            'pos.shift.manage',
            'pos.discount.manual',
            'pos.retur.create',
            'pos.retur.approve',
            'pos.void.any',
            'orders.view',
            'orders.manage',
            'customers.view',
            'customers.manage',
            'promotions.view',
            'promotions.manage',
            'reports.view',
            'hr.view',
            'hr.manage',
            'attendance.correct',
            'cms.view',
            'cms.manage',
            'users.view',
            'users.manage',
        ]);

        // 3. Kasir - only POS
        $roleKasir = Role::firstOrCreate(['name' => 'Kasir']);
        $roleKasir->syncPermissions([
            'manage pos',
            'products.view',
            'pos.use',
            'pos.shift.manage',
            'pos.discount.manual',
            'pos.retur.create',
            'pos.void.own',
            'customers.view',
            'attendance.self',
        ]);

        // 4. Staff Gudang - only inventory
        $roleStaffGudang = Role::firstOrCreate(['name' => 'Staff Gudang']);
        $roleStaffGudang->syncPermissions([
            'manage inventory',
            'products.view',
            'products.view_hpp',
            'inventory.view',
            'inventory.receive',
            'inventory.transfer',
            'inventory.opname',
            'inventory.adjustment.create',
            'inventory.reports.view',
            'attendance.self',
        ]);

        // 5. Staff Online - ecommerce (settings for CMS)
        $roleStaffOnline = Role::firstOrCreate(['name' => 'Staff Online']);
        $roleStaffOnline->syncPermissions([
            'manage catalog',
            'manage settings',
            'products.view',
            'orders.view',
            'orders.manage',
            'customers.view',
            'customers.manage',
            'promotions.view',
            'cms.view',
            'cms.manage',
            'attendance.self',
        ]);
    }
}
