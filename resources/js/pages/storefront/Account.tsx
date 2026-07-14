import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    ChevronRight,
    ClipboardList,
    Home,
    MapPin,
    Pencil,
    Plus,
    Star,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';

import StorefrontLayout from '@/layouts/StorefrontLayout';

const money = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

export default function Account({
    customer,
    orders,
    addresses,
    points,
    pointBalance,
}: any) {
    const [activeTab, setActiveTab] = useState<
        'orders' | 'addresses' | 'profile' | 'points'
    >('orders');
    const [showAddressForm, setShowAddressForm] = useState(false);
    const [editingAddress, setEditingAddress] = useState<any>(null);
    const profile = useForm({
        name: customer.name ?? '',
        phone: customer.phone ?? '',
        email: customer.email ?? '',
    });
    const address = useForm({
        label: '',
        recipient_name: customer.name ?? '',
        phone: customer.phone ?? '',
        full_address: '',
        latitude: '',
        longitude: '',
        is_default: addresses.length === 0,
    });

    const resetAddressForm = () => {
        address.reset();
        address.setData({
            label: '',
            recipient_name: customer.name ?? '',
            phone: customer.phone ?? '',
            full_address: '',
            latitude: '',
            longitude: '',
            is_default: addresses.length === 0,
        });
        setEditingAddress(null);
        setShowAddressForm(false);
    };

    const submitAddress = () => {
        const request = editingAddress
            ? address.put(`/akun/alamat/${editingAddress.id}`, {
                  preserveScroll: true,
                  onSuccess: resetAddressForm,
              })
            : address.post('/akun/alamat', {
                  preserveScroll: true,
                  onSuccess: resetAddressForm,
              });

        return request;
    };

    const editAddress = (item: any) => {
        setEditingAddress(item);
        address.setData({
            label: item.label,
            recipient_name: item.recipient_name,
            phone: item.phone,
            full_address: item.full_address,
            latitude: item.latitude ?? '',
            longitude: item.longitude ?? '',
            is_default: item.is_default,
        });
        setShowAddressForm(true);
    };

    return (
        <StorefrontLayout title="Akun Pelanggan">
            <Head>
                <meta
                    name="description"
                    content="Kelola profil, alamat, poin, dan pesanan Anda."
                />
            </Head>
            <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
                <section className="relative overflow-hidden rounded-3xl border border-stone-200 bg-white p-6 sm:p-8">
                    <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-16 -right-12 size-48 rounded-full border border-lime-200"
                    />
                    <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
                        <div className="flex items-center gap-4">
                            <span className="grid size-14 place-items-center rounded-2xl bg-lime-300 text-stone-950">
                                <UserRound className="size-6" />
                            </span>
                            <div>
                                <p className="text-xs font-bold tracking-[0.14em] text-lime-800 uppercase">
                                    Akun pelanggan
                                </p>
                                <h1 className="mt-1 text-2xl font-black">
                                    Halo, {customer.name.split(' ')[0]}
                                </h1>
                                <p className="mt-1 text-sm text-stone-600">
                                    {customer.group?.name ??
                                        'Member Putera Kembar'}
                                </p>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-lime-200 bg-white px-4 py-3">
                            <p className="text-xs text-stone-500">
                                Poin tersedia
                            </p>
                            <p className="mt-1 text-xl font-black text-lime-700">
                                {pointBalance.toLocaleString('id-ID')} poin
                            </p>
                        </div>
                    </div>
                </section>
                <div className="mt-6 flex gap-2 overflow-x-auto border-b border-stone-200 pb-2">
                    {(
                        [
                            ['orders', 'Pesanan', ClipboardList],
                            ['addresses', 'Alamat', MapPin],
                            ['points', 'Poin', Star],
                            ['profile', 'Profil', UserRound],
                        ] as const
                    ).map(([id, label, Icon]) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id)}
                            className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold ${activeTab === id ? 'bg-lime-300 text-stone-950' : 'text-stone-500 hover:bg-stone-100'}`}
                        >
                            <Icon className="size-4" />
                            {label}
                        </button>
                    ))}
                </div>
                {activeTab === 'orders' && (
                    <section className="mt-6">
                        {orders.data.length > 0 ? (
                            <div className="grid gap-3">
                                {orders.data.map((order: any) => (
                                    <Link
                                        key={order.id}
                                        href={`/akun/pesanan/${order.id}`}
                                        className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 transition hover:border-lime-300"
                                    >
                                        <div>
                                            <p className="font-black">
                                                {order.order_number}
                                            </p>
                                            <p className="mt-1 text-xs text-stone-500">
                                                {new Date(
                                                    order.created_at,
                                                ).toLocaleDateString('id-ID', {
                                                    day: 'numeric',
                                                    month: 'long',
                                                    year: 'numeric',
                                                })}{' '}
                                                · {order.items_count} item
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="rounded-full bg-lime-50 px-2.5 py-1 text-xs font-bold text-lime-800">
                                                    {order.status.replaceAll(
                                                        '_',
                                                        ' ',
                                                    )}
                                                </p>
                                                <p className="mt-2 text-sm font-black">
                                                    {money.format(
                                                        Number(
                                                            order.total_amount,
                                                        ),
                                                    )}
                                                </p>
                                            </div>
                                            <ChevronRight className="size-5 text-stone-400" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        ) : (
                            <Empty
                                icon={ClipboardList}
                                title="Belum ada pesanan"
                                text="Pesanan online Anda akan muncul di sini."
                                actionHref="/katalog"
                                action="Mulai belanja"
                            />
                        )}
                    </section>
                )}
                {activeTab === 'addresses' && (
                    <section className="mt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-black">
                                    Alamat tersimpan
                                </h2>
                                <p className="mt-1 text-sm text-stone-500">
                                    Pilih alamat utama untuk mempercepat
                                    checkout.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    if (showAddressForm) {
                                        resetAddressForm();
                                    } else {
                                        setShowAddressForm(true);
                                    }
                                }}
                                className="inline-flex items-center gap-2 rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-bold"
                            >
                                <Plus className="size-4" />
                                Tambah
                            </button>
                        </div>
                        {showAddressForm && (
                            <form
                                onSubmit={(event) => {
                                    event.preventDefault();
                                    submitAddress();
                                }}
                                className="mt-5 grid gap-3 rounded-2xl border border-stone-200 bg-stone-50 p-5 sm:grid-cols-2"
                            >
                                <Input
                                    label="Label alamat"
                                    value={address.data.label}
                                    onChange={(value) =>
                                        address.setData('label', value)
                                    }
                                />
                                <Input
                                    label="Penerima"
                                    value={address.data.recipient_name}
                                    onChange={(value) =>
                                        address.setData('recipient_name', value)
                                    }
                                />
                                <Input
                                    label="Nomor HP"
                                    value={address.data.phone}
                                    onChange={(value) =>
                                        address.setData('phone', value)
                                    }
                                />
                                <label className="flex items-end gap-2 pb-2 text-sm font-semibold">
                                    <input
                                        type="checkbox"
                                        checked={address.data.is_default}
                                        onChange={(event) =>
                                            address.setData(
                                                'is_default',
                                                event.target.checked,
                                            )
                                        }
                                    />
                                    Jadikan alamat utama
                                </label>
                                <label className="sm:col-span-2">
                                    <span className="text-sm font-semibold">
                                        Alamat lengkap
                                    </span>
                                    <textarea
                                        value={address.data.full_address}
                                        onChange={(event) =>
                                            address.setData(
                                                'full_address',
                                                event.target.value,
                                            )
                                        }
                                        className="mt-2 min-h-24 w-full rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-lime-400"
                                    />
                                </label>
                                <button
                                    disabled={address.processing}
                                    className="w-fit rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-bold"
                                >
                                    {editingAddress
                                        ? 'Simpan perubahan'
                                        : 'Simpan alamat'}
                                </button>
                            </form>
                        )}
                        <div className="mt-5 grid gap-3">
                            {addresses.length > 0 ? (
                                addresses.map((item: any) => (
                                    <article
                                        key={item.id}
                                        className="rounded-2xl border border-stone-200 bg-white p-5"
                                    >
                                        <div className="flex justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className="font-black">
                                                        {item.label}
                                                    </h3>
                                                    {item.is_default && (
                                                        <span className="rounded-full bg-lime-100 px-2 py-1 text-[11px] font-bold text-lime-800">
                                                            Utama
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="mt-2 text-sm font-semibold">
                                                    {item.recipient_name} ·{' '}
                                                    {item.phone}
                                                </p>
                                                <p className="mt-1 text-sm leading-6 text-stone-600">
                                                    {item.full_address}
                                                </p>
                                            </div>
                                            <MapPin className="size-5 shrink-0 text-lime-700" />
                                        </div>
                                        <div className="mt-4 flex gap-3 text-sm font-bold">
                                            <button
                                                onClick={() =>
                                                    editAddress(item)
                                                }
                                                className="text-stone-700"
                                            >
                                                Ubah
                                            </button>
                                            {!item.is_default && (
                                                <button
                                                    onClick={() =>
                                                        router.put(
                                                            `/akun/alamat/${item.id}/utama`,
                                                        )
                                                    }
                                                    className="text-lime-700"
                                                >
                                                    Jadikan utama
                                                </button>
                                            )}
                                            <button
                                                onClick={() =>
                                                    router.delete(
                                                        `/akun/alamat/${item.id}`,
                                                    )
                                                }
                                                className="text-rose-600"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </article>
                                ))
                            ) : (
                                <Empty
                                    icon={Home}
                                    title="Belum ada alamat"
                                    text="Tambahkan alamat untuk checkout yang lebih cepat."
                                />
                            )}
                        </div>
                    </section>
                )}
                {activeTab === 'points' && (
                    <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5">
                        <h2 className="text-xl font-black">Riwayat poin</h2>
                        <p className="mt-1 text-sm text-stone-500">
                            Poin diberikan dan digunakan sesuai transaksi Anda.
                        </p>
                        <div className="mt-5 divide-y divide-stone-100">
                            {points.length > 0 ? (
                                points.map((point: any) => (
                                    <div
                                        key={point.id}
                                        className="flex items-center justify-between py-4"
                                    >
                                        <div>
                                            <p className="font-bold">
                                                {point.notes ??
                                                    'Aktivitas poin'}
                                            </p>
                                            <p className="mt-1 text-xs text-stone-500">
                                                {new Date(
                                                    point.created_at,
                                                ).toLocaleDateString('id-ID')}
                                            </p>
                                        </div>
                                        <p
                                            className={`font-black ${point.points >= 0 ? 'text-lime-700' : 'text-rose-600'}`}
                                        >
                                            {point.points >= 0 ? '+' : ''}
                                            {point.points}
                                        </p>
                                    </div>
                                ))
                            ) : (
                                <p className="py-8 text-center text-sm text-stone-500">
                                    Belum ada aktivitas poin.
                                </p>
                            )}
                        </div>
                    </section>
                )}
                {activeTab === 'profile' && (
                    <section className="mt-6 rounded-2xl border border-stone-200 bg-white p-5 sm:p-6">
                        <div className="flex items-center gap-3">
                            <Pencil className="size-5 text-lime-700" />
                            <div>
                                <h2 className="text-xl font-black">
                                    Profil pelanggan
                                </h2>
                                <p className="mt-1 text-sm text-stone-500">
                                    Gunakan nomor yang aktif untuk informasi
                                    pesanan.
                                </p>
                            </div>
                        </div>
                        <form
                            onSubmit={(event) => {
                                event.preventDefault();
                                profile.put('/akun/profil', {
                                    preserveScroll: true,
                                });
                            }}
                            className="mt-6 grid gap-4 sm:grid-cols-2"
                        >
                            <Input
                                label="Nama lengkap"
                                value={profile.data.name}
                                onChange={(value) =>
                                    profile.setData('name', value)
                                }
                            />
                            <Input
                                label="Nomor HP"
                                value={profile.data.phone}
                                onChange={(value) =>
                                    profile.setData('phone', value)
                                }
                            />
                            <div className="sm:col-span-2">
                                <Input
                                    label="Email (opsional)"
                                    value={profile.data.email}
                                    onChange={(value) =>
                                        profile.setData('email', value)
                                    }
                                />
                            </div>
                            <button
                                disabled={profile.processing}
                                className="w-fit rounded-xl bg-lime-300 px-4 py-2.5 text-sm font-bold"
                            >
                                Simpan perubahan
                            </button>
                        </form>
                    </section>
                )}
            </main>
        </StorefrontLayout>
    );
}

function Input({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
}) {
    return (
        <label>
            <span className="text-sm font-semibold">{label}</span>
            <input
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm outline-none focus:border-lime-400"
            />
        </label>
    );
}
function Empty({
    icon: Icon,
    title,
    text,
    actionHref,
    action,
}: {
    icon: typeof Home;
    title: string;
    text: string;
    actionHref?: string;
    action?: string;
}) {
    return (
        <div className="mt-5 rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-10 text-center">
            <Icon className="mx-auto size-7 text-lime-700" />
            <h3 className="mt-4 font-black">{title}</h3>
            <p className="mt-1 text-sm text-stone-500">{text}</p>
            {actionHref && (
                <Link
                    href={actionHref}
                    className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-lime-700"
                >
                    {action}
                    <ChevronRight className="size-4" />
                </Link>
            )}
        </div>
    );
}
