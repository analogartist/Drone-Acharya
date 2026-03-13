import { cn } from '@/lib/utils';

interface AudioMeterProps {
  level: number; // 0-1
  isActive: boolean;
}

export default function AudioMeter({ level, isActive }: AudioMeterProps) {
  const pct = Math.min(100, level * 100);
  const color = pct < 10 ? 'bg-[var(--color-danger)]' : pct < 30 ? 'bg-[var(--color-warning)]' : 'bg-[var(--color-success)]';

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
        <span>Mic</span>
        <span className="font-mono">{pct.toFixed(0)}%</span>
      </div>
      <div className="h-2 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-100', isActive ? color : 'bg-[var(--color-border)]')}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
