import { Link, useForm } from '@inertiajs/react';
import { Plus, Sparkles, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AdminLayout from '@/layouts/AdminLayout';

type Option = { id: number; name: string; sku?: string };
type Condition = {
    conditionable_type: string;
    conditionable_id: string | number;
    min_qty: string | number;
};
type Reward = {
    reward_type: string;
    value: string | number;
    free_product_id: string | number;
    free_product_qty: string | number;
};
type Voucher = { code: string; max_uses: string | number; expires_at: string };

const selectClass =
    'h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-lime-500 focus:ring-4 focus:ring-lime-500/10';
const promotionTypes: Record<string, string> = {
    discount_item: 'Diskon item',
    discount_category: 'Diskon kategori',
    voucher: 'Voucher / kode promo',
    bundling: 'Paket bundling',
    bxgy: 'Beli X Gratis Y',
    cashback: 'Cashback',
    loyalty_point: 'Pengali loyalty point',
};

export default function PromotionForm({
    promotion,
    store,
    products,
    categories,
    brands,
    customerGroups,
}: {
    promotion?: Record<string, any>;
    store: Option;
    products: Option[];
    categories: Option[];
    brands: Option[];
    customerGroups: Option[];
}) {
    const isEditing = Boolean(promotion);
    const form = useForm({
        _method: isEditing ? 'put' : 'post',
        store_id: store.id,
        name: promotion?.name ?? '',
        description: promotion?.description ?? '',
        type: promotion?.type ?? 'discount_item',
        status: promotion?.status ?? 'active',
        start_date: promotion?.start_date?.slice(0, 16) ?? '',
        end_date: promotion?.end_date?.slice(0, 16) ?? '',
        channel: promotion?.channel ?? 'both',
        customer_group_id: promotion?.customer_group_id ?? '',
        is_stackable: promotion?.is_stackable ?? false,
        exclusive_group: promotion?.exclusive_group ?? '',
        priority: promotion?.priority ?? 0,
        usage_limit_total: promotion?.usage_limit_total ?? '',
        usage_limit_per_customer: promotion?.usage_limit_per_customer ?? '',
        min_purchase_amount: promotion?.min_purchase_amount ?? '',
        max_discount_amount: promotion?.max_discount_amount ?? '',
        applicable_scope: promotion?.applicable_scope ?? 'all',
        conditions: (promotion?.conditions?.map(
            (condition: Record<string, any>) => ({
                conditionable_type: condition.conditionable_type,
                conditionable_id: condition.conditionable_id,
                min_qty: condition.min_qty ?? 1,
            }),
        ) ?? []) as Condition[],
        rewards: (promotion?.rewards?.map((reward: Record<string, any>) => ({
            reward_type: reward.reward_type,
            value: reward.value,
            free_product_id: reward.free_product_id ?? '',
            free_product_qty: reward.free_product_qty ?? 1,
        })) ?? [
            {
                reward_type: 'percent_discount',
                value: 10,
                free_product_id: '',
                free_product_qty: 1,
            },
        ]) as Reward[],
        vouchers: (promotion?.vouchers?.map((voucher: Record<string, any>) => ({
            code: voucher.code,
            max_uses: voucher.max_uses ?? '',
            expires_at: voucher.expires_at?.slice(0, 16) ?? '',
        })) ?? []) as Voucher[],
        voucher_quantity: '',
        voucher_prefix: 'PK',
    });
    const submit = (event: FormEvent) => {
        event.preventDefault();
        form.post(
            isEditing
                ? `/admin/promotions/${promotion?.id}`
                : '/admin/promotions',
        );
    };
    const scopeOptions =
        form.data.applicable_scope === 'product'
            ? products
            : form.data.applicable_scope === 'category'
              ? categories
              : form.data.applicable_scope === 'brand'
                ? brands
                : [];
    const setType = (type: string) => {
        const scope =
            type === 'discount_category'
                ? 'category'
                : ['bundling', 'bxgy', 'discount_item'].includes(type)
                  ? 'product'
                  : form.data.applicable_scope;
        form.setData((data) => ({
            ...data,
            type,
            applicable_scope: scope,
            conditions: scope === 'all' ? [] : data.conditions,
        }));
    };
    const error = (key: string) => (form.errors as Record<string, string>)[key];

    return (
        <AdminLayout title={isEditing ? 'Edit Promosi' : 'Promosi Baru'}>
            <form
                onSubmit={submit}
                className="mx-auto max-w-7xl space-y-6 p-4 pb-24 md:p-8"
            >
                <header className="flex flex-col justify-between gap-4 rounded-2xl bg-stone-950 p-6 text-white md:flex-row md:items-center">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-400 uppercase">
                            Campaign builder
                        </p>
                        <h2 className="mt-1 text-2xl font-bold">
                            {isEditing
                                ? `Edit ${promotion?.name}`
                                : 'Buat promosi baru'}
                        </h2>
                        <p className="mt-1 text-sm text-stone-400">
                            Satu engine untuk POS dan website, lengkap dengan
                            limit dan stacking.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="border-stone-700 bg-transparent text-white"
                            asChild
                        >
                            <Link href="/admin/promotions">Batal</Link>
                        </Button>
                        <Button
                            disabled={form.processing}
                            className="bg-lime-400 text-stone-950 hover:bg-lime-300"
                        >
                            <Sparkles className="mr-2 size-4" />
                            Simpan campaign
                        </Button>
                    </div>
                </header>
                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <section className="space-y-5 rounded-2xl border bg-white p-6">
                        <Title
                            title="Identitas campaign"
                            description="Nama, tipe, periode, dan target channel."
                        />
                        <Field label="Nama promosi" error={error('name')}>
                            <Input
                                value={form.data.name}
                                onChange={(e) =>
                                    form.setData('name', e.target.value)
                                }
                            />
                        </Field>
                        <Field label="Deskripsi internal">
                            <Textarea
                                rows={3}
                                value={form.data.description}
                                onChange={(e) =>
                                    form.setData('description', e.target.value)
                                }
                            />
                        </Field>
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Tipe promosi">
                                <select
                                    className={selectClass}
                                    value={form.data.type}
                                    onChange={(e) => setType(e.target.value)}
                                >
                                    {Object.entries(promotionTypes).map(
                                        ([value, label]) => (
                                            <option key={value} value={value}>
                                                {label}
                                            </option>
                                        ),
                                    )}
                                </select>
                            </Field>
                            <Field label="Status">
                                <select
                                    className={selectClass}
                                    value={form.data.status}
                                    onChange={(e) =>
                                        form.setData('status', e.target.value)
                                    }
                                >
                                    <option value="draft">Draft</option>
                                    <option value="active">
                                        Aktif / terjadwal
                                    </option>
                                    <option value="paused">Dijeda</option>
                                    <option value="archived">Diarsipkan</option>
                                </select>
                            </Field>
                            <Field label="Mulai">
                                <Input
                                    type="datetime-local"
                                    value={form.data.start_date}
                                    onChange={(e) =>
                                        form.setData(
                                            'start_date',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field label="Selesai">
                                <Input
                                    type="datetime-local"
                                    value={form.data.end_date}
                                    onChange={(e) =>
                                        form.setData('end_date', e.target.value)
                                    }
                                />
                            </Field>
                            <Field label="Channel">
                                <select
                                    className={selectClass}
                                    value={form.data.channel}
                                    onChange={(e) =>
                                        form.setData('channel', e.target.value)
                                    }
                                >
                                    <option value="both">POS & Online</option>
                                    <option value="pos">POS</option>
                                    <option value="online">Online</option>
                                </select>
                            </Field>
                            <Field label="Segmen pelanggan">
                                <select
                                    className={selectClass}
                                    value={form.data.customer_group_id}
                                    onChange={(e) =>
                                        form.setData(
                                            'customer_group_id',
                                            e.target.value,
                                        )
                                    }
                                >
                                    <option value="">Semua pelanggan</option>
                                    {customerGroups.map((group) => (
                                        <option key={group.id} value={group.id}>
                                            {group.name}
                                        </option>
                                    ))}
                                </select>
                            </Field>
                        </div>
                    </section>
                    <section className="space-y-5 rounded-2xl border bg-white p-6">
                        <Title
                            title="Aturan penggunaan"
                            description="Kontrol budget dan konflik antar-campaign."
                        />
                        <div className="grid gap-4 md:grid-cols-2">
                            <Field label="Prioritas">
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.data.priority}
                                    onChange={(e) =>
                                        form.setData(
                                            'priority',
                                            Number(e.target.value),
                                        )
                                    }
                                />
                            </Field>
                            <Field label="Grup eksklusif">
                                <Input
                                    value={form.data.exclusive_group}
                                    onChange={(e) =>
                                        form.setData(
                                            'exclusive_group',
                                            e.target.value,
                                        )
                                    }
                                    placeholder="contoh: ramadan"
                                />
                            </Field>
                            <Field label="Min. belanja">
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.data.min_purchase_amount}
                                    onChange={(e) =>
                                        form.setData(
                                            'min_purchase_amount',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field label="Maks. diskon">
                                <Input
                                    type="number"
                                    min="0"
                                    value={form.data.max_discount_amount}
                                    onChange={(e) =>
                                        form.setData(
                                            'max_discount_amount',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field label="Limit total">
                                <Input
                                    type="number"
                                    min="1"
                                    value={form.data.usage_limit_total}
                                    onChange={(e) =>
                                        form.setData(
                                            'usage_limit_total',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <Field label="Limit per pelanggan">
                                <Input
                                    type="number"
                                    min="1"
                                    value={form.data.usage_limit_per_customer}
                                    onChange={(e) =>
                                        form.setData(
                                            'usage_limit_per_customer',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                        </div>
                        <label className="flex items-center justify-between rounded-xl border p-3 text-sm font-medium">
                            <span>Boleh digabung dengan promo lain</span>
                            <input
                                type="checkbox"
                                className="size-4 accent-lime-600"
                                checked={form.data.is_stackable}
                                onChange={(e) =>
                                    form.setData(
                                        'is_stackable',
                                        e.target.checked,
                                    )
                                }
                            />
                        </label>
                    </section>
                </div>
                <section className="rounded-2xl border bg-white p-6">
                    <div className="flex flex-col justify-between gap-4 md:flex-row">
                        <Title
                            title="Produk yang memenuhi syarat"
                            description="Pilih scope dan qty minimum untuk setiap kondisi."
                        />
                        <div className="flex gap-2">
                            <select
                                className={selectClass}
                                value={form.data.applicable_scope}
                                onChange={(e) =>
                                    form.setData(
                                        'applicable_scope',
                                        e.target.value,
                                    )
                                }
                            >
                                <option value="all">Semua produk</option>
                                <option value="product">Produk tertentu</option>
                                <option value="category">Kategori</option>
                                <option value="brand">Merek</option>
                            </select>
                            {form.data.applicable_scope !== 'all' && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() =>
                                        form.setData('conditions', [
                                            ...form.data.conditions,
                                            {
                                                conditionable_type:
                                                    form.data.applicable_scope,
                                                conditionable_id: '',
                                                min_qty: 1,
                                            },
                                        ])
                                    }
                                >
                                    <Plus className="size-4" />
                                </Button>
                            )}
                        </div>
                    </div>
                    <div className="mt-5 space-y-3">
                        {form.data.conditions.map((condition, index) => (
                            <div
                                key={index}
                                className="grid gap-3 rounded-xl bg-stone-50 p-4 md:grid-cols-[1fr_180px_auto]"
                            >
                                <select
                                    className={selectClass}
                                    value={condition.conditionable_id}
                                    onChange={(e) => {
                                        const rows = [...form.data.conditions];
                                        rows[index] = {
                                            ...condition,
                                            conditionable_type:
                                                form.data.applicable_scope,
                                            conditionable_id: e.target.value,
                                        };
                                        form.setData('conditions', rows);
                                    }}
                                >
                                    <option value="">Pilih target</option>
                                    {scopeOptions.map((option) => (
                                        <option
                                            key={option.id}
                                            value={option.id}
                                        >
                                            {option.name}
                                            {option.sku
                                                ? ` — ${option.sku}`
                                                : ''}
                                        </option>
                                    ))}
                                </select>
                                <Input
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={condition.min_qty}
                                    onChange={(e) => {
                                        const rows = [...form.data.conditions];
                                        rows[index] = {
                                            ...condition,
                                            min_qty: e.target.value,
                                        };
                                        form.setData('conditions', rows);
                                    }}
                                    placeholder="Qty minimum"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        form.setData(
                                            'conditions',
                                            form.data.conditions.filter(
                                                (_, current) =>
                                                    current !== index,
                                            ),
                                        )
                                    }
                                >
                                    <Trash2 className="size-4 text-red-600" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="rounded-2xl border bg-white p-6">
                    <div className="flex justify-between gap-4">
                        <Title
                            title="Benefit pelanggan"
                            description="Diskon, produk gratis, cashback, atau pengali poin."
                        />
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                                form.setData('rewards', [
                                    ...form.data.rewards,
                                    {
                                        reward_type: 'percent_discount',
                                        value: 10,
                                        free_product_id: '',
                                        free_product_qty: 1,
                                    },
                                ])
                            }
                        >
                            <Plus className="mr-2 size-4" />
                            Benefit
                        </Button>
                    </div>
                    <div className="mt-5 space-y-3">
                        {form.data.rewards.map((reward, index) => (
                            <div
                                key={index}
                                className="grid gap-3 rounded-xl bg-stone-50 p-4 md:grid-cols-[1fr_1fr_1fr_1fr_auto]"
                            >
                                <select
                                    className={selectClass}
                                    value={reward.reward_type}
                                    onChange={(e) => {
                                        const rows = [...form.data.rewards];
                                        rows[index] = {
                                            ...reward,
                                            reward_type: e.target.value,
                                        };
                                        form.setData('rewards', rows);
                                    }}
                                >
                                    <option value="percent_discount">
                                        Diskon persen
                                    </option>
                                    <option value="fixed_discount">
                                        Diskon nominal / bundling
                                    </option>
                                    <option value="free_product">
                                        Produk gratis
                                    </option>
                                    <option value="cashback">Cashback</option>
                                    <option value="point_multiplier">
                                        Pengali poin
                                    </option>
                                </select>
                                <Input
                                    type="number"
                                    min="0"
                                    value={reward.value}
                                    onChange={(e) => {
                                        const rows = [...form.data.rewards];
                                        rows[index] = {
                                            ...reward,
                                            value: e.target.value,
                                        };
                                        form.setData('rewards', rows);
                                    }}
                                    placeholder="Nilai"
                                />
                                <select
                                    className={selectClass}
                                    value={reward.free_product_id}
                                    onChange={(e) => {
                                        const rows = [...form.data.rewards];
                                        rows[index] = {
                                            ...reward,
                                            free_product_id: e.target.value,
                                        };
                                        form.setData('rewards', rows);
                                    }}
                                >
                                    <option value="">
                                        Produk gratis (opsional)
                                    </option>
                                    {products.map((product) => (
                                        <option
                                            key={product.id}
                                            value={product.id}
                                        >
                                            {product.name}
                                        </option>
                                    ))}
                                </select>
                                <Input
                                    type="number"
                                    min="0.001"
                                    step="0.001"
                                    value={reward.free_product_qty}
                                    onChange={(e) => {
                                        const rows = [...form.data.rewards];
                                        rows[index] = {
                                            ...reward,
                                            free_product_qty: e.target.value,
                                        };
                                        form.setData('rewards', rows);
                                    }}
                                    placeholder="Qty gratis"
                                />
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                        form.setData(
                                            'rewards',
                                            form.data.rewards.filter(
                                                (_, current) =>
                                                    current !== index,
                                            ),
                                        )
                                    }
                                >
                                    <Trash2 className="size-4 text-red-600" />
                                </Button>
                            </div>
                        ))}
                    </div>
                </section>
                {form.data.type === 'voucher' && (
                    <section className="rounded-2xl border bg-white p-6">
                        <Title
                            title="Kode voucher"
                            description="Buat kode manual atau generate hingga 1.000 kode unik."
                        />
                        <div className="mt-5 grid gap-4 md:grid-cols-3">
                            <Field label="Prefix massal">
                                <Input
                                    value={form.data.voucher_prefix}
                                    onChange={(e) =>
                                        form.setData(
                                            'voucher_prefix',
                                            e.target.value.toUpperCase(),
                                        )
                                    }
                                />
                            </Field>
                            <Field label="Jumlah kode">
                                <Input
                                    type="number"
                                    min="0"
                                    max="1000"
                                    value={form.data.voucher_quantity}
                                    onChange={(e) =>
                                        form.setData(
                                            'voucher_quantity',
                                            e.target.value,
                                        )
                                    }
                                />
                            </Field>
                            <div className="flex items-end">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() =>
                                        form.setData('vouchers', [
                                            ...form.data.vouchers,
                                            {
                                                code: '',
                                                max_uses: '',
                                                expires_at: '',
                                            },
                                        ])
                                    }
                                >
                                    <Plus className="mr-2 size-4" />
                                    Kode manual
                                </Button>
                            </div>
                        </div>
                        <div className="mt-4 space-y-3">
                            {form.data.vouchers.map((voucher, index) => (
                                <div
                                    key={index}
                                    className="grid gap-3 rounded-xl bg-stone-50 p-4 md:grid-cols-[1fr_180px_1fr_auto]"
                                >
                                    <Input
                                        value={voucher.code}
                                        onChange={(e) => {
                                            const rows = [
                                                ...form.data.vouchers,
                                            ];
                                            rows[index] = {
                                                ...voucher,
                                                code: e.target.value.toUpperCase(),
                                            };
                                            form.setData('vouchers', rows);
                                        }}
                                        placeholder="HEMAT10"
                                    />
                                    <Input
                                        type="number"
                                        min="1"
                                        value={voucher.max_uses}
                                        onChange={(e) => {
                                            const rows = [
                                                ...form.data.vouchers,
                                            ];
                                            rows[index] = {
                                                ...voucher,
                                                max_uses: e.target.value,
                                            };
                                            form.setData('vouchers', rows);
                                        }}
                                        placeholder="Maks. penggunaan"
                                    />
                                    <Input
                                        type="datetime-local"
                                        value={voucher.expires_at}
                                        onChange={(e) => {
                                            const rows = [
                                                ...form.data.vouchers,
                                            ];
                                            rows[index] = {
                                                ...voucher,
                                                expires_at: e.target.value,
                                            };
                                            form.setData('vouchers', rows);
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() =>
                                            form.setData(
                                                'vouchers',
                                                form.data.vouchers.filter(
                                                    (_, current) =>
                                                        current !== index,
                                                ),
                                            )
                                        }
                                    >
                                        <Trash2 className="size-4 text-red-600" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                {Object.keys(form.errors).length > 0 && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        Periksa kembali data campaign.{' '}
                        {Object.values(form.errors)[0]}
                    </div>
                )}
            </form>
        </AdminLayout>
    );
}

function Title({ title, description }: { title: string; description: string }) {
    return (
        <div>
            <h3 className="text-lg font-bold text-stone-950">{title}</h3>
            <p className="mt-1 text-sm text-stone-500">{description}</p>
        </div>
    );
}
function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label>{label}</Label>
            {children}
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}
