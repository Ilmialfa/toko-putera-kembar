import { Camera, CircleAlert, ScanBarcode } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type BarcodeDetectorInstance = {
    detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
};

type BarcodeDetectorConstructor = new (options?: {
    formats?: string[];
}) => BarcodeDetectorInstance;

function barcodeDetector(): BarcodeDetectorConstructor | undefined {
    return (window as unknown as { BarcodeDetector?: BarcodeDetectorConstructor })
        .BarcodeDetector;
}

export default function BarcodeCameraScanner({
    onDetected,
    label = 'Scan barcode',
    className,
}: {
    onDetected: (barcode: string) => void;
    label?: string;
    className?: string;
}) {
    const [open, setOpen] = useState(false);
    const [message, setMessage] = useState('Arahkan kamera ke barcode produk.');
    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        if (!open) {
            return;
        }

        let cancelled = false;
        let timer: number | undefined;

        const stopCamera = () => {
            window.clearInterval(timer);
            streamRef.current?.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
        };

        const startCamera = async () => {
            if (!navigator.mediaDevices?.getUserMedia) {
                setMessage('Kamera tidak tersedia pada perangkat ini. Gunakan scanner fisik atau masukkan barcode.');

                return;
            }

            const Detector = barcodeDetector();

            if (!Detector) {
                setMessage('Browser ini belum mendukung scan otomatis. Gunakan Chrome Android, scanner fisik, atau masukkan barcode.');

                return;
            }

            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { facingMode: { ideal: 'environment' } },
                    audio: false,
                });

                if (cancelled) {
                    stream.getTracks().forEach((track) => track.stop());

                    return;
                }

                streamRef.current = stream;

                if (!videoRef.current) {
                    return;
                }

                videoRef.current.srcObject = stream;
                await videoRef.current.play();
                const detector = new Detector({
                    formats: ['ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e', 'qr_code'],
                });
                setMessage('Kamera siap. Arahkan barcode ke bingkai.');

                timer = window.setInterval(async () => {
                    if (!videoRef.current || cancelled) {
                        return;
                    }

                    const results = await detector.detect(videoRef.current).catch(() => []);
                    const value = results[0]?.rawValue?.trim();

                    if (value) {
                        onDetected(value);
                        stopCamera();
                        setOpen(false);
                    }
                }, 450);
            } catch {
                setMessage('Izin kamera ditolak atau kamera sedang dipakai aplikasi lain. Periksa izin browser lalu coba lagi.');
            }
        };

        void startCamera();

        return () => {
            cancelled = true;
            stopCamera();
        };
    }, [onDetected, open]);

    return (
        <>
            <Button
                type="button"
                variant="outline"
                className={className}
                onClick={() => setOpen(true)}
            >
                <Camera className="size-4" />
                <span className="sr-only sm:not-sr-only sm:ml-2">{label}</span>
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="border-stone-200 bg-white sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-stone-950">
                            <ScanBarcode className="size-5 text-lime-700" />
                            Scan barcode
                        </DialogTitle>
                        <DialogDescription>{message}</DialogDescription>
                    </DialogHeader>
                    <div className="relative overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
                        <video
                            ref={videoRef}
                            muted
                            playsInline
                            className="aspect-square w-full object-cover"
                        />
                        <div className="pointer-events-none absolute inset-[18%] rounded-xl border-2 border-lime-400" />
                    </div>
                    <div className="flex gap-2 rounded-xl bg-lime-50 p-3 text-xs leading-5 text-stone-600">
                        <CircleAlert className="mt-0.5 size-4 shrink-0 text-lime-700" />
                        Kamera hanya dipakai saat jendela scan terbuka dan tidak mengunggah video ke server.
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
