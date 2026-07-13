<?php

namespace Database\Seeders;

use App\Models\ChartOfAccount;
use Illuminate\Database\Seeder;

class ChartOfAccountSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            // Assets (Harta)
            ['code' => '1100', 'name' => 'Kas', 'type' => 'asset'],
            ['code' => '1110', 'name' => 'Bank BCA', 'type' => 'asset'],
            ['code' => '1200', 'name' => 'Piutang Usaha', 'type' => 'asset'],
            ['code' => '1300', 'name' => 'Persediaan Barang Dagang', 'type' => 'asset'],
            ['code' => '1400', 'name' => 'Aset Tetap', 'type' => 'asset'],

            // Liabilities (Hutang)
            ['code' => '2100', 'name' => 'Hutang Usaha', 'type' => 'liability'],
            ['code' => '2200', 'name' => 'Hutang Bank', 'type' => 'liability'],

            // Equity (Modal)
            ['code' => '3100', 'name' => 'Modal Pemilik', 'type' => 'equity'],
            ['code' => '3200', 'name' => 'Prive Pemilik', 'type' => 'equity'],
            ['code' => '3300', 'name' => 'Laba Ditahan', 'type' => 'equity'],

            // Revenue (Pendapatan)
            ['code' => '4100', 'name' => 'Pendapatan Penjualan', 'type' => 'revenue'],
            ['code' => '4200', 'name' => 'Pendapatan Lain-lain', 'type' => 'revenue'],

            // Expenses (Beban & HPP)
            ['code' => '5100', 'name' => 'Harga Pokok Penjualan (HPP)', 'type' => 'expense'],
            ['code' => '6100', 'name' => 'Beban Gaji', 'type' => 'expense'],
            ['code' => '6200', 'name' => 'Beban Sewa', 'type' => 'expense'],
            ['code' => '6300', 'name' => 'Beban Listrik, Air & Telepon', 'type' => 'expense'],
            ['code' => '6400', 'name' => 'Beban Transportasi', 'type' => 'expense'],
            ['code' => '6900', 'name' => 'Beban Lain-lain', 'type' => 'expense'],
        ];

        foreach ($accounts as $account) {
            ChartOfAccount::firstOrCreate(['code' => $account['code']], $account);
        }
    }
}
