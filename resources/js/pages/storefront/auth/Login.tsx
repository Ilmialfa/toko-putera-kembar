import { Form, Head, Link } from '@inertiajs/react';
import { ArrowRight, LockKeyhole, Phone } from 'lucide-react';

import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import StorefrontLayout from '@/layouts/StorefrontLayout';

export default function CustomerLogin() {
    return (
        <StorefrontLayout>
            <Head title="Masuk Pelanggan" />
            <main className="mx-auto grid min-h-[70vh] max-w-6xl place-items-center px-4 py-12">
                <section className="w-full max-w-md rounded-3xl border border-border bg-card p-7 shadow-xl shadow-primary/5">
                    <p className="mb-2 text-xs font-bold tracking-[0.18em] text-primary uppercase">
                        Akun pelanggan
                    </p>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Selamat datang kembali
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Cek pesanan, simpan alamat, dan nikmati harga member
                        grosir.
                    </p>

                    <Form
                        action="/akun/masuk"
                        method="post"
                        className="mt-8 space-y-5"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="space-y-2">
                                    <Label htmlFor="login">
                                        Nomor HP atau email
                                    </Label>
                                    <div className="relative">
                                        <Phone className="absolute top-3 left-3 size-4 text-muted-foreground" />
                                        <Input
                                            id="login"
                                            name="login"
                                            className="h-11 pl-10"
                                            autoComplete="username"
                                            required
                                        />
                                    </div>
                                    <InputError message={errors.login} />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Kata sandi</Label>
                                    <div className="relative">
                                        <LockKeyhole className="absolute top-3 left-3 size-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            name="password"
                                            type="password"
                                            className="h-11 pl-10"
                                            autoComplete="current-password"
                                            required
                                        />
                                    </div>
                                    <InputError message={errors.password} />
                                </div>
                                <Button
                                    className="h-12 w-full rounded-xl text-base font-bold"
                                    disabled={processing}
                                >
                                    Masuk <ArrowRight className="size-4" />
                                </Button>
                            </>
                        )}
                    </Form>
                    <p className="mt-6 text-center text-sm text-muted-foreground">
                        Belum punya akun?{' '}
                        <Link
                            href="/akun/daftar"
                            className="font-semibold text-foreground hover:text-primary"
                        >
                            Daftar gratis
                        </Link>
                    </p>
                </section>
            </main>
        </StorefrontLayout>
    );
}
