import { pianoKeys, type PianoKey } from '@/lib/ragaSystem';

interface PianoKeyboardProps {
  value: number;
  onChange: (hz: number) => void;
}

const whiteKeys = pianoKeys.filter((k) => !k.isBlack);
const blackKeys = pianoKeys.filter((k) => k.isBlack);

// Map each black key to a left-offset percentage relative to the keyboard
function getBlackKeyPosition(key: PianoKey): number {
  // Find the index of the white key just before this black key
  const allKeys = pianoKeys;
  const idx = allKeys.indexOf(key);
  // Count how many white keys are before this black key
  let whitesBefore = 0;
  for (let i = 0; i < idx; i++) {
    if (!allKeys[i].isBlack) whitesBefore++;
  }
  // Position: after whitesBefore-th white key, offset slightly left
  const whiteKeyWidth = 100 / whiteKeys.length;
  return whitesBefore * whiteKeyWidth - whiteKeyWidth * 0.3;
}

export default function PianoKeyboard({ value, onChange }: PianoKeyboardProps) {
  const isActive = (key: PianoKey) => Math.abs(value - key.hz) < 0.5;

  return (
    <div>
      <p className="label">Sa (Tonic) - Pick from keyboard</p>
      <div className="piano-keyboard">
        {/* White keys */}
        {whiteKeys.map((key) => (
          <button
            key={key.note}
            onClick={() => onChange(key.hz)}
            className={`piano-key piano-key--white ${isActive(key) ? 'piano-key--selected' : ''}`}
          >
            <span className="piano-key__label">
              {key.label}
              <span className="piano-key__octave">{key.octave}</span>
            </span>
          </button>
        ))}
        {/* Black keys (absolutely positioned) */}
        {blackKeys.map((key) => (
          <button
            key={key.note}
            onClick={() => onChange(key.hz)}
            className={`piano-key piano-key--black ${isActive(key) ? 'piano-key--selected' : ''}`}
            style={{ left: `${getBlackKeyPosition(key)}%` }}
          >
            <span className="piano-key__label-black">{key.label}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-[var(--color-text-muted)] mt-2 text-center font-mono">
        {pianoKeys.find((k) => Math.abs(value - k.hz) < 0.5)?.note ?? '—'} = {value.toFixed(1)} Hz
      </p>
    </div>
  );
}
