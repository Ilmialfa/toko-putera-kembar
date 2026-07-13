import { Camera, RefreshCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';

interface Props {
    onCapture: (base64Image: string) => void;
    employeeName: string;
    latitude: number | null;
    longitude: number | null;
    serverTime?: string;
}

export default function CameraCaptureWithWatermark({
    onCapture,
    employeeName,
    latitude,
    longitude,
    serverTime,
}: Props) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        navigator.mediaDevices
            .getUserMedia({ video: { facingMode: 'user' }, audio: false })
            .then((mediaStream) => {
                if (!isMounted) {
                    mediaStream.getTracks().forEach((track) => track.stop());

                    return;
                }

                streamRef.current = mediaStream;

                if (videoRef.current) {
                    videoRef.current.srcObject = mediaStream;
                }
            })
            .catch(() =>
                setError(
                    'Kamera tidak dapat diakses. Pastikan izin kamera sudah diberikan.',
                ),
            );

        return () => {
            isMounted = false;
            streamRef.current?.getTracks().forEach((track) => track.stop());
        };
    }, []);

    const capture = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas?.getContext('2d');

        if (!video || !canvas || !context || video.videoWidth === 0) {
            setError('Kamera belum siap. Tunggu sebentar lalu coba lagi.');

            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        const overlayHeight = Math.max(112, Math.round(canvas.height * 0.22));
        context.fillStyle = 'rgba(10, 15, 12, 0.72)';
        context.fillRect(
            0,
            canvas.height - overlayHeight,
            canvas.width,
            overlayHeight,
        );
        context.fillStyle = '#ffffff';
        context.font = `${Math.max(16, Math.round(canvas.width / 32))}px Inter, sans-serif`;

        const displayTime = new Date(serverTime ?? Date.now()).toLocaleString(
            'id-ID',
            { timeZone: 'Asia/Jakarta' },
        );
        const location =
            latitude !== null && longitude !== null
                ? `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                : 'Lokasi belum tersedia';
        const lineHeight = Math.max(25, Math.round(overlayHeight / 4));
        const startY = canvas.height - overlayHeight + lineHeight;

        context.fillText(`Toko Putera Kembar • ${employeeName}`, 18, startY);
        context.fillText(
            `Waktu server: ${displayTime} WIB`,
            18,
            startY + lineHeight,
        );
        context.fillText(`Koordinat: ${location}`, 18, startY + lineHeight * 2);

        const image = canvas.toDataURL('image/jpeg', 0.86);
        setCapturedImage(image);
        onCapture(image);
    };

    return (
        <div className="space-y-3">
            <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-slate-950">
                {capturedImage ? (
                    <img
                        src={capturedImage}
                        alt="Hasil foto absensi"
                        className="size-full object-cover"
                    />
                ) : (
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="size-full object-cover"
                    />
                )}
                <div className="pointer-events-none absolute inset-x-3 top-3 rounded-full bg-black/55 px-3 py-1.5 text-center text-xs font-medium text-white backdrop-blur">
                    Foto langsung • galeri tidak dapat digunakan
                </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            {error && (
                <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
                    {error}
                </p>
            )}
            <Button
                type="button"
                onClick={capturedImage ? () => setCapturedImage(null) : capture}
                className="h-11 w-full rounded-xl"
            >
                {capturedImage ? (
                    <RefreshCcw className="size-4" />
                ) : (
                    <Camera className="size-4" />
                )}
                {capturedImage ? 'Ambil ulang foto' : 'Ambil foto sekarang'}
            </Button>
        </div>
    );
}
