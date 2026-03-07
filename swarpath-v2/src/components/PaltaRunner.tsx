import { cn } from '@/lib/utils';

interface PaltaRunnerProps {
  swaras: string[];
  currentIndex: number;
  isPlaying: boolean;
  feedback: SwaraFeedback[];
}

export interface SwaraFeedback {
  swara: string;
  status: 'pending' | 'correct' | 'close' | 'wrong' | 'active';
}

export default function PaltaRunner({ swaras, currentIndex, isPlaying, feedback }: PaltaRunnerProps) {
  if (swaras.length === 0) {
    return (
      <div className="card text-center py-12 text-[var(--color-text-muted)]">
        <p className="text-lg">Enter a palta to begin</p>
        <p className="text-sm mt-1">e.g. Sa Re Ga Ma Pa Ma Ga Re Sa</p>
      </div>
    );
  }

  return (
    <div className="card">
      <p className="label mb-4">Palta Runner</p>
      <div className="flex flex-wrap gap-2 justify-center">
        {swaras.map((swara, i) => {
          const fb = feedback[i] || { status: 'pending' };
          const isCurrent = isPlaying && i === currentIndex;

          return (
            <div
              key={i}
              className={cn(
                'relative px-4 py-3 rounded-lg font-mono text-lg font-semibold transition-all duration-200 min-w-[3.5rem] text-center',
                // Background states
                fb.status === 'correct' && 'bg-[var(--color-success)]/20 text-[var(--color-success)]',
                fb.status === 'close' && 'bg-[var(--color-warning)]/20 text-[var(--color-warning)]',
                fb.status === 'wrong' && 'bg-[var(--color-danger)]/20 text-[var(--color-danger)]',
                fb.status === 'pending' && 'bg-[var(--color-surface-2)] text-[var(--color-text-muted)]',
                fb.status === 'active' && 'bg-[var(--color-primary)]/20 text-[var(--color-primary)]',
                // Current highlight
                isCurrent && 'ring-2 ring-[var(--color-primary)] scale-110',
              )}
            >
              {swara}
              {/* Dot indicator below */}
              {fb.status !== 'pending' && fb.status !== 'active' && (
                <div
                  className={cn(
                    'absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full',
                    fb.status === 'correct' && 'bg-[var(--color-success)]',
                    fb.status === 'close' && 'bg-[var(--color-warning)]',
                    fb.status === 'wrong' && 'bg-[var(--color-danger)]',
                  )}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-6 text-xs text-[var(--color-text-muted)]">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--color-success)]" /> Correct
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--color-warning)]" /> Close
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-[var(--color-danger)]" /> Off
        </span>
      </div>
    </div>
  );
}
