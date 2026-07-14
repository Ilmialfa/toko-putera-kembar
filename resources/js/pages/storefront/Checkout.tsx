import { router, usePage } from '@inertiajs/react';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import {
    CreditCard,
    Download,
    MapPin,
    PackageCheck,
    ShieldCheck,
    TicketPercent,
    Store,
    Truck,
    Map as MapIcon,
    UploadCloud,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import { toast } from 'sonner';

import StorefrontLayout from '@/layouts/StorefrontLayout';

const DefaultIcon = L.icon({
    iconUrl,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

function LocationPicker({ position, setPosition }: any) {
    useMapEvents({
        click(e) {
            setPosition([e.latlng.lat, e.latlng.lng]);
        },
    });

    return position ? <Marker position={position} /> : null;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) *
            Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km

    return d;
}

type VoucherPreview = {
    voucher_code: string;
    discount_total: number;
    total: number;
    applied_promotions: Array<{
        name: string;
        amount: number;
        cashback: number;
        voucher_id: number | null;
    }>;
};

export default function Checkout({ store, addresses, items, subtotal }: any) {
    const { auth, errors } = usePage().props as any;
    const [selectedAddressId, setSelectedAddressId] = useState<number | ''>('');
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup'>(
        'delivery',
    );
    const [paymentProof, setPaymentProof] = useState<File | null>(null);
    const [voucherPreview, setVoucherPreview] = useState<VoucherPreview | null>(
        null,
    );
    const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
    const [formData, setFormData] = useState({
        recipient_name: auth.customer?.name || '',
        phone: auth.customer?.phone || '',
        full_address: '',
        payment_method: 'qris', // delivery default = qris
        voucher_code: '',
    });

    const chooseDeliveryMethod = (method: 'delivery' | 'pickup') => {
        setDeliveryMethod(method);
        setFormData((currentFormData) => ({
            ...currentFormData,
            payment_method: method === 'pickup' ? 'cash' : 'qris',
        }));
    };

    const storeLat = store?.latitude ? Number(store.latitude) : -6.2;
    const storeLng = store?.longitude ? Number(store.longitude) : 106.816666;

    const currentDistance = useMemo(() => {
        if (deliveryMethod === 'pickup') {
            return 0;
        }

        if (selectedAddressId && addresses) {
            const addr = addresses.find((a: any) => a.id === selectedAddressId);

            if (addr?.latitude && addr?.longitude) {
                return getDistance(
                    storeLat,
                    storeLng,
                    Number(addr.latitude),
                    Number(addr.longitude),
                );
            }
        } else if (position) {
            return getDistance(storeLat, storeLng, position[0], position[1]);
        }

        return 0;
    }, [
        deliveryMethod,
        selectedAddressId,
        position,
        storeLat,
        storeLng,
        addresses,
    ]);

    const deliveryRadius = Number(store?.delivery_radius_km ?? 3);
    const hasDeliveryLocation = Boolean(selectedAddressId || position);
    const isDistanceValid =
        deliveryMethod === 'pickup' ||
        (hasDeliveryLocation && currentDistance <= deliveryRadius);
    const isSubtotalValid = deliveryMethod === 'pickup' || subtotal >= 150000;
    const totalAfterDiscount = Math.max(
        0,
        subtotal - (voucherPreview?.discount_total ?? 0),
    );

    const applyVoucher = async () => {
        const voucherCode = formData.voucher_code.trim().toUpperCase();

        if (!voucherCode) {
            toast.error('Masukkan kode voucher terlebih dahulu.');

            return;
        }

        setIsApplyingVoucher(true);

        try {
            const csrfToken = document.querySelector<HTMLMetaElement>(
                'meta[name="csrf-token"]',
            )?.content;
            const response = await fetch('/checkout/voucher-preview', {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
                },
                body: JSON.stringify({ voucher_code: voucherCode }),
            });
            const payload = (await response.json().catch(() => null)) as
                VoucherPreview | { message?: string } | null;

            if (!response.ok || !payload || !('voucher_code' in payload)) {
                throw new Error(
                    payload && 'message' in payload
                        ? payload.message
                        : 'Voucher tidak dapat diterapkan.',
                );
            }

            setVoucherPreview(payload);
            setFormData((currentFormData) => ({
                ...currentFormData,
                voucher_code: payload.voucher_code,
            }));
            toast.success(
                'Voucher berhasil diterapkan. Total pesanan diperbarui.',
            );
        } catch (error) {
            setVoucherPreview(null);
            toast.error(
                error instanceof Error
                    ? error.message
                    : 'Voucher tidak dapat diterapkan.',
            );
        } finally {
            setIsApplyingVoucher(false);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const voucherCode = formData.voucher_code.trim().toUpperCase();

        if (voucherCode && voucherPreview?.voucher_code !== voucherCode) {
            toast.error(
                'Terapkan voucher terlebih dahulu sebelum melanjutkan pembayaran.',
            );

            return;
        }

        if (!isDistanceValid) {
            toast.error(
                hasDeliveryLocation
                    ? `Jarak pengiriman melebihi batas ${deliveryRadius} km.`
                    : 'Pilih alamat tersimpan atau tandai lokasi pengiriman di peta.',
            );

            return;
        }

        if (!isSubtotalValid) {
            toast.error('Minimal belanja untuk pengiriman adalah Rp 150.000.');

            return;
        }

        if (
            (formData.payment_method === 'bank_transfer' ||
                formData.payment_method === 'qris') &&
            !paymentProof
        ) {
            toast.error('Mohon unggah bukti pembayaran.');

            return;
        }

        const data: any = {
            delivery_method: deliveryMethod,
            payment_method: formData.payment_method,
            voucher_code: formData.voucher_code || null,
            recipient_name: formData.recipient_name,
            phone: formData.phone,
        };

        if (paymentProof) {
            data.payment_proof = paymentProof;
        }

        if (deliveryMethod === 'delivery') {
            if (selectedAddressId) {
                data.address_id = selectedAddressId;
            } else {
                data.full_address = formData.full_address;

                if (position) {
                    data.latitude = position[0];
                    data.longitude = position[1];
                }
            }
        }

        router.post('/checkout', data, { forceFormData: true });
    };

    return (
        <StorefrontLayout title="Selesaikan Pesanan">
            <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
                <div className="mb-8 rounded-3xl border border-stone-200 bg-white px-6 py-7 text-stone-800 md:px-9">
                    <p className="text-xs font-bold tracking-[0.18em] text-lime-700 uppercase">
                        Pembayaran aman
                    </p>
                    <h1 className="mt-2 text-3xl font-bold tracking-tight">
                        Selesaikan pesanan Anda
                    </h1>
                    <p className="mt-2 max-w-2xl text-sm text-stone-500">
                        Harga dihitung ulang oleh sistem berdasarkan satuan,
                        jumlah, dan promo yang berlaku.
                    </p>
                </div>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 gap-7 lg:grid-cols-[1fr_360px]"
                >
                    <div className="space-y-6">
                        {/* Guest Info — Nama & No. WA */}
                        {!auth.customer && (
                            <div className="rounded-3xl border bg-card p-5 md:p-7">
                                <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
                                    <ShieldCheck className="size-5 text-lime-600" />{' '}
                                    Informasi Pemesan
                                </h2>
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">
                                            Nama Lengkap{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="text"
                                            className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                                            required
                                            placeholder="Nama Anda"
                                            value={formData.recipient_name}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    recipient_name:
                                                        e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-sm font-medium">
                                            No. WhatsApp{' '}
                                            <span className="text-red-500">
                                                *
                                            </span>
                                        </label>
                                        <input
                                            type="tel"
                                            className="h-10 w-full rounded-xl border bg-background px-3 text-sm"
                                            required
                                            placeholder="08xx..."
                                            value={formData.phone}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    phone: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Delivery Method Selection */}
                        <div className="rounded-3xl border bg-card p-5 md:p-7">
                            <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
                                <Truck className="size-5 text-lime-600" />{' '}
                                Metode Pengiriman
                            </h2>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <label
                                    className={`block cursor-pointer rounded-xl border p-4 transition-colors ${
                                        deliveryMethod === 'delivery'
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                            : 'hover:bg-secondary'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="delivery_method"
                                            value="delivery"
                                            checked={
                                                deliveryMethod === 'delivery'
                                            }
                                            onChange={() =>
                                                chooseDeliveryMethod('delivery')
                                            }
                                            className="text-primary focus:ring-primary"
                                        />
                                        <div>
                                            <div className="font-medium">
                                                Pengiriman kurir
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                Pembayaran QRIS. Gratis ongkir
                                                maks {deliveryRadius} km dengan
                                                minimal belanja Rp150.000.
                                            </div>
                                        </div>
                                    </div>
                                </label>
                                <label
                                    className={`block cursor-pointer rounded-xl border p-4 transition-colors ${
                                        deliveryMethod === 'pickup'
                                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                                            : 'hover:bg-secondary'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="delivery_method"
                                            value="pickup"
                                            checked={
                                                deliveryMethod === 'pickup'
                                            }
                                            onChange={() =>
                                                chooseDeliveryMethod('pickup')
                                            }
                                            className="text-primary focus:ring-primary"
                                        />
                                        <div>
                                            <div className="font-medium">
                                                Ambil di Toko (Pickup)
                                            </div>
                                            <div className="mt-1 text-xs text-muted-foreground">
                                                Tanpa minimal belanja dan biaya
                                                pengiriman.
                                            </div>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>

                        {/* Address Selection or Pickup Info */}
                        {deliveryMethod === 'delivery' ? (
                            <div className="rounded-3xl border bg-card p-5 md:p-7">
                                <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
                                    <MapPin className="size-5 text-lime-600" />{' '}
                                    Informasi pengiriman
                                </h2>

                                {addresses && addresses.length > 0 && (
                                    <div className="mb-6 space-y-3">
                                        <h3 className="text-sm font-medium text-muted-foreground">
                                            Pilih Alamat Tersimpan:
                                        </h3>
                                        {addresses.map((addr: any) => (
                                            <label
                                                key={addr.id}
                                                className={`block cursor-pointer rounded-lg border p-4 transition-colors ${
                                                    selectedAddressId ===
                                                    addr.id
                                                        ? 'border-primary bg-primary/5'
                                                        : 'hover:bg-secondary'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <input
                                                        type="radio"
                                                        name="address_id"
                                                        value={addr.id}
                                                        checked={
                                                            selectedAddressId ===
                                                            addr.id
                                                        }
                                                        onChange={() =>
                                                            setSelectedAddressId(
                                                                addr.id,
                                                            )
                                                        }
                                                        className="text-primary focus:ring-primary"
                                                    />
                                                    <div>
                                                        <div className="font-medium">
                                                            {addr.label} -{' '}
                                                            {
                                                                addr.recipient_name
                                                            }{' '}
                                                            ({addr.phone})
                                                        </div>
                                                        <div className="mt-1 text-sm text-muted-foreground">
                                                            {addr.full_address}
                                                        </div>
                                                    </div>
                                                </div>
                                            </label>
                                        ))}

                                        <label
                                            className={`block cursor-pointer rounded-lg border p-4 transition-colors ${
                                                selectedAddressId === ''
                                                    ? 'border-primary bg-primary/5'
                                                    : 'hover:bg-secondary'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="radio"
                                                    name="address_id"
                                                    value=""
                                                    checked={
                                                        selectedAddressId === ''
                                                    }
                                                    onChange={() =>
                                                        setSelectedAddressId('')
                                                    }
                                                    className="text-primary focus:ring-primary"
                                                />
                                                <div className="font-medium">
                                                    Gunakan Alamat Baru
                                                </div>
                                            </div>
                                        </label>
                                    </div>
                                )}

                                {selectedAddressId === '' && (
                                    <div className="space-y-4">
                                        <div className="grid gap-4 sm:grid-cols-2">
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">
                                                    Nama Penerima
                                                </label>
                                                <input
                                                    type="text"
                                                    className="h-10 w-full rounded-md border bg-background px-3"
                                                    required
                                                    value={
                                                        formData.recipient_name
                                                    }
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            recipient_name:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-1 block text-sm font-medium">
                                                    No HP
                                                </label>
                                                <input
                                                    type="text"
                                                    className="h-10 w-full rounded-md border bg-background px-3"
                                                    required
                                                    value={formData.phone}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            phone: e.target
                                                                .value,
                                                        })
                                                    }
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-medium">
                                                Alamat Lengkap
                                            </label>
                                            <textarea
                                                className="min-h-[80px] w-full rounded-md border bg-background p-3"
                                                required
                                                value={formData.full_address}
                                                onChange={(e) =>
                                                    setFormData({
                                                        ...formData,
                                                        full_address:
                                                            e.target.value,
                                                    })
                                                }
                                            ></textarea>
                                        </div>

                                        <div>
                                            <label className="mb-1 block text-sm font-medium">
                                                Tandai Lokasi di Peta (Untuk
                                                Validasi Jarak)
                                            </label>
                                            <div className="relative z-0 h-64 overflow-hidden rounded-md bg-secondary">
                                                <MapContainer
                                                    center={
                                                        store?.latitude &&
                                                        store?.longitude
                                                            ? [
                                                                  Number(
                                                                      store.latitude,
                                                                  ),
                                                                  Number(
                                                                      store.longitude,
                                                                  ),
                                                              ]
                                                            : [-6.2, 106.816666]
                                                    }
                                                    zoom={13}
                                                    style={{
                                                        height: '100%',
                                                        width: '100%',
                                                    }}
                                                >
                                                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                                                    <LocationPicker
                                                        position={position}
                                                        setPosition={
                                                            setPosition
                                                        }
                                                    />

                                                    {/* Store location marker */}
                                                    {store?.latitude &&
                                                        store?.longitude && (
                                                            <Marker
                                                                position={[
                                                                    store.latitude,
                                                                    store.longitude,
                                                                ]}
                                                                opacity={0.5}
                                                            />
                                                        )}
                                                </MapContainer>
                                            </div>
                                            <div className="mt-2 text-xs text-muted-foreground">
                                                Toko berlokasi di pin
                                                transparan.
                                                {hasDeliveryLocation
                                                    ? `Jarak Anda saat ini: ~${currentDistance.toFixed(1)} km.`
                                                    : 'Pilih pin lokasi untuk melihat jarak pengiriman.'}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!isDistanceValid && (
                                    <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                        Maaf, jarak pengiriman melebihi batas
                                        maksimal 3 km. Silakan gunakan metode
                                        Ambil di Toko.
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="rounded-3xl border bg-card p-5 md:p-7">
                                <h2 className="mb-5 flex items-center gap-2 text-lg font-bold">
                                    <Store className="size-5 text-lime-600" />{' '}
                                    Informasi Pengambilan
                                </h2>

                                <p className="mb-4 text-sm text-muted-foreground">
                                    Anda memilih untuk mengambil pesanan Anda
                                    langsung di toko kami. Pesanan Anda akan
                                    kami siapkan, dan Anda dapat mengambilnya
                                    setelah pembayaran diverifikasi (kecuali
                                    pembayaran tunai).
                                </p>
                                <a
                                    href="https://maps.app.goo.gl/1adihfFUTVV4WHw76"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-600 transition hover:bg-blue-100"
                                >
                                    <MapIcon className="size-4" /> Buka Rute di
                                    Google Maps
                                </a>
                            </div>
                        )}

                        {/* Order Items */}
                        <div className="rounded-3xl border bg-card p-5 shadow-sm md:p-7">
                            <h2 className="mb-4 flex items-center gap-2 text-lg font-bold">
                                <PackageCheck className="size-5 text-lime-600" />{' '}
                                Pesanan Anda
                            </h2>
                            <div className="space-y-4">
                                {items.map((item: any) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between border-b py-2 last:border-0"
                                    >
                                        <div>
                                            <div className="font-medium">
                                                {item.product.name}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {item.qty} × {item.unit?.name} ·
                                                Rp{' '}
                                                {Number(
                                                    item.quote.unit_price,
                                                ).toLocaleString('id-ID')}
                                                /
                                                {item.unit?.symbol ||
                                                    item.unit?.name}
                                            </div>
                                        </div>
                                        <div className="font-medium">
                                            Rp{' '}
                                            {Number(
                                                item.quote.subtotal,
                                            ).toLocaleString('id-ID')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="sticky top-24 rounded-3xl border bg-card p-6 shadow-sm">
                            <h3 className="mb-4 text-lg font-semibold">
                                Ringkasan Pesanan
                            </h3>
                            <div className="mb-4 flex justify-between">
                                <span className="text-muted-foreground">
                                    Total Item
                                </span>
                                <span>{items.length}</span>
                            </div>
                            <div className="mb-2 flex justify-between">
                                <span className="text-muted-foreground">
                                    Subtotal
                                </span>
                                <span>Rp {subtotal.toLocaleString()}</span>
                            </div>

                            <div className="mb-4">
                                <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                    <TicketPercent className="size-4" /> Voucher
                                    promo
                                </span>
                                <div className="flex gap-2">
                                    <input
                                        className="h-11 min-w-0 flex-1 rounded-xl border bg-background px-3 text-sm uppercase"
                                        value={formData.voucher_code}
                                        onChange={(e) => {
                                            setVoucherPreview(null);
                                            setFormData({
                                                ...formData,
                                                voucher_code: e.target.value,
                                            });
                                        }}
                                        placeholder="Contoh: HEMAT10"
                                        aria-label="Kode voucher"
                                    />
                                    <button
                                        type="button"
                                        onClick={applyVoucher}
                                        disabled={isApplyingVoucher}
                                        className="h-11 shrink-0 rounded-xl bg-lime-300 px-4 text-sm font-semibold text-stone-950 transition-colors hover:bg-lime-400 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {isApplyingVoucher
                                            ? 'Memeriksa…'
                                            : 'Terapkan'}
                                    </button>
                                </div>
                                <p className="mt-2 text-xs text-stone-500">
                                    Masukkan kode, lalu tekan Terapkan untuk
                                    melihat potongan sebelum membayar.
                                </p>
                                {voucherPreview && (
                                    <div className="mt-3 rounded-xl border border-lime-200 bg-lime-50 px-3 py-3 text-sm">
                                        <p className="font-semibold text-lime-900">
                                            Voucher{' '}
                                            {voucherPreview.voucher_code}{' '}
                                            diterapkan
                                        </p>
                                        <div className="mt-2 space-y-1.5 text-stone-700">
                                            {voucherPreview.applied_promotions.map(
                                                (promotion) => (
                                                    <div
                                                        key={`${promotion.name}-${promotion.voucher_id}`}
                                                        className="flex justify-between gap-3"
                                                    >
                                                        <span>
                                                            {promotion.name}
                                                        </span>
                                                        <span className="font-semibold text-emerald-700">
                                                            -Rp{' '}
                                                            {Number(
                                                                promotion.amount,
                                                            ).toLocaleString(
                                                                'id-ID',
                                                            )}
                                                        </span>
                                                    </div>
                                                ),
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                            <label className="mb-4 block">
                                <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                    <CreditCard className="size-4" /> Metode
                                    pembayaran
                                </span>
                                {deliveryMethod === 'delivery' ? (
                                    <div className="flex h-11 items-center rounded-xl border bg-lime-50 px-3 text-sm font-semibold text-lime-800">
                                        QRIS (wajib untuk pengiriman)
                                    </div>
                                ) : (
                                    <select
                                        className="h-11 w-full rounded-xl border bg-background px-3 text-sm"
                                        value={formData.payment_method}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                payment_method: e.target.value,
                                            })
                                        }
                                    >
                                        <option value="cash">
                                            Bayar tunai di kasir
                                        </option>
                                        <option value="qris">QRIS</option>
                                    </select>
                                )}
                            </label>

                            {(formData.payment_method === 'bank_transfer' ||
                                formData.payment_method === 'qris') && (
                                <div className="mb-4 rounded-xl border border-dashed border-border bg-secondary/30 p-4">
                                    {formData.payment_method === 'qris' && (
                                        <div className="mb-4 flex flex-col items-center gap-2">
                                            <p className="text-xs font-semibold text-muted-foreground">
                                                Scan QRIS di bawah ini
                                            </p>
                                            <a
                                                href="/images/qris.jpeg?v=20260714"
                                                target="_blank"
                                                rel="noreferrer"
                                                className="group overflow-hidden rounded-lg border bg-white p-2 transition-colors hover:border-lime-400"
                                                aria-label="Buka QRIS ukuran penuh"
                                                title="Klik untuk melihat QRIS ukuran penuh"
                                            >
                                                <img
                                                    src="/images/qris.jpeg?v=20260714"
                                                    alt="QRIS Toko Putera Kembar"
                                                    className="size-40 object-contain transition-transform group-hover:scale-[1.02]"
                                                />
                                            </a>
                                            <p className="text-center text-xs text-muted-foreground">
                                                Toko Putera Kembar
                                            </p>
                                            <a
                                                href="/images/qris.jpeg?v=20260714"
                                                download="QRIS-Toko-Putera-Kembar.jpeg"
                                                className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-lime-300 bg-lime-100 px-3 text-xs font-semibold text-lime-900 transition-colors hover:bg-lime-200"
                                            >
                                                <Download className="size-3.5" />
                                                Unduh QRIS
                                            </a>
                                        </div>
                                    )}
                                    <label className="block">
                                        <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                            <UploadCloud className="size-4" />{' '}
                                            Unggah Bukti Pembayaran
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*,.pdf"
                                            className="w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                                            onChange={(e) => {
                                                if (
                                                    e.target.files &&
                                                    e.target.files.length > 0
                                                ) {
                                                    setPaymentProof(
                                                        e.target.files[0],
                                                    );
                                                }
                                            }}
                                            required
                                        />
                                    </label>
                                </div>
                            )}

                            <div className="mb-4 flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Ongkos kirim
                                </span>
                                {deliveryMethod === 'pickup' ? (
                                    <span className="font-medium text-emerald-600">
                                        Gratis (Pickup)
                                    </span>
                                ) : (
                                    <span>
                                        {isDistanceValid && isSubtotalValid ? (
                                            <span className="font-medium text-emerald-600">
                                                Gratis (Promo)
                                            </span>
                                        ) : (
                                            'Dihitung saat konfirmasi'
                                        )}
                                    </span>
                                )}
                            </div>
                            {voucherPreview &&
                                voucherPreview.discount_total > 0 && (
                                    <div className="flex justify-between border-t border-dashed pt-3 text-sm">
                                        <span className="text-stone-600">
                                            Total diskon
                                        </span>
                                        <span className="font-semibold text-emerald-700">
                                            -Rp{' '}
                                            {Number(
                                                voucherPreview.discount_total,
                                            ).toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                )}
                            <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold">
                                <span>Total Tagihan</span>
                                <span>
                                    Rp{' '}
                                    {totalAfterDiscount.toLocaleString('id-ID')}
                                </span>
                            </div>

                            {!isSubtotalValid &&
                                deliveryMethod === 'delivery' && (
                                    <div className="mt-4 text-center text-xs font-semibold text-red-500">
                                        Minimal belanja Rp 150.000 untuk
                                        pengiriman.
                                    </div>
                                )}

                            {errors && Object.keys(errors).length > 0 && (
                                <div className="mt-4 text-center text-xs font-semibold text-red-500">
                                    {Object.values(errors)[0] as string}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={
                                    (!isDistanceValid &&
                                        deliveryMethod === 'delivery') ||
                                    (!isSubtotalValid &&
                                        deliveryMethod === 'delivery')
                                }
                                className="mt-4 min-h-12 w-full rounded-xl bg-lime-400 py-3 text-center font-bold text-stone-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Buat Pesanan
                            </button>
                            <p className="mt-4 flex gap-2 text-xs leading-5 text-muted-foreground">
                                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-600" />{' '}
                                Pesanan belum memotong stok sebelum pembayaran
                                dikonfirmasi.
                            </p>
                        </div>
                    </div>
                </form>
            </div>
        </StorefrontLayout>
    );
}
