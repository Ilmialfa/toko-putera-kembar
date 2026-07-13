import { Head } from '@inertiajs/react';
import {
    Camera,
    MapPin,
    Search,
    AlertTriangle,
    CheckCircle,
} from 'lucide-react';
import React from 'react';
import AdminLayout from '@/layouts/AdminLayout';

export default function AttendanceIndex({ attendances }: any) {
    return (
        <AdminLayout>
            <Head title="Manajemen Absensi" />

            <div className="min-h-full bg-white p-4 sm:p-6 lg:p-8">
                <header className="mb-8">
                    <p className="text-xs font-semibold tracking-[0.16em] text-lime-700 uppercase">
                        SDM & Kehadiran
                    </p>
                    <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
                        Riwayat Absensi
                    </h1>
                    <p className="mt-2 text-sm text-stone-500">
                        Pantau kehadiran pegawai secara real-time.
                    </p>
                </header>

                <section className="overflow-hidden rounded-2xl bg-[#fafaf8]">
                    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:p-5">
                        <div className="relative w-full sm:max-w-md">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Search className="size-4 text-stone-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari nama pegawai..."
                                className="block h-10 w-full rounded-xl border-transparent bg-white py-2 pr-3 pl-10 text-sm text-stone-700 placeholder:text-stone-400 focus:border-lime-300 focus:ring-0"
                            />
                        </div>
                        <button className="h-10 rounded-xl bg-white px-4 text-sm font-medium text-stone-700 transition-colors hover:bg-lime-50">
                            Filter tanggal
                        </button>
                    </div>

                    <div className="overflow-x-auto bg-white">
                        <table className="min-w-full divide-y divide-stone-100">
                            <thead className="bg-[#fafaf8]">
                                <tr>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-stone-500 uppercase"
                                    >
                                        Waktu (Server)
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-stone-500 uppercase"
                                    >
                                        Pegawai
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-stone-500 uppercase"
                                    >
                                        Tipe
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-stone-500 uppercase"
                                    >
                                        Metode
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-stone-500 uppercase"
                                    >
                                        Status Validasi
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-[11px] font-semibold tracking-wider text-stone-500 uppercase"
                                    >
                                        Foto
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 bg-white">
                                {attendances.data.map((attendance: any) => {
                                    const hasAnomaly =
                                        !attendance.is_within_radius ||
                                        attendance.device_info?.includes(
                                            'Time drift',
                                        );

                                    return (
                                        <tr
                                            key={attendance.id}
                                            className={
                                                hasAnomaly
                                                    ? 'bg-red-50'
                                                    : 'hover:bg-lime-50/30'
                                            }
                                        >
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-stone-700">
                                                {new Date(
                                                    attendance.captured_at_server,
                                                ).toLocaleString('id-ID')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-stone-800">
                                                    {
                                                        attendance.employee
                                                            ?.full_name
                                                    }
                                                </div>
                                                <div className="text-xs text-stone-500">
                                                    {
                                                        attendance
                                                            .store_location
                                                            ?.name
                                                    }
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${attendance.type === 'check_in' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}
                                                >
                                                    {attendance.type ===
                                                    'check_in'
                                                        ? 'Check In'
                                                        : 'Check Out'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm whitespace-nowrap text-stone-500">
                                                {attendance.attendance_method ===
                                                'barcode_kiosk' ? (
                                                    <span className="flex items-center">
                                                        <span className="mr-2 h-2 w-2 rounded-full bg-lime-500"></span>{' '}
                                                        Kiosk Barcode
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center">
                                                        <MapPin className="mr-1 h-4 w-4 text-stone-400" />{' '}
                                                        Foto GPS
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {attendance.attendance_method ===
                                                'barcode_kiosk' ? (
                                                    <span className="flex items-center text-sm text-green-600">
                                                        <CheckCircle className="mr-1 h-4 w-4" />{' '}
                                                        Valid
                                                    </span>
                                                ) : hasAnomaly ? (
                                                    <div className="flex flex-col">
                                                        <span className="flex items-center text-sm font-medium text-red-600">
                                                            <AlertTriangle className="mr-1 h-4 w-4" />{' '}
                                                            Anomali Terdeteksi
                                                        </span>
                                                        {!attendance.is_within_radius && (
                                                            <span className="text-xs text-red-500">
                                                                Jarak:{' '}
                                                                {
                                                                    attendance.distance_from_store_meters
                                                                }
                                                                m
                                                            </span>
                                                        )}
                                                        {attendance.device_info?.includes(
                                                            'Time drift',
                                                        ) && (
                                                            <span className="text-xs text-red-500">
                                                                Waktu perangkat
                                                                tidak sinkron
                                                            </span>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <span className="flex items-center text-sm text-green-600">
                                                        <CheckCircle className="mr-1 h-4 w-4" />{' '}
                                                        Radius Valid (
                                                        {
                                                            attendance.distance_from_store_meters
                                                        }
                                                        m)
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
                                                {attendance.photo_path ? (
                                                    <a
                                                        href={`/storage/${attendance.photo_path}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center text-blue-600 hover:text-blue-900"
                                                    >
                                                        <Camera className="mr-1 h-4 w-4" />{' '}
                                                        Lihat Foto
                                                    </a>
                                                ) : (
                                                    <span className="text-stone-400">
                                                        -
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center justify-between bg-white px-4 py-4 sm:px-6">
                        <div className="text-sm text-stone-500">
                            Menampilkan{' '}
                            <span className="font-medium">
                                {attendances.from || 0}
                            </span>{' '}
                            sampai{' '}
                            <span className="font-medium">
                                {attendances.to || 0}
                            </span>{' '}
                            dari{' '}
                            <span className="font-medium">
                                {attendances.total}
                            </span>{' '}
                            data
                        </div>
                    </div>
                </section>
            </div>
        </AdminLayout>
    );
}
