import { Link, router } from '@inertiajs/react';
import {
    Copy,
    Edit3,
    PauseCircle,
    PlayCircle,
    Plus,
    Search,
    TicketPercent,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AdminLayout from '@/layouts/AdminLayout';

const labels: Record<string, string> = {
    discount_item: 'Diskon item',
    discount_category: 'Diskon kategori',
    voucher: 'Voucher',
    bundling: 'Bundling',
    bxgy: 'Beli X Gratis Y',
    cashback: 'Cashback',
    loyalty_point: 'Loyalty point',
};
const currency = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

export default function PromotionsIndex({ promotions, filters, summary }: any) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [status, setStatus] = useState(filters.status ?? '');
    const runFilter = () =>
        router.get(
            '/admin/promotions',
            { search, status },
            { preserveState: true },
        );

    return (
        <AdminLayout title="Promosi">
            <div className="space-y-6 p-4 md:p-8">
                <div className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-6 text-stone-800 md:flex-row md:items-center">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-400 uppercase">
                            Promotion center
                        </p>
                        <h2 className="mt-1 text-2xl font-bold">
                            Campaign & loyalty
                        </h2>
                        <p className="mt-1 text-sm text-stone-400">
                            Kelola campaign lintas POS dan toko online dari satu
                            tempat.
                        </p>
                    </div>
                    <Button
                        asChild
                        className="bg-lime-400 text-stone-950 hover:bg-lime-300"
                    >
                        <Link href="/admin/promotions/create">
                            <Plus className="mr-2 size-4" />
                            Buat promosi
                        </Link>
                    </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <Metric label="Campaign aktif" value={summary.active} />
                    <Metric label="Terjadwal" value={summary.scheduled} />
                    <Metric
                        label="Diskon tersalurkan"
                        value={currency.format(summary.discount)}
                    />
                </div>
                <div className="flex flex-col gap-3 rounded-2xl border bg-white p-4 md:flex-row">
                    <div className="relative flex-1">
                        <Search className="absolute top-3 left-3 size-4 text-stone-400" />
                        <Input
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari campaign…"
                            onKeyDown={(e) => e.key === 'Enter' && runFilter()}
                        />
                    </div>
                    <select
                        className="h-10 rounded-md border px-3 text-sm"
                        value={status}
                        onChange={(e) => {
                            setStatus(e.target.value);
                            router.get(
                                '/admin/promotions',
                                { search, status: e.target.value },
                                { preserveState: true },
                            );
                        }}
                    >
                        <option value="">Semua status</option>
                        <option value="active">Aktif</option>
                        <option value="draft">Draft</option>
                        <option value="paused">Dijeda</option>
                        <option value="archived">Arsip</option>
                    </select>
                </div>
                <div className="overflow-hidden rounded-2xl border bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-stone-50 text-left text-xs tracking-wide text-stone-500 uppercase">
                                <tr>
                                    <th className="px-5 py-4">Campaign</th>
                                    <th className="px-5 py-4">Periode</th>
                                    <th className="px-5 py-4">Penggunaan</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4 text-right">
                                        Tindakan
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {promotions.data.map((promo: any) => {
                                    const scheduled =
                                        promo.status === 'active' &&
                                        new Date(promo.start_date) > new Date();
                                    const expired =
                                        new Date(promo.end_date) < new Date();
                                    const displayStatus = expired
                                        ? 'expired'
                                        : scheduled
                                          ? 'scheduled'
                                          : promo.status;

                                    return (
                                        <tr
                                            key={promo.id}
                                            className="hover:bg-stone-50"
                                        >
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="flex size-10 items-center justify-center rounded-xl bg-lime-100 text-lime-800">
                                                        <TicketPercent className="size-5" />
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-stone-900">
                                                            {promo.name}
                                                        </div>
                                                        <div className="text-xs text-stone-500">
                                                            {labels[
                                                                promo.type
                                                            ] ??
                                                                promo.type}{' '}
                                                            · {promo.channel}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-4 text-xs text-stone-600">
                                                {new Date(
                                                    promo.start_date,
                                                ).toLocaleDateString('id-ID')}
                                                <br />
                                                s.d.{' '}
                                                {new Date(
                                                    promo.end_date,
                                                ).toLocaleDateString('id-ID')}
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="font-semibold">
                                                    {promo.usages_count} kali
                                                </div>
                                                <div className="text-xs text-stone-500">
                                                    {currency.format(
                                                        Number(
                                                            promo.usages_sum_discount_amount_applied ??
                                                                0,
                                                        ),
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${displayStatus === 'active' ? 'bg-emerald-100 text-emerald-700' : displayStatus === 'scheduled' ? 'bg-blue-100 text-blue-700' : displayStatus === 'paused' ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-600'}`}
                                                >
                                                    {displayStatus}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        asChild
                                                    >
                                                        <Link
                                                            href={`/admin/promotions/${promo.id}/edit`}
                                                        >
                                                            <Edit3 className="size-4" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            router.post(
                                                                `/admin/promotions/${promo.id}/duplicate`,
                                                            )
                                                        }
                                                    >
                                                        <Copy className="size-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            router.post(
                                                                `/admin/promotions/${promo.id}/toggle`,
                                                            )
                                                        }
                                                    >
                                                        {promo.status ===
                                                        'active' ? (
                                                            <PauseCircle className="size-4" />
                                                        ) : (
                                                            <PlayCircle className="size-4" />
                                                        )}
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() =>
                                                            confirm(
                                                                `Hapus atau arsipkan ${promo.name}?`,
                                                            ) &&
                                                            router.delete(
                                                                `/admin/promotions/${promo.id}`,
                                                            )
                                                        }
                                                    >
                                                        <Trash2 className="size-4 text-red-600" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {promotions.data.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-6 py-16 text-center text-stone-500"
                                        >
                                            Belum ada campaign yang sesuai
                                            filter.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
function Metric({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="rounded-2xl border bg-white p-5">
            <p className="text-sm text-stone-500">{label}</p>
            <p className="mt-2 text-2xl font-bold text-stone-950">{value}</p>
        </div>
    );
}
