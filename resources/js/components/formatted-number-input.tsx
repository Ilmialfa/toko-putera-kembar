import * as React from 'react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type NumericKind = 'currency' | 'quantity';

type FormattedNumberInputProps = Omit<
    React.ComponentProps<typeof Input>,
    'type' | 'value' | 'defaultValue' | 'onChange' | 'inputMode'
> & {
    value: number | null | undefined;
    onValueChange: (value: number) => void;
    kind?: NumericKind;
    prefix?: string;
};

function toNumber(value: string, kind: NumericKind): number {
    if (!value) {
        return 0;
    }

    if (kind === 'currency') {
        return Number(value.replace(/\D/g, '')) || 0;
    }

    return Number(value.replace(/\./g, '').replace(',', '.')) || 0;
}

function formatNumber(value: number, kind: NumericKind): string {
    if (!Number.isFinite(value) || value === 0) {
        return '';
    }

    return new Intl.NumberFormat('id-ID', {
        maximumFractionDigits: kind === 'quantity' ? 3 : 0,
        useGrouping: true,
    }).format(value);
}

function normaliseValue(value: string, kind: NumericKind): string {
    if (kind === 'currency') {
        return formatNumber(Number(value.replace(/\D/g, '')), kind);
    }

    const sanitized = value.replace(/[^\d,]/g, '');
    const [whole = '', ...fractionParts] = sanitized.split(',');
    const fraction = fractionParts.join('').slice(0, 3);

    if (!whole && !fraction && !sanitized.includes(',')) {
        return '';
    }

    const groupedWhole = whole
        ? new Intl.NumberFormat('id-ID', { useGrouping: true }).format(
              Number(whole),
          )
        : '0';

    return sanitized.includes(',')
        ? `${groupedWhole},${fraction}`
        : groupedWhole;
}

/**
 * Input angka berformat Indonesia. Nilai yang disimpan tetap berupa angka,
 * sedangkan pengguna melihat pemisah ribuan titik saat mengetik.
 */
export default function FormattedNumberInput({
    value,
    onValueChange,
    kind = 'currency',
    prefix,
    className,
    onBlur,
    ...props
}: FormattedNumberInputProps) {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [displayValue, setDisplayValue] = React.useState(() =>
        formatNumber(Number(value ?? 0), kind),
    );

    React.useEffect(() => {
        const numericValue = Number(value ?? 0);

        if (inputRef.current !== document.activeElement) {
            setDisplayValue(formatNumber(numericValue, kind));
        }
    }, [kind, value]);

    return (
        <div className="relative">
            {prefix && (
                <span className="pointer-events-none absolute inset-y-0 left-3 z-10 flex items-center text-sm text-stone-500">
                    {prefix}
                </span>
            )}
            <Input
                {...props}
                ref={inputRef}
                type="text"
                inputMode={kind === 'currency' ? 'numeric' : 'decimal'}
                value={displayValue}
                onChange={(event) => {
                    const nextValue = normaliseValue(event.target.value, kind);
                    setDisplayValue(nextValue);
                    onValueChange(toNumber(nextValue, kind));
                }}
                onBlur={(event) => {
                    setDisplayValue(
                        formatNumber(toNumber(displayValue, kind), kind),
                    );
                    onBlur?.(event);
                }}
                className={cn(prefix && 'pl-10', className)}
            />
        </div>
    );
}
