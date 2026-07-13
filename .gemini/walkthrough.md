# Implementasi Fase 7: HR (Absensi)

## Perubahan yang Dilakukan:

1. **Database & Model (7.1):**
   - Mengimplementasikan `Employee`, `Attendance`, dan `AttendanceCorrection` model serta migrations.
   - Tabel `attendances` diset menjadi **Immutable**. Tidak ada rute API untuk *Update* atau *Delete*. Setiap entri absen (Check-in/Check-out) terikat dengan cap waktu server, koordinat GPS, dan watermark foto.

2. **Core Absensi Services (7.2):**
   - Mengembangkan `RecordAttendanceAction` yang akan memverifikasi *time drift* (selisih waktu device dan server) untuk menghindari serangan *replay/time spoofing*.
   - Menggunakan *Haversine Formula* untuk menghitung `distance_from_store_meters` berdasarkan `latitude` dan `longitude` yang dikirim dari klien vs koordinat asli `StoreLocation`.
   - Melakukan decode Base64 image dan menyimpannya secara privat.

3. **Portal Absensi Karyawan & Kiosk (7.3 & 7.4):**
   - Mengembangkan satu portal `/attendance` terpadu dengan 2 opsi absen: **Foto GPS** dan **Barcode Kiosk**.
   - Untuk **Foto GPS**, dikembangkan `CameraCaptureWithWatermark.tsx` yang secara live merender kamera depan HTML5 `<video>`, kemudian menggambar nama, waktu terkini, dan koordinat ke atas hidden `<canvas>`. File upload manual diblokir sama sekali.
   - Mengembangkan custom hook React `useGeolocationCapture` yang akan menanyakan *permission* dan menangkap titik koordinat akurat.
   - Untuk **Barcode Kiosk**, form input didesain dengan autofokus, dirancang menangkap *keypress* beruntun dari perangkat *scanner barcode* USB/Bluetooth secara otomatis.

4. **UI Dashboard HR (7.5):**
   - Menambahkan laman "Riwayat Absensi" di `/hr/attendances` untuk Admin, lengkap dengan *flagging* peringatan berwarna jika terdeteksi *anomali* (seperti karyawan absen di luar radius toko, atau *time drift* yang mencurigakan).
   - Menyiapkan endpoint untuk *Attendance Correction* apabila karyawan harus dikoreksi manual absensinya.

## Cara Verifikasi:
- Kunjungi laman `/attendance` dari browser (berikan izin kamera dan lokasi).
- Pilih "Foto Kamera (HP)" lalu pilih nama Anda dan tipe Check In. Foto yang tertangkap akan disisipkan *watermark* dan diverifikasi koordinatnya oleh backend.
- Cek hasilnya pada panel Admin (sidebar **HR & Absensi**). Anomali akan langsung ditandai dengan warna merah.

## Status Pengerjaan:
Fase 7 (HR: Absensi) **Selesai**.
