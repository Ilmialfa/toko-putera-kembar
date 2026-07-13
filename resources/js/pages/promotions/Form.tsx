import { Head, useForm } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import AdminLayout from '@/layouts/AdminLayout';
import * as promotionRoutes from '@/routes/admin/promotions';

interface PromotionFormData {
    store_id: number;
    name: string;
    type: string;
    start_date: string;
    end_date: string;
    channel: string;
    is_active: boolean;
    is_stackable: boolean;
    priority: number;
    usage_limit_total: string;
    usage_limit_per_customer: string;
    min_purchase_amount: string;
    applicable_scope: string;
    conditions: Array<{
        conditionable_type: string;
        conditionable_id: string;
        min_qty: string;
    }>;
    rewards: Array<{ reward_type: string; value: number }>;
    vouchers: Array<{ code: string }>;
}

export default function PromotionsForm() {
    const { auth } = usePage<any>().props;

    const { data, setData, post, processing, errors } =
        useForm<PromotionFormData>({
            store_id: auth.user.store_id,
            name: '',
            type: 'discount_item',
            start_date: '',
            end_date: '',
            channel: 'both',
            is_active: true,
            is_stackable: false,
            priority: 0,
            usage_limit_total: '',
            usage_limit_per_customer: '',
            min_purchase_amount: '',
            applicable_scope: 'all',

            // Simplified for this MVP form
            conditions: [],
            rewards: [{ reward_type: 'percent_discount', value: 0 }],
            vouchers: [],
        });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(promotionRoutes.store.url(), {
            onSuccess: () => {
                toast.success('Promosi berhasil dibuat');
            },
        });
    };

    return (
        <AdminLayout>
            <Head title="Create Promotion" />
            <div className="mx-auto flex max-w-4xl flex-col gap-6 p-6">
                <div>
                    <h1 className="text-2xl font-bold">Create Promotion</h1>
                    <p className="text-muted-foreground">
                        Setup a new discount or voucher.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="space-y-6 rounded-md border bg-white p-6"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Name</Label>
                            <Input
                                value={data.name}
                                onChange={(e) =>
                                    setData('name', e.target.value)
                                }
                                placeholder="e.g. Summer Sale 2026"
                            />
                            {errors.name && (
                                <p className="text-sm text-red-500">
                                    {errors.name}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select
                                value={data.type}
                                onValueChange={(v) => setData('type', v)}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="discount_item">
                                        Item Discount
                                    </SelectItem>
                                    <SelectItem value="discount_category">
                                        Category Discount
                                    </SelectItem>
                                    <SelectItem value="voucher">
                                        Voucher Code
                                    </SelectItem>
                                    <SelectItem value="loyalty_point">
                                        Loyalty Point Multiplier
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input
                                type="datetime-local"
                                value={data.start_date}
                                onChange={(e) =>
                                    setData('start_date', e.target.value)
                                }
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Input
                                type="datetime-local"
                                value={data.end_date}
                                onChange={(e) =>
                                    setData('end_date', e.target.value)
                                }
                            />
                        </div>
                    </div>

                    {data.type === 'voucher' && (
                        <div className="space-y-2 border-t pt-4">
                            <Label>Voucher Code</Label>
                            <Input
                                placeholder="e.g. SUMMER26"
                                onChange={(e) =>
                                    setData('vouchers', [
                                        { code: e.target.value.toUpperCase() },
                                    ])
                                }
                            />
                        </div>
                    )}

                    <div className="space-y-4 border-t pt-4">
                        <h3 className="font-medium">Reward Setup</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Reward Type</Label>
                                <Select
                                    value={data.rewards[0].reward_type}
                                    onValueChange={(v) =>
                                        setData('rewards', [
                                            {
                                                ...data.rewards[0],
                                                reward_type: v,
                                            },
                                        ])
                                    }
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percent_discount">
                                            Percentage Discount (%)
                                        </SelectItem>
                                        <SelectItem value="fixed_discount">
                                            Fixed Amount (Rp)
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Value</Label>
                                <Input
                                    type="number"
                                    value={data.rewards[0].value}
                                    onChange={(e) =>
                                        setData('rewards', [
                                            {
                                                ...data.rewards[0],
                                                value: Number(e.target.value),
                                            },
                                        ])
                                    }
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end border-t pt-4">
                        <Button type="submit" disabled={processing}>
                            Save Promotion
                        </Button>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}
