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

            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Riwayat Absensi
                    </h1>
                    <p className="mt-1 text-gray-600">
                        Pantau kehadiran pegawai secara real-time
                    </p>
                </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
                <div className="flex gap-4 border-b border-gray-200 bg-gray-50 p-4">
                    <div className="relative max-w-md flex-1">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Cari nama pegawai..."
                            className="block w-full rounded-md border border-gray-300 bg-white py-2 pr-3 pl-10 leading-5 placeholder-gray-500 transition duration-150 ease-in-out focus:border-blue-500 focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:outline-none sm:text-sm"
                        />
                    </div>
                    <button className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
                        Filter Tanggal
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                >
                                    Waktu (Server)
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                >
                                    Pegawai
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                >
                                    Tipe
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                >
                                    Metode
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                >
                                    Status Validasi
                                </th>
                                <th
                                    scope="col"
                                    className="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase"
                                >
                                    Foto
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
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
                                                : 'hover:bg-gray-50'
                                        }
                                    >
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-900">
                                            {new Date(
                                                attendance.captured_at_server,
                                            ).toLocaleString('id-ID')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">
                                                {attendance.employee?.full_name}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {
                                                    attendance.store_location
                                                        ?.name
                                                }
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span
                                                className={`inline-flex rounded-full px-2 text-xs leading-5 font-semibold ${attendance.type === 'check_in' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}
                                            >
                                                {attendance.type === 'check_in'
                                                    ? 'Check In'
                                                    : 'Check Out'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
                                            {attendance.attendance_method ===
                                            'barcode_kiosk' ? (
                                                <span className="flex items-center">
                                                    <span className="mr-2 h-2 w-2 rounded-full bg-blue-500"></span>{' '}
                                                    Kiosk Barcode
                                                </span>
                                            ) : (
                                                <span className="flex items-center">
                                                    <MapPin className="mr-1 h-4 w-4 text-gray-400" />{' '}
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
                                                <span className="text-gray-400">
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

                {/* Pagination placeholder */}
                <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                    <div className="text-sm text-gray-700">
                        Menampilkan{' '}
                        <span className="font-medium">
                            {attendances.from || 0}
                        </span>{' '}
                        sampai{' '}
                        <span className="font-medium">
                            {attendances.to || 0}
                        </span>{' '}
                        dari{' '}
                        <span className="font-medium">{attendances.total}</span>{' '}
                        data
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}
