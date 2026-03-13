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
      <div className="card text-center py-16">
        <p className="text-xl text-[var(--color-text-muted)]">Enter a palta to begin</p>
        <p className="text-sm text-[var(--color-text-muted)] mt-2 opacity-60">
          Click Settings to configure your practice
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <p className="label">Palta Runner</p>
        <div className="flex items-center gap-3 text-[10px] text-[var(--color-text-muted)]">
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[var(--color-success)]" /> Correct</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[var(--color-warning)]" /> Close</span>
          <span className="flex items-center gap-1"><span className="inline-block w-2 h-2 rounded-full bg-[var(--color-danger)]" /> Off</span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 justify-center py-4">
        {swaras.map((swara, i) => {
          const fb = feedback[i] || { status: 'pending' };
          const isCurrent = isPlaying && i === currentIndex;

          return (
            <div
              key={i}
              className={cn(
                'swara-chip',
                fb.status === 'correct' && 'swara-chip--correct',
                fb.status === 'close' && 'swara-chip--close',
                fb.status === 'wrong' && 'swara-chip--wrong',
                fb.status === 'pending' && 'swara-chip--pending',
                fb.status === 'active' && 'swara-chip--active',
                isCurrent && 'swara-chip--current',
              )}
            >
              {swara}
            </div>
          );
        })}
      </div>
    </div>
  );
}
