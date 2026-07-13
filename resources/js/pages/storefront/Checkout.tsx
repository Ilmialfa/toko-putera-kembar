import { router, usePage } from '@inertiajs/react';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import {
    CreditCard,
    MapPin,
    PackageCheck,
    ShieldCheck,
    TicketPercent,
} from 'lucide-react';
import React, { useState } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';

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

export default function Checkout({ store, addresses, items, subtotal }: any) {
    const { auth } = usePage().props as any;
    const [selectedAddressId, setSelectedAddressId] = useState<number | ''>('');
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [formData, setFormData] = useState({
        recipient_name: auth.customer?.name || '',
        phone: auth.customer?.phone || '',
        full_address: '',
        payment_method: 'bank_transfer',
        voucher_code: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const data: any = {
            payment_method: formData.payment_method,
            voucher_code: formData.voucher_code || null,
        };

        if (selectedAddressId) {
            data.address_id = selectedAddressId;
        } else {
            data.recipient_name = formData.recipient_name;
            data.phone = formData.phone;
            data.full_address = formData.full_address;

            if (position) {
                data.latitude = position[0];
                data.longitude = position[1];
            }
        }

        router.post('/checkout', data);
    };

    return (
        <StorefrontLayout title="Checkout">
            <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
                <div className="mb-8 rounded-3xl border border-stone-200 bg-white px-6 py-7 text-stone-800 md:px-9">
                    <p className="text-xs font-bold tracking-[0.18em] text-lime-700 uppercase">
                        Checkout aman
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
                        {/* Address Selection */}
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
                                            className={`block cursor-pointer rounded-lg border p-4 transition-colors ${selectedAddressId === addr.id ? 'border-primary bg-primary/5' : 'hover:bg-secondary'}`}
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
                                                        {addr.recipient_name} (
                                                        {addr.phone})
                                                    </div>
                                                    <div className="mt-1 text-sm text-muted-foreground">
                                                        {addr.full_address}
                                                    </div>
                                                </div>
                                            </div>
                                        </label>
                                    ))}

                                    <label
                                        className={`block cursor-pointer rounded-lg border p-4 transition-colors ${selectedAddressId === '' ? 'border-primary bg-primary/5' : 'hover:bg-secondary'}`}
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
                                                        phone: e.target.value,
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
                                                    setPosition={setPosition}
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
                                            Toko berlokasi di pin transparan
                                            (jika ada). Pastikan jarak
                                            pengiriman tidak melebihi{' '}
                                            {store?.settings
                                                ?.max_delivery_radius_km ||
                                                10}{' '}
                                            km.
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

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
                            <label className="mb-4 block">
                                <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                    <TicketPercent className="size-4" /> Voucher
                                    promo
                                </span>
                                <input
                                    className="h-11 w-full rounded-xl border bg-background px-3 text-sm uppercase"
                                    value={formData.voucher_code}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            voucher_code: e.target.value,
                                        })
                                    }
                                    placeholder="KODEPROMO"
                                />
                            </label>
                            <label className="mb-4 block">
                                <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
                                    <CreditCard className="size-4" /> Metode
                                    pembayaran
                                </span>
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
                                    <option value="bank_transfer">
                                        Transfer bank
                                    </option>
                                    <option value="e_wallet">
                                        Dompet digital
                                    </option>
                                </select>
                            </label>
                            <div className="mb-4 flex justify-between text-sm">
                                <span className="text-muted-foreground">
                                    Ongkos kirim
                                </span>
                                <span>Dihitung saat konfirmasi</span>
                            </div>
                            <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold">
                                <span>Total Tagihan</span>
                                <span>Rp {subtotal.toLocaleString()}</span>
                            </div>

                            <button
                                type="submit"
                                className="mt-6 min-h-12 w-full rounded-xl bg-lime-400 py-3 text-center font-bold text-stone-950 transition hover:bg-lime-300 disabled:opacity-50"
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
