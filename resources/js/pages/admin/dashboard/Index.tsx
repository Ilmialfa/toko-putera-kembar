import { Head } from '@inertiajs/react';
import {
    DollarSign,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    ShoppingBag,
    CreditCard,
} from 'lucide-react';
import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as RechartsTooltip,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Legend,
} from 'recharts';
import AdminLayout from '@/layouts/AdminLayout';

interface Props {
    metrics: {
        incomeThisMonth: number;
        expenseThisMonth: number;
        netProfit: number;
        totalReceivable: number;
    };
    charts: {
        salesTrend: { date: string; amount: number }[];
        paymentMethods: { name: string; value: number }[];
    };
    alerts: {
        lowStock: {
            id: number;
            name: string;
            stok_tersedia: number;
            sku: string;
        }[];
    };
}

const COLORS = ['#a3e635', '#171a15', '#facc15', '#fb923c', '#22c55e'];

export default function DashboardIndex({ metrics, charts, alerts }: Props) {
    const formatRupiah = (value: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            maximumFractionDigits: 0,
        }).format(value);
    };

    return (
        <AdminLayout title="Dashboard Owner">
            <Head title="Dashboard" />

            <div className="p-4 sm:p-6 lg:p-8">
                <div className="mb-7 overflow-hidden rounded-2xl bg-[#171a15] px-6 py-7 text-white shadow-sm sm:px-8">
                    <p className="mb-2 text-xs font-bold tracking-[0.2em] text-lime-400 uppercase">
                        Ikhtisar operasional
                    </p>
                    <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                        Ringkasan bisnis bulan ini
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-white/55">
                        Pantau performa penjualan, arus kas, dan persediaan toko
                        dari satu tempat.
                    </p>
                </div>

                {/* Metrics Cards */}
                <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div>
                            <p className="mb-1 text-sm font-medium text-gray-500">
                                Total Pendapatan
                            </p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {formatRupiah(metrics.incomeThisMonth)}
                            </h3>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 text-green-600">
                            <TrendingUp className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div>
                            <p className="mb-1 text-sm font-medium text-gray-500">
                                Total Pengeluaran
                            </p>
                            <h3 className="text-2xl font-bold text-gray-900">
                                {formatRupiah(metrics.expenseThisMonth)}
                            </h3>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
                            <TrendingDown className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div>
                            <p className="mb-1 text-sm font-medium text-gray-500">
                                Laba Bersih
                            </p>
                            <h3
                                className={`text-2xl font-bold ${metrics.netProfit >= 0 ? 'text-lime-700' : 'text-red-600'}`}
                            >
                                {formatRupiah(metrics.netProfit)}
                            </h3>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-lime-100 text-lime-700">
                            <DollarSign className="h-6 w-6" />
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                        <div>
                            <p className="mb-1 text-sm font-medium text-gray-500">
                                Piutang Pelanggan
                            </p>
                            <h3 className="text-2xl font-bold text-orange-600">
                                {formatRupiah(metrics.totalReceivable)}
                            </h3>
                        </div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                            <CreditCard className="h-6 w-6" />
                        </div>
                    </div>
                </div>

                {/* Charts & Alerts */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    {/* Sales Trend Chart */}
                    <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm lg:col-span-2">
                        <h3 className="mb-4 flex items-center text-lg font-bold text-gray-900">
                            <TrendingUp className="mr-2 h-5 w-5 text-gray-500" />
                            Tren Penjualan (7 Hari Terakhir)
                        </h3>
                        <div className="h-80">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart
                                    data={charts.salesTrend}
                                    margin={{
                                        top: 5,
                                        right: 20,
                                        bottom: 5,
                                        left: 0,
                                    }}
                                >
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        vertical={false}
                                        stroke="#f3f4f6"
                                    />
                                    <XAxis
                                        dataKey="date"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#6b7280', fontSize: 12 }}
                                        tickFormatter={(value) =>
                                            `Rp${value / 1000}k`
                                        }
                                    />
                                    <RechartsTooltip
                                        formatter={(value) => [
                                            formatRupiah(Number(value ?? 0)),
                                            'Pendapatan',
                                        ]}
                                        contentStyle={{
                                            borderRadius: '8px',
                                            border: 'none',
                                            boxShadow:
                                                '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        }}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="amount"
                                        stroke="#84cc16"
                                        strokeWidth={3}
                                        dot={{ r: 4, strokeWidth: 2 }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Right Column: Payment Methods & Low Stock */}
                    <div className="space-y-6">
                        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center text-lg font-bold text-gray-900">
                                <CreditCard className="mr-2 h-5 w-5 text-gray-500" />
                                Metode Pembayaran
                            </h3>
                            <div className="h-48">
                                {charts.paymentMethods.length > 0 ? (
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%"
                                    >
                                        <PieChart>
                                            <Pie
                                                data={charts.paymentMethods}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {charts.paymentMethods.map(
                                                    (entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={
                                                                COLORS[
                                                                    index %
                                                                        COLORS.length
                                                                ]
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </Pie>
                                            <RechartsTooltip />
                                            <Legend
                                                verticalAlign="middle"
                                                align="right"
                                                layout="vertical"
                                                iconType="circle"
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                        Belum ada data
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
                            <h3 className="mb-4 flex items-center text-lg font-bold text-gray-900 text-red-600">
                                <AlertCircle className="mr-2 h-5 w-5" />
                                Peringatan Stok Menipis
                            </h3>

                            {alerts.lowStock.length > 0 ? (
                                <ul className="divide-y divide-gray-100">
                                    {alerts.lowStock.map((product) => (
                                        <li
                                            key={product.id}
                                            className="flex items-center justify-between py-3"
                                        >
                                            <div className="flex items-start">
                                                <ShoppingBag className="mt-1 mr-2 h-4 w-4 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {product.name}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        SKU: {product.sku}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
                                                Sisa {product.stok_tersedia}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="flex flex-col items-center py-4 text-center text-sm text-green-600">
                                    <span className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                                        ✓
                                    </span>
                                    Semua stok produk aman.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
