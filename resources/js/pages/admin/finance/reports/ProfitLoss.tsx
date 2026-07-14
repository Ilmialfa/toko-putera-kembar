import { Head, router } from '@inertiajs/react';
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
    totalCostOfGoodsSold: number;
    totalOperatingExpense: number;
    grossProfit: number;
    netProfit: number;
}

export default function ProfitLoss({
    startDate,
    endDate,
    revenues,
    expenses,
    totalRevenue,
    totalExpense,
    totalCostOfGoodsSold,
    totalOperatingExpense,
    grossProfit,
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

            <div className="mx-auto max-w-5xl p-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Laporan Laba Rugi
                    </h1>
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

                <div className="mb-6 grid gap-4 md:grid-cols-4">
                    <SummaryCard
                        label="Pendapatan"
                        value={formatRupiah(totalRevenue)}
                    />
                    <SummaryCard
                        label="Laba kotor"
                        value={formatRupiah(grossProfit)}
                    />
                    <SummaryCard
                        label="Beban operasional"
                        value={formatRupiah(totalOperatingExpense)}
                    />
                    <SummaryCard
                        label="Laba bersih"
                        value={formatRupiah(netProfit)}
                        positive={netProfit >= 0}
                    />
                </div>

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
                                <span>Total HPP</span>
                                <span>
                                    {formatRupiah(totalCostOfGoodsSold)}
                                </span>
                            </div>
                            <div className="mt-2 flex justify-between border-t pt-2 font-bold">
                                <span>Total Beban Operasional</span>
                                <span>
                                    {formatRupiah(totalOperatingExpense)}
                                </span>
                            </div>
                            <div className="mt-2 flex justify-between border-t pt-2 font-bold">
                                <span>Total Beban & HPP</span>
                                <span>{formatRupiah(totalExpense)}</span>
                            </div>
                        </div>

                        {/* LABA BERSIH */}
                        <div className="mt-8 flex justify-between border-t-2 border-gray-900 pt-4 text-xl font-bold">
                            <span>LABA BERSIH</span>
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

function SummaryCard({
    label,
    value,
    positive,
}: {
    label: string;
    value: string;
    positive?: boolean;
}) {
    return (
        <Card>
            <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p
                    className={
                        positive === undefined
                            ? 'mt-2 text-xl font-bold'
                            : 'mt-2 text-xl font-bold ' +
                              (positive
                                  ? 'text-emerald-600'
                                  : 'text-destructive')
                    }
                >
                    {value}
                </p>
            </CardContent>
        </Card>
    );
}
