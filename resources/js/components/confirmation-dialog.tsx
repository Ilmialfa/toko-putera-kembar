import { AlertTriangle } from 'lucide-react';
import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

type ConfirmationOptions = {
    title: string;
    description: string;
    confirmLabel?: string;
    destructive?: boolean;
};

type PendingConfirmation = ConfirmationOptions & {
    resolve: (confirmed: boolean) => void;
};

type Confirm = (options: ConfirmationOptions) => Promise<boolean>;

const ConfirmationContext = createContext<Confirm | null>(null);

export function ConfirmationProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const [pending, setPending] = useState<PendingConfirmation | null>(null);

    const confirm = useCallback<Confirm>((options) => {
        return new Promise((resolve) => {
            setPending({ ...options, resolve });
        });
    }, []);

    const settle = useCallback(
        (confirmed: boolean) => {
            pending?.resolve(confirmed);
            setPending(null);
        },
        [pending],
    );

    const contextValue = useMemo(() => confirm, [confirm]);

    return (
        <ConfirmationContext.Provider value={contextValue}>
            {children}
            <Dialog
                open={pending !== null}
                onOpenChange={(open) => {
                    if (!open) {
                        settle(false);
                    }
                }}
            >
                <DialogContent className="max-w-md gap-5 rounded-2xl border-stone-200 bg-white p-6">
                    <DialogHeader className="pr-8 text-left">
                        <span
                            className={`mb-1 grid size-10 place-items-center rounded-xl ${pending?.destructive ? 'bg-red-50 text-red-700' : 'bg-lime-50 text-lime-700'}`}
                        >
                            <AlertTriangle className="size-5" />
                        </span>
                        <DialogTitle>{pending?.title}</DialogTitle>
                        <DialogDescription className="leading-6">
                            {pending?.description}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2 sm:justify-end">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => settle(false)}
                        >
                            Batal
                        </Button>
                        <Button
                            type="button"
                            variant={
                                pending?.destructive ? 'destructive' : 'default'
                            }
                            onClick={() => settle(true)}
                        >
                            {pending?.confirmLabel ?? 'Lanjutkan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </ConfirmationContext.Provider>
    );
}

export function useConfirmation(): Confirm {
    const confirm = useContext(ConfirmationContext);

    if (confirm === null) {
        throw new Error(
            'useConfirmation must be used inside ConfirmationProvider.',
        );
    }

    return confirm;
}
