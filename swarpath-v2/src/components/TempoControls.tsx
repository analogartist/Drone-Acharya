import { cn } from '@/lib/utils';
import type { SpeedMultiplier } from '@/lib/metronome';

interface TempoControlsProps {
  bpm: number;
  onBpmChange: (bpm: number) => void;
  speed: SpeedMultiplier;
  onSpeedChange: (s: SpeedMultiplier) => void;
  metronomeOn: boolean;
  onMetronomeToggle: () => void;
}

const speeds: { label: string; value: SpeedMultiplier }[] = [
  { label: 'Barabar', value: 1 },
  { label: 'Dugun', value: 2 },
  { label: 'Tigun', value: 3 },
  { label: 'Chaugun', value: 4 },
];

export default function TempoControls({
  bpm, onBpmChange, speed, onSpeedChange, metronomeOn, onMetronomeToggle,
}: TempoControlsProps) {
  return (
    <div className="space-y-4">
      {/* BPM */}
      <div>
        <p className="label mb-2">Tempo</p>
        <div className="flex items-center gap-3">
          <button className="btn btn-sm btn-outline" onClick={() => onBpmChange(Math.max(30, bpm - 5))}>-5</button>
          <span className="font-mono text-lg min-w-[4ch] text-center">{bpm}</span>
          <button className="btn btn-sm btn-outline" onClick={() => onBpmChange(Math.min(240, bpm + 5))}>+5</button>
          <span className="text-xs text-[var(--color-text-muted)]">BPM</span>
        </div>
        <input
          type="range"
          min={30}
          max={240}
          value={bpm}
          onChange={(e) => onBpmChange(Number(e.target.value))}
          className="w-full mt-2 accent-[var(--color-primary)]"
        />
      </div>

      {/* Speed multiplier */}
      <div>
        <p className="label mb-2">Speed (Laya)</p>
        <div className="grid grid-cols-4 gap-1.5">
          {speeds.map((s) => (
            <button
              key={s.value}
              onClick={() => onSpeedChange(s.value)}
              className={cn('btn btn-sm', speed === s.value ? 'btn-primary' : 'btn-outline')}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-[var(--color-text-muted)] mt-1 text-center font-mono">
          Effective: {bpm * speed} BPM
        </p>
      </div>

      {/* Metronome toggle */}
      <div>
        <button
          onClick={onMetronomeToggle}
          className={cn('btn w-full', metronomeOn ? 'btn-primary' : 'btn-outline')}
        >
          {metronomeOn ? 'Metronome ON' : 'Metronome OFF'}
        </button>
      </div>
    </div>
  );
}
