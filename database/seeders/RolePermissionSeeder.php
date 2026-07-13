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

        // Create permissions using the format used in middleware: 'manage X'
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
        ]);

        // 3. Kasir - only POS
        $roleKasir = Role::firstOrCreate(['name' => 'Kasir']);
        $roleKasir->syncPermissions([
            'manage pos',
        ]);

        // 4. Staff Gudang - only inventory
        $roleStaffGudang = Role::firstOrCreate(['name' => 'Staff Gudang']);
        $roleStaffGudang->syncPermissions([
            'manage inventory',
        ]);

        // 5. Staff Online - ecommerce (settings for CMS)
        $roleStaffOnline = Role::firstOrCreate(['name' => 'Staff Online']);
        $roleStaffOnline->syncPermissions([
            'manage catalog',
            'manage settings',
        ]);
    }
}
