import { Link, useForm } from '@inertiajs/react';
import { Check, Coins, Save, ShieldCheck, Sparkles } from 'lucide-react';
import FormattedNumberInput from '@/components/formatted-number-input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AdminLayout from '@/layouts/AdminLayout';
import { formatCurrency, formatNumber } from '@/lib/utils';

type LoyaltySettings = {
    enabled: boolean;
    earn_spend_amount: number;
    earn_points: number;
    redeem_value: number;
    redeem_min_points: number;
    redeem_max_points: number;
    redeem_max_percentage: number;
    expiry_months: number;
};

export default function LoyaltySettingsPage({
    settings,
}: {
    settings: LoyaltySettings;
}) {
    const form = useForm<LoyaltySettings>(settings);
    const maximumDiscount =
        form.data.redeem_max_points * form.data.redeem_value;

    return (
        <AdminLayout title="Aturan Poin Pelanggan">
            <form
                onSubmit={(event) => {
                    event.preventDefault();
                    form.put('/admin/promotions/loyalty-settings');
                }}
                className="mx-auto max-w-5xl space-y-5 p-4 pb-24 md:p-8"
            >
                <header className="flex flex-col justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-6 md:flex-row md:items-center">
                    <div>
                        <p className="text-xs font-bold tracking-[0.18em] text-lime-600 uppercase">
                            Loyalitas pelanggan
                        </p>
                        <h1 className="mt-1 text-2xl font-bold text-stone-900">
                            Aturan poin yang mudah dipahami
                        </h1>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
                            Atur cara pelanggan mendapat dan memakai poin.
                            Sistem menghitung nilai rupiah, saldo, serta
                            batasnya secara otomatis saat kasir checkout.
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button type="button" variant="outline" asChild>
                            <Link href="/admin/promotions">Kembali</Link>
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            <Save className="size-4" />
                            {form.processing ? 'Menyimpan…' : 'Simpan aturan'}
                        </Button>
                    </div>
                </header>

                <section className="grid gap-4 md:grid-cols-3">
                    <Summary
                        icon={Sparkles}
                        label="Cara mendapat poin"
                        value={`${formatNumber(form.data.earn_points)} poin`}
                        description={`setiap belanja ${formatCurrency(form.data.earn_spend_amount)}`}
                    />
                    <Summary
                        icon={Coins}
                        label="Nilai satu poin"
                        value={formatCurrency(form.data.redeem_value)}
                        description="potongan saat dibayar di kasir"
                    />
                    <Summary
                        icon={ShieldCheck}
                        label="Batas potongan"
                        value={`${formatNumber(form.data.redeem_max_percentage)}% tagihan`}
                        description={`maks. ${formatCurrency(maximumDiscount)} per transaksi`}
                    />
                </section>

                <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
                    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border border-lime-200 bg-lime-50 p-4">
                        <span>
                            <span className="block font-bold text-stone-900">
                                Program poin aktif
                            </span>
                            <span className="mt-1 block text-sm leading-5 text-stone-600">
                                Jika dimatikan, pelanggan tidak mendapat atau
                                memakai poin baru. Saldo lama tetap aman.
                            </span>
                        </span>
                        <input
                            type="checkbox"
                            checked={form.data.enabled}
                            onChange={(event) =>
                                form.setData('enabled', event.target.checked)
                            }
                            className="mt-1 size-5 accent-lime-600"
                        />
                    </label>
                </section>

                <div className="grid gap-5 lg:grid-cols-2">
                    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
                        <div className="mb-5">
                            <h2 className="font-bold text-stone-900">
                                Pelanggan mendapat poin
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-stone-500">
                                Contoh: belanja Rp10.000 mendapat 1 poin.
                            </p>
                        </div>
                        <div className="grid gap-5">
                            <NumberField
                                id="earn-spend-amount"
                                label="Setiap nilai belanja"
                                hint="Total belanja yang diperlukan sebelum poin diberikan."
                                value={form.data.earn_spend_amount}
                                onValueChange={(value) =>
                                    form.setData('earn_spend_amount', value)
                                }
                                prefix="Rp"
                                error={form.errors.earn_spend_amount}
                            />
                            <NumberField
                                id="earn-points"
                                label="Poin yang diberikan"
                                hint="Jumlah poin untuk setiap nilai belanja di atas."
                                value={form.data.earn_points}
                                onValueChange={(value) =>
                                    form.setData('earn_points', value)
                                }
                                error={form.errors.earn_points}
                            />
                            <NumberField
                                id="expiry-months"
                                label="Masa berlaku poin (bulan)"
                                hint="Poin kedaluwarsa otomatis setelah periode ini."
                                value={form.data.expiry_months}
                                onValueChange={(value) =>
                                    form.setData('expiry_months', value)
                                }
                                error={form.errors.expiry_months}
                            />
                        </div>
                    </section>

                    <section className="rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
                        <div className="mb-5">
                            <h2 className="font-bold text-stone-900">
                                Pelanggan memakai poin
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-stone-500">
                                Batas ini melindungi margin toko dan mencegah
                                penukaran saldo berlebihan.
                            </p>
                        </div>
                        <div className="grid gap-5">
                            <NumberField
                                id="redeem-value"
                                label="Nilai satu poin"
                                hint="Potongan rupiah untuk setiap 1 poin yang digunakan."
                                value={form.data.redeem_value}
                                onValueChange={(value) =>
                                    form.setData('redeem_value', value)
                                }
                                prefix="Rp"
                                error={form.errors.redeem_value}
                            />
                            <div className="grid gap-5 sm:grid-cols-2">
                                <NumberField
                                    id="redeem-min-points"
                                    label="Minimal poin dipakai"
                                    hint="Misalnya 50 poin."
                                    value={form.data.redeem_min_points}
                                    onValueChange={(value) =>
                                        form.setData('redeem_min_points', value)
                                    }
                                    error={form.errors.redeem_min_points}
                                />
                                <NumberField
                                    id="redeem-max-points"
                                    label="Maksimal poin per transaksi"
                                    hint="Batas saldo yang boleh dipakai."
                                    value={form.data.redeem_max_points}
                                    onValueChange={(value) =>
                                        form.setData('redeem_max_points', value)
                                    }
                                    error={form.errors.redeem_max_points}
                                />
                            </div>
                            <NumberField
                                id="redeem-max-percentage"
                                label="Maksimal potongan dari total tagihan"
                                hint="Agar poin tidak menutup seluruh tagihan. Rekomendasi 50%."
                                value={form.data.redeem_max_percentage}
                                onValueChange={(value) =>
                                    form.setData('redeem_max_percentage', value)
                                }
                                suffix="%"
                                error={form.errors.redeem_max_percentage}
                            />
                        </div>
                    </section>
                </div>

                <aside className="flex gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-stone-600">
                    <Check className="mt-0.5 size-5 shrink-0 text-lime-700" />
                    <p>
                        Kasir tidak dapat menentukan nilai tukar poin secara
                        manual. Nilai pembayaran selalu dihitung ulang oleh
                        server berdasarkan aturan ini, saldo pelanggan, dan
                        total tagihan.
                    </p>
                </aside>
            </form>
        </AdminLayout>
    );
}

function NumberField({
    id,
    label,
    hint,
    value,
    onValueChange,
    prefix,
    suffix,
    error,
}: {
    id: string;
    label: string;
    hint: string;
    value: number;
    onValueChange: (value: number) => void;
    prefix?: string;
    suffix?: string;
    error?: string;
}) {
    return (
        <div>
            <Label htmlFor={id}>{label}</Label>
            <div className="mt-2 flex items-center gap-2">
                <FormattedNumberInput
                    id={id}
                    value={value}
                    onValueChange={onValueChange}
                    prefix={prefix}
                    className="h-11 bg-white font-semibold"
                    placeholder="0"
                />
                {suffix && (
                    <span className="text-sm font-semibold text-stone-600">
                        {suffix}
                    </span>
                )}
            </div>
            <p className="mt-1.5 text-xs leading-5 text-stone-500">{hint}</p>
            {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
    );
}

function Summary({
    icon: Icon,
    label,
    value,
    description,
}: {
    icon: typeof Sparkles;
    label: string;
    value: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-stone-200 bg-white p-5">
            <Icon className="size-5 text-lime-700" />
            <p className="mt-4 text-sm text-stone-500">{label}</p>
            <p className="mt-1 text-xl font-bold text-stone-900">{value}</p>
            <p className="mt-1 text-xs text-stone-500">{description}</p>
        </div>
    );
}
