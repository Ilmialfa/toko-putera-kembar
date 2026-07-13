import { router, usePage } from '@inertiajs/react';
import L from 'leaflet';
import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
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

export default function Checkout({ cart, store, addresses }: any) {
    const { auth } = usePage().props as any;
    const [selectedAddressId, setSelectedAddressId] = useState<number | ''>('');
    const [position, setPosition] = useState<[number, number] | null>(null);
    const [formData, setFormData] = useState({
        recipient_name: auth.customer?.name || '',
        phone: auth.customer?.phone || '',
        full_address: '',
    });

    const items = cart?.items || [];
    const subtotal = items.reduce((acc: number, item: any) => {
        const price =
            item.product.prices?.find((p: any) => p.price_type === 'retail')
                ?.price || 10000;

        return acc + price * item.qty;
    }, 0);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const data: any = { payment_method: 'bank_transfer' };

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
            <div className="container mx-auto max-w-5xl px-4 py-8">
                <h1 className="mb-6 text-2xl font-bold">Checkout</h1>

                <form
                    onSubmit={handleSubmit}
                    className="grid grid-cols-1 gap-8 md:grid-cols-3"
                >
                    <div className="space-y-6 md:col-span-2">
                        {/* Address Selection */}
                        <div className="rounded-xl border bg-card p-6">
                            <h2 className="mb-4 text-lg font-semibold">
                                Informasi Pengiriman
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
                                    <div className="grid grid-cols-2 gap-4">
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
                                                center={[-6.2, 106.816666]}
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
                        <div className="rounded-xl border bg-card p-6">
                            <h2 className="mb-4 text-lg font-semibold">
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
                                                {item.qty} x {item.unit?.name}
                                            </div>
                                        </div>
                                        <div className="font-medium">
                                            Rp{' '}
                                            {(
                                                (item.product.prices?.find(
                                                    (p: any) =>
                                                        p.price_type ===
                                                        'retail',
                                                )?.price || 10000) * item.qty
                                            ).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="sticky top-24 rounded-xl border bg-card p-6">
                            <h3 className="mb-4 text-lg font-semibold">
                                Ringkasan Pesanan
                            </h3>
                            <div className="mb-2 flex justify-between">
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
                            <div className="mb-4 flex justify-between">
                                <span className="text-muted-foreground">
                                    Ongkos Kirim
                                </span>
                                <span>Menyusul</span>
                            </div>
                            <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold">
                                <span>Total Tagihan</span>
                                <span>Rp {subtotal.toLocaleString()}</span>
                            </div>

                            <button
                                type="submit"
                                className="mt-6 w-full rounded-full bg-primary py-3 text-center font-bold text-primary-foreground transition-opacity hover:opacity-90"
                            >
                                Buat Pesanan
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </StorefrontLayout>
    );
}
