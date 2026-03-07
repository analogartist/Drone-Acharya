import { cn } from '@/lib/utils';
import type { PitchResult } from '@/lib/audioEngine';

interface PitchDisplayProps {
  pitchData: PitchResult | null;
  isActive: boolean;
  targetSwara: string | null; // current palta swara to hit
}

export default function PitchDisplay({ pitchData, isActive, targetSwara }: PitchDisplayProps) {
  const cents = pitchData?.cents ?? 0;
  const absCents = Math.abs(cents);

  const status: 'perfect' | 'close' | 'off' | 'idle' =
    !isActive || !pitchData ? 'idle'
    : absCents < 10 ? 'perfect'
    : absCents < 30 ? 'close'
    : 'off';

  const indicatorPos = 50 + Math.max(-50, Math.min(50, cents));

  const colors = {
    perfect: 'bg-[var(--color-success)]',
    close: 'bg-[var(--color-warning)]',
    off: 'bg-[var(--color-danger)]',
    idle: 'bg-[var(--color-border)]',
  };

  const textColors = {
    perfect: 'text-[var(--color-success)]',
    close: 'text-[var(--color-warning)]',
    off: 'text-[var(--color-danger)]',
    idle: 'text-[var(--color-text-muted)]',
  };

  return (
    <div className="card space-y-4">
      <div className="flex items-center justify-between">
        <p className="label">Pitch Detection</p>
        {targetSwara && (
          <span className="text-xs font-mono text-[var(--color-primary)]">
            Target: {targetSwara}
          </span>
        )}
      </div>

      {/* Detected swara */}
      <div className="text-center">
        <p className={cn('text-4xl font-bold font-mono', textColors[status])}>
          {pitchData?.note ?? '--'}
        </p>
        {pitchData && (
          <p className="text-xs text-[var(--color-text-muted)] mt-1 font-mono">
            {pitchData.frequency.toFixed(1)} Hz &middot; {cents > 0 ? '+' : ''}{cents.toFixed(0)}c
          </p>
        )}
      </div>

      {/* Cents bar */}
      <div className="relative h-8 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--color-text-muted)]/30" />
        {/* Scale markers */}
        <div className="absolute inset-0 flex items-center justify-between px-4 text-[10px] text-[var(--color-text-muted)]">
          <span>-50c</span>
          <span>0</span>
          <span>+50c</span>
        </div>
        {/* Indicator */}
        {isActive && (
          <div
            className={cn(
              'absolute top-1 bottom-1 w-2 rounded-full transition-all duration-150',
              colors[status],
              status === 'perfect' && 'shadow-[0_0_12px_rgba(34,197,94,0.5)]',
            )}
            style={{ left: `${indicatorPos}%`, transform: 'translateX(-50%)' }}
          />
        )}
      </div>

      {/* Status label */}
      <p className={cn('text-center text-sm font-medium', textColors[status])}>
        {status === 'perfect' && 'Perfect Sur'}
        {status === 'close' && 'Almost there...'}
        {status === 'off' && 'Adjust your pitch'}
        {status === 'idle' && 'Waiting...'}
      </p>
    </div>
  );
}
