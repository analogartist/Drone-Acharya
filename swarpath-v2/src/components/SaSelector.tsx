import { saOptions } from '@/lib/ragaSystem';
import { cn } from '@/lib/utils';

interface SaSelectorProps {
  value: number; // current Sa frequency in Hz
  onChange: (hz: number) => void;
}

export default function SaSelector({ value, onChange }: SaSelectorProps) {
  return (
    <div>
      <p className="label mb-2">Sa (Tonic)</p>
      <div className="grid grid-cols-6 gap-1.5">
        {saOptions.map((opt) => {
          const active = Math.abs(value - opt.hz) < 0.5;
          return (
            <button
              key={opt.label}
              onClick={() => onChange(opt.hz)}
              className={cn(
                'btn btn-sm justify-center',
                active ? 'btn-primary' : 'btn-outline',
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mt-2 text-center font-mono">
        {value.toFixed(1)} Hz
      </p>
    </div>
  );
}
