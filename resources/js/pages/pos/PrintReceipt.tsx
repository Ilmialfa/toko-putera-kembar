import { Head } from '@inertiajs/react';
import React, { useEffect } from 'react';

interface PrintReceiptProps {
    sale: any;
    store: any;
}

export default function PrintReceipt({ sale, store }: PrintReceiptProps) {
    useEffect(() => {
        // Auto print when component mounts
        window.print();

        // Optional: auto close after print dialog closes
        window.onafterprint = () => {
            window.close();
        };
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID').format(amount);
    };

    return (
        <div
            className="bg-white p-4 text-black"
            style={{ width: '58mm', fontSize: '12px', fontFamily: 'monospace' }}
        >
            <Head title={`Receipt - ${sale?.sale_number}`} />

            <div className="mb-4 text-center">
                <h1 className="text-lg font-bold">
                    {store?.name || 'Toko Putera Kembar'}
                </h1>
                <p>{store?.address || 'Alamat Toko'}</p>
                <p>{store?.phone || 'Telp: -'}</p>
            </div>

            <div className="mb-2 border-t border-b border-dashed border-black py-2">
                <div className="flex justify-between">
                    <span>No: {sale?.sale_number}</span>
                </div>
                <div className="flex justify-between">
                    <span>
                        Tgl:{' '}
                        {new Date(sale?.created_at).toLocaleString('id-ID')}
                    </span>
                </div>
                <div className="flex justify-between">
                    <span>Ksr: {sale?.created_by || 'Kasir 1'}</span>
                </div>
            </div>

            <div className="py-2">
                {sale?.items?.map((item: any) => (
                    <div key={item.id} className="mb-2">
                        <div className="font-bold">{item.product?.name}</div>
                        <div className="flex justify-between">
                            <span>
                                {item.qty} x{' '}
                                {formatCurrency(item.price_per_unit)}
                            </span>
                            <span>{formatCurrency(item.subtotal)}</span>
                        </div>
                        {item.discount_amount > 0 && (
                            <div className="flex justify-between text-xs">
                                <span>Disc:</span>
                                <span>
                                    -{formatCurrency(item.discount_amount)}
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mb-2 border-t border-dashed border-black pt-2">
                <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>{formatCurrency(sale?.total_amount)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Bayar</span>
                    <span>{formatCurrency(sale?.paid_amount)}</span>
                </div>
                <div className="flex justify-between">
                    <span>Kembali</span>
                    <span>{formatCurrency(sale?.change_amount)}</span>
                </div>
            </div>

            <div className="mt-4 text-center">
                <p>Terima Kasih</p>
                <p>Barang yang sudah dibeli tidak dapat ditukar/dikembalikan</p>
            </div>
        </div>
    );
}
