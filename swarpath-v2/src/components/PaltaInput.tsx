import { useState } from 'react';
import { parsePalta, validatePalta, ragaDefinitions } from '@/lib/ragaSystem';

interface PaltaInputProps {
  value: string[];
  onChange: (swaras: string[]) => void;
  currentRaga: string;
}

const presets: Record<string, string[]> = {
  'Aroha-Avaroha': [], // will be filled from raga
  'Sa Re Sa': ['Sa', 'Re', 'Sa'],
  'Sa Re Ga Re Sa': ['Sa', 'Re', 'Ga', 'Re', 'Sa'],
  'Sa Re Ga Ma Pa Ma Ga Re Sa': ['Sa', 'Re', 'Ga', 'Ma', 'Pa', 'Ma', 'Ga', 'Re', 'Sa'],
};

export default function PaltaInput({ value, onChange, currentRaga }: PaltaInputProps) {
  const [text, setText] = useState(value.join(' '));
  const [error, setError] = useState('');

  const raga = ragaDefinitions[currentRaga];

  const handleApply = () => {
    const swaras = parsePalta(text);
    if (swaras.length === 0) {
      setError('Enter at least one swara');
      return;
    }
    const result = validatePalta(swaras);
    if (!result.valid) {
      setError(`Unknown swaras: ${result.invalid.join(', ')}`);
      return;
    }
    setError('');
    onChange(swaras);
  };

  const handlePreset = (name: string) => {
    let swaras: string[];
    if (name === 'Aroha-Avaroha' && raga) {
      swaras = [...raga.aroha, ...raga.avaroha.slice(1)];
    } else {
      swaras = presets[name];
    }
    setText(swaras.join(' '));
    setError('');
    onChange(swaras);
  };

  return (
    <div>
      <p className="label mb-2">Palta (Swara Sequence)</p>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {Object.keys(presets).map((name) => (
          <button
            key={name}
            onClick={() => handlePreset(name)}
            className="btn btn-sm btn-outline"
          >
            {name}
          </button>
        ))}
      </div>

      {/* Text input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          placeholder="e.g. Sa Re Ga Ma Pa Ma Ga Re Sa"
          className="flex-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-lg px-3 py-2 text-sm font-mono text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-primary)]"
        />
        <button onClick={handleApply} className="btn btn-primary btn-sm">
          Set
        </button>
      </div>

      {error && <p className="text-xs text-[var(--color-danger)] mt-1">{error}</p>}

      {/* Current palta display */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-3">
          {value.map((s, i) => (
            <span
              key={i}
              className="text-xs font-mono px-2 py-1 rounded bg-[var(--color-surface-2)] text-[var(--color-text-muted)]"
            >
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
