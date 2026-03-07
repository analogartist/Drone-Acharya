import type { PitchResult } from '@/lib/audioEngine';

interface PitchDisplayProps {
  pitchData: PitchResult | null;
  isActive: boolean;
  targetSwara: string | null;
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

  const statusColors = {
    perfect: 'var(--color-success)',
    close: 'var(--color-warning)',
    off: 'var(--color-danger)',
    idle: 'var(--color-text-muted)',
  };

  const color = statusColors[status];

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <p className="label">Pitch Detection</p>
        {targetSwara && (
          <span className="badge">Target: {targetSwara}</span>
        )}
      </div>

      {/* Big swara display */}
      <div className="text-center py-4">
        <p className="text-5xl font-bold font-mono" style={{ color }}>
          {pitchData?.note ?? '--'}
        </p>
        {pitchData && (
          <p className="text-xs text-[var(--color-text-muted)] mt-2 font-mono">
            {pitchData.frequency.toFixed(1)} Hz &middot; {cents > 0 ? '+' : ''}{cents.toFixed(0)} cents
          </p>
        )}
      </div>

      {/* Cents gauge */}
      <div className="relative h-10 bg-[var(--color-surface-2)] rounded-xl overflow-hidden mt-2">
        {/* Center zone (good area) */}
        <div className="absolute left-[40%] right-[40%] top-0 bottom-0 bg-[var(--color-success)]/5 border-x border-[var(--color-success)]/20" />
        {/* Center line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--color-text-muted)]/20" />
        {/* Scale markers */}
        <div className="absolute inset-0 flex items-center justify-between px-4 text-[10px] text-[var(--color-text-muted)] opacity-50">
          <span>-50</span>
          <span>0</span>
          <span>+50</span>
        </div>
        {/* Indicator */}
        {isActive && (
          <div
            className="absolute top-1.5 bottom-1.5 w-3 rounded-full transition-all duration-100"
            style={{
              left: `${indicatorPos}%`,
              transform: 'translateX(-50%)',
              backgroundColor: color,
              boxShadow: status === 'perfect' ? `0 0 16px ${color}` : 'none',
            }}
          />
        )}
      </div>

      {/* Status */}
      <p className="text-center text-sm font-medium mt-3" style={{ color }}>
        {status === 'perfect' && 'Perfect Sur!'}
        {status === 'close' && 'Almost there...'}
        {status === 'off' && 'Adjust your pitch'}
        {status === 'idle' && (isActive ? 'Listening...' : 'Press Start to begin')}
      </p>
    </div>
  );
}
