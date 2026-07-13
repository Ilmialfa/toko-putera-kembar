import { Head, Link } from '@inertiajs/react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import AdminLayout from '@/layouts/AdminLayout';
import * as promotionRoutes from '@/routes/admin/promotions';

export default function PromotionsIndex({ promotions }: { promotions: any }) {
    return (
        <AdminLayout>
            <Head title="Promotions" />

            <div className="flex flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">
                            Promotions & Loyalty
                        </h1>
                        <p className="text-muted-foreground">
                            Manage active promotions, discounts, and vouchers.
                        </p>
                    </div>
                    <Button asChild>
                        <Link href={promotionRoutes.create.url()}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Promotion
                        </Link>
                    </Button>
                </div>

                <div className="rounded-md border">
                    <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted text-muted-foreground">
                            <tr>
                                <th className="px-4 py-3 font-medium">Name</th>
                                <th className="px-4 py-3 font-medium">Type</th>
                                <th className="px-4 py-3 font-medium">Scope</th>
                                <th className="px-4 py-3 font-medium">
                                    Start Date
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    End Date
                                </th>
                                <th className="px-4 py-3 font-medium">
                                    Status
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {promotions.data.map((promo: any) => (
                                <tr
                                    key={promo.id}
                                    className="border-b last:border-0 hover:bg-muted/50"
                                >
                                    <td className="px-4 py-3 font-medium">
                                        {promo.name}
                                    </td>
                                    <td className="px-4 py-3">{promo.type}</td>
                                    <td className="px-4 py-3">
                                        {promo.applicable_scope}
                                    </td>
                                    <td className="px-4 py-3">
                                        {format(
                                            new Date(promo.start_date),
                                            'dd MMM yyyy',
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {format(
                                            new Date(promo.end_date),
                                            'dd MMM yyyy',
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${promo.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                        >
                                            {promo.is_active
                                                ? 'Active'
                                                : 'Inactive'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {promotions.data.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-4 py-8 text-center text-muted-foreground"
                                    >
                                        No promotions found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </AdminLayout>
    );
}
