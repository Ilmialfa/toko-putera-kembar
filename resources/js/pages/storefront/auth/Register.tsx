import { Form, Head, Link } from '@inertiajs/react';
import { ArrowRight } from 'lucide-react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StorefrontLayout from '@/layouts/StorefrontLayout';

export default function CustomerRegister() {
    return (
        <StorefrontLayout>
            <Head title="Daftar Pelanggan" />
            <main className="mx-auto grid min-h-[72vh] max-w-6xl place-items-center px-4 py-12">
                <section className="w-full max-w-lg rounded-3xl border border-border bg-card p-7 shadow-xl shadow-primary/5">
                    <p className="mb-2 text-xs font-bold tracking-[0.18em] text-primary uppercase">
                        Member Putera Kembar
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Belanja grosir makin praktis
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Daftar satu menit untuk menyimpan alamat, melacak
                        pesanan, dan mengumpulkan poin.
                    </p>
                    <Form
                        action="/akun/daftar"
                        method="post"
                        className="mt-8 grid gap-5 sm:grid-cols-2"
                    >
                        {({ errors, processing }) => (
                            <>
                                <Field
                                    label="Nama lengkap"
                                    name="name"
                                    error={errors.name}
                                    className="sm:col-span-2"
                                />
                                <Field
                                    label="Nomor HP"
                                    name="phone"
                                    error={errors.phone}
                                />
                                <Field
                                    label="Email (opsional)"
                                    name="email"
                                    type="email"
                                    error={errors.email}
                                />
                                <Field
                                    label="Kata sandi"
                                    name="password"
                                    type="password"
                                    error={errors.password}
                                />
                                <Field
                                    label="Ulangi kata sandi"
                                    name="password_confirmation"
                                    type="password"
                                />
                                <Button
                                    className="h-12 rounded-xl text-base font-bold sm:col-span-2"
                                    disabled={processing}
                                >
                                    Buat akun <ArrowRight className="size-4" />
                                </Button>
                            </>
                        )}
                    </Form>
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Sudah menjadi member?{' '}
                        <Link
                            href="/akun/masuk"
                            className="font-semibold text-foreground hover:text-primary"
                        >
                            Masuk
                        </Link>
                    </p>
                </section>
            </main>
        </StorefrontLayout>
    );
}

function Field({
    label,
    name,
    type = 'text',
    error,
    className = '',
}: {
    label: string;
    name: string;
    type?: string;
    error?: string;
    className?: string;
}) {
    return (
        <div className={`space-y-2 ${className}`}>
            <Label htmlFor={name}>{label}</Label>
            <Input
                id={name}
                name={name}
                type={type}
                className="h-11"
                required={name !== 'email'}
            />
            <InputError message={error} />
        </div>
    );
}
