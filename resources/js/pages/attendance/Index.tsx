import { Head } from '@inertiajs/react';
import React, { useState, useEffect, useRef } from 'react';
import CameraCaptureWithWatermark from '@/components/CameraCaptureWithWatermark';
import { useGeolocationCapture } from '@/hooks/useGeolocationCapture';

export default function AttendanceIndex({ employees, serverTime }: any) {
    const [method, setMethod] = useState<'photo_geo' | 'barcode_kiosk' | null>(
        null,
    );
    const [type, setType] = useState<'check_in' | 'check_out'>('check_in');

    // Photo & Geo State
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>(
        '',
    );
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{
        type: 'success' | 'error';
        text: string;
    } | null>(null);
    const { geoState, captureLocation } = useGeolocationCapture();

    // Barcode State
    const [barcode, setBarcode] = useState('');
    const barcodeInputRef = useRef<HTMLInputElement>(null);

    // Focus barcode input if barcode method selected
    useEffect(() => {
        if (method === 'barcode_kiosk' && barcodeInputRef.current) {
            barcodeInputRef.current.focus();
        }
    }, [method]);

    // Handle Photo Capture
    const handlePhotoCapture = async (base64Image: string) => {
        if (!selectedEmployeeId) {
            setMessage({
                type: 'error',
                text: 'Pilih nama pegawai terlebih dahulu.',
            });

            return;
        }

        setLoading(true);
        setMessage(null);

        // Get fresh location
        const location = await captureLocation();

        if (location.error) {
            setMessage({ type: 'error', text: location.error });
            setLoading(false);

            return;
        }

        submitAttendance({
            attendance_method: 'photo_geo',
            employee_id: selectedEmployeeId,
            type,
            photo_base64: base64Image,
            latitude: location.latitude,
            longitude: location.longitude,
            accuracy_meters: location.accuracy,
            device_time: new Date().toISOString(),
            device_info: navigator.userAgent,
        });
    };

    // Handle Barcode Submit
    const handleBarcodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!barcode.trim()) {
            return;
        }

        setLoading(true);
        setMessage(null);

        submitAttendance({
            attendance_method: 'barcode_kiosk',
            employee_barcode: barcode.trim(),
            type,
            device_time: new Date().toISOString(),
            device_info: 'Kiosk Scanner',
        });
    };

    const submitAttendance = async (data: any) => {
        try {
            // In a real app, use axios or fetch
            const response = await fetch('/api/hr/attendances/record', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                setMessage({
                    type: 'success',
                    text: `Absensi berhasil dicatat! (Jarak: ${result.attendance.distance_from_store_meters ?? 0}m)`,
                });
                setBarcode('');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                setMessage({
                    type: 'error',
                    text: result.message || 'Terjadi kesalahan.',
                });
            }
        } catch (err: any) {
            setMessage({
                type: 'error',
                text: err.message || 'Gagal merekam absensi.',
            });
        } finally {
            setLoading(false);
        }
    };

    const selectedEmployeeName =
        employees?.find((e: any) => e.id === selectedEmployeeId)?.full_name ||
        'Karyawan';

    return (
        <div className="min-h-screen bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
            <Head title="Absensi Karyawan" />

            <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl bg-white shadow-xl">
                <div className="bg-blue-600 px-6 py-8 text-center text-white">
                    <h1 className="text-3xl font-bold">Portal Absensi</h1>
                    <p className="mt-2 text-blue-100">
                        Silakan pilih metode absensi Anda
                    </p>
                </div>

                <div className="p-8">
                    {message && (
                        <div
                            className={`mb-6 rounded-lg p-4 ${message.type === 'success' ? 'border border-green-200 bg-green-50 text-green-700' : 'border border-red-200 bg-red-50 text-red-700'}`}
                        >
                            {message.text}
                        </div>
                    )}

                    {/* Method Selection */}
                    {!method ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            <button
                                onClick={() => setMethod('barcode_kiosk')}
                                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-blue-500 hover:bg-blue-50"
                            >
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                    <svg
                                        className="h-8 w-8"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
                                        ></path>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Scan Barcode
                                </h3>
                                <p className="mt-2 text-center text-sm text-gray-500">
                                    Untuk mesin Kiosk yang terhubung dengan
                                    scanner
                                </p>
                            </button>

                            <button
                                onClick={() => setMethod('photo_geo')}
                                className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition-colors hover:border-blue-500 hover:bg-blue-50"
                            >
                                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                                    <svg
                                        className="h-8 w-8"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth="2"
                                            d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                                        ></path>
                                    </svg>
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    Foto Kamera (HP)
                                </h3>
                                <p className="mt-2 text-center text-sm text-gray-500">
                                    Gunakan kamera depan dan lokasi (GPS)
                                    perangkat
                                </p>
                            </button>
                        </div>
                    ) : (
                        <div>
                            <button
                                onClick={() => {
                                    setMethod(null);
                                    setMessage(null);
                                }}
                                className="mb-6 inline-flex items-center text-sm text-blue-600 hover:underline"
                            >
                                &larr; Ganti Metode
                            </button>

                            <div className="mb-8 flex justify-center gap-4">
                                <button
                                    onClick={() => setType('check_in')}
                                    className={`rounded-full px-6 py-2 font-bold ${type === 'check_in' ? 'bg-green-600 text-white shadow-md' : 'bg-gray-200 text-gray-700'}`}
                                >
                                    Masuk (Check In)
                                </button>
                                <button
                                    onClick={() => setType('check_out')}
                                    className={`rounded-full px-6 py-2 font-bold ${type === 'check_out' ? 'bg-orange-600 text-white shadow-md' : 'bg-gray-200 text-gray-700'}`}
                                >
                                    Pulang (Check Out)
                                </button>
                            </div>

                            {/* Barcode Form */}
                            {method === 'barcode_kiosk' && (
                                <form
                                    onSubmit={handleBarcodeSubmit}
                                    className="mx-auto max-w-sm"
                                >
                                    <label className="mb-2 block text-sm font-medium text-gray-700">
                                        Scan Kartu / Ketik Barcode
                                    </label>
                                    <input
                                        ref={barcodeInputRef}
                                        type="text"
                                        value={barcode}
                                        onChange={(e) =>
                                            setBarcode(e.target.value)
                                        }
                                        className="block w-full rounded-lg border-gray-300 px-4 py-3 text-center shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-lg"
                                        placeholder="Scan di sini..."
                                        disabled={loading}
                                        autoFocus
                                    />
                                    <button
                                        type="submit"
                                        disabled={loading || !barcode}
                                        className="mt-4 w-full rounded-lg bg-blue-600 py-3 font-bold text-white shadow-sm disabled:opacity-50"
                                    >
                                        {loading ? 'Menyimpan...' : 'Submit'}
                                    </button>
                                    <p className="mt-4 text-center text-xs text-gray-500">
                                        Gunakan Barcode Scanner fisik, form ini
                                        dirancang untuk mendeteksi 'Enter'
                                        secara otomatis.
                                    </p>
                                </form>
                            )}

                            {/* Photo & Geo Form */}
                            {method === 'photo_geo' && (
                                <div className="space-y-6">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-gray-700">
                                            Pilih Nama Anda
                                        </label>
                                        <select
                                            value={selectedEmployeeId}
                                            onChange={(e) =>
                                                setSelectedEmployeeId(
                                                    Number(e.target.value),
                                                )
                                            }
                                            className="block w-full rounded-lg border-gray-300 px-4 py-3 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                            disabled={loading}
                                        >
                                            <option value="">
                                                -- Pilih --
                                            </option>
                                            {employees?.map((emp: any) => (
                                                <option
                                                    key={emp.id}
                                                    value={emp.id}
                                                >
                                                    {emp.full_name} (
                                                    {emp.position})
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {selectedEmployeeId ? (
                                        <div>
                                            {loading ? (
                                                <div className="py-12 text-center text-gray-500">
                                                    Memproses lokasi dan
                                                    mengunggah gambar... Mohon
                                                    tunggu.
                                                </div>
                                            ) : (
                                                <CameraCaptureWithWatermark
                                                    serverTime={serverTime}
                                                    onCapture={
                                                        handlePhotoCapture
                                                    }
                                                    employeeName={
                                                        selectedEmployeeName
                                                    }
                                                    latitude={geoState.latitude}
                                                    longitude={
                                                        geoState.longitude
                                                    }
                                                />
                                            )}
                                        </div>
                                    ) : (
                                        <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center text-sm text-gray-500">
                                            Silakan pilih nama Anda terlebih
                                            dahulu untuk membuka kamera.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
