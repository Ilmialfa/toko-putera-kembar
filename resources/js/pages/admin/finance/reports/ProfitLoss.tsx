import { Head, router } from '@inertiajs/react';
import { Download } from 'lucide-react';
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/AdminLayout';

interface AccountSummary {
    name: string;
    amount: number;
}

interface Props {
    startDate: string;
    endDate: string;
    revenues: AccountSummary[];
    expenses: AccountSummary[];
    totalRevenue: number;
    totalExpense: number;
    netProfit: number;
}

export default function ProfitLoss({
    startDate,
    endDate,
    revenues,
    expenses,
    totalRevenue,
    totalExpense,
    netProfit,
}: Props) {
    const formatRupiah = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(value);
    };

    const handleFilter = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        router.get('/admin/finance/reports/profit-loss', {
            start_date: formData.get('start_date'),
            end_date: formData.get('end_date'),
        });
    };

    return (
        <AdminLayout title="Laporan Laba Rugi">
            <Head title="Laba Rugi" />

            <div className="mx-auto max-w-4xl p-6">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Laporan Laba Rugi
                    </h1>
                    <Button variant="outline" className="gap-2">
                        <Download className="h-4 w-4" /> Export PDF
                    </Button>
                </div>

                {/* Filter */}
                <Card className="mb-8">
                    <CardContent className="pt-6">
                        <form
                            onSubmit={handleFilter}
                            className="flex items-end gap-4"
                        >
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Dari Tanggal
                                </label>
                                <Input
                                    type="date"
                                    name="start_date"
                                    defaultValue={startDate}
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium">
                                    Sampai Tanggal
                                </label>
                                <Input
                                    type="date"
                                    name="end_date"
                                    defaultValue={endDate}
                                />
                            </div>
                            <Button type="submit">Filter</Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Report Content */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-center">
                            TOKO PUTERA KEMBAR
                            <br />
                            <span className="text-sm font-normal text-gray-500">
                                LAPORAN LABA RUGI
                                <br />
                                Periode {startDate} s/d {endDate}
                            </span>
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* PENDAPATAN */}
                        <div className="mb-6">
                            <h3 className="mb-2 border-b pb-2 text-lg font-bold">
                                PENDAPATAN
                            </h3>
                            <div className="space-y-2">
                                {revenues.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex justify-between pl-4"
                                    >
                                        <span>{item.name}</span>
                                        <span>{formatRupiah(item.amount)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-between border-t pt-2 font-bold">
                                <span>Total Pendapatan</span>
                                <span>{formatRupiah(totalRevenue)}</span>
                            </div>
                        </div>

                        {/* BEBAN */}
                        <div className="mb-6">
                            <h3 className="mb-2 border-b pb-2 text-lg font-bold">
                                BEBAN & HPP
                            </h3>
                            <div className="space-y-2">
                                {expenses.map((item, i) => (
                                    <div
                                        key={i}
                                        className="flex justify-between pl-4"
                                    >
                                        <span>{item.name}</span>
                                        <span>{formatRupiah(item.amount)}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-4 flex justify-between border-t pt-2 font-bold">
                                <span>Total Beban & HPP</span>
                                <span>{formatRupiah(totalExpense)}</span>
                            </div>
                        </div>

                        {/* LABA BERSIH */}
                        <div className="mt-8 flex justify-between border-t-2 border-gray-900 pt-4 text-xl font-bold">
                            <span>LABA BERSIH (NET PROFIT)</span>
                            <span
                                className={
                                    netProfit >= 0
                                        ? 'text-blue-600'
                                        : 'text-red-600'
                                }
                            >
                                {formatRupiah(netProfit)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
}
