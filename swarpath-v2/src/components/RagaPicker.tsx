import { ragaDefinitions, type RagaDefinition } from '@/lib/ragaSystem';
import { cn } from '@/lib/utils';

interface RagaPickerProps {
  value: string;
  onChange: (raga: string) => void;
}

const ragas: RagaDefinition[] = Object.values(ragaDefinitions);

export default function RagaPicker({ value, onChange }: RagaPickerProps) {
  return (
    <div>
      <p className="label mb-2">Raga</p>
      <div className="flex flex-col gap-1.5">
        {ragas.map((r) => (
          <button
            key={r.name}
            onClick={() => onChange(r.name)}
            className={cn(
              'btn justify-start text-left',
              value === r.name ? 'btn-primary' : 'btn-outline',
            )}
          >
            <span className="font-semibold">{r.name}</span>
            <span className="text-xs opacity-70 ml-2">{r.description}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
