// Swara interval ratios using Just Intonation
export const swaraRatios: Record<string, number> = {
  Sa: 1.0,
  Re: 9 / 8,       // Shuddh Re
  Ga: 5 / 4,       // Shuddh Ga
  Ma: 4 / 3,       // Shuddh Ma
  Pa: 3 / 2,       // Pa (fixed)
  Dha: 5 / 3,      // Shuddh Dha
  Ni: 15 / 8,      // Shuddh Ni
  // Komal (flat)
  re: 256 / 243,   // Komal Re
  ga: 32 / 27,     // Komal Ga
  dha: 128 / 81,   // Komal Dha
  ni: 16 / 9,      // Komal Ni
  // Tivra (sharp)
  ma: 45 / 32,     // Tivra Ma
};

// All 12 chromatic swaras in order (for Sa selector display)
export const chromaticSwaras = [
  { name: 'Sa', ratio: swaraRatios.Sa },
  { name: 're', ratio: swaraRatios.re },
  { name: 'Re', ratio: swaraRatios.Re },
  { name: 'ga', ratio: swaraRatios.ga },
  { name: 'Ga', ratio: swaraRatios.Ga },
  { name: 'Ma', ratio: swaraRatios.Ma },
  { name: 'ma', ratio: swaraRatios.ma },
  { name: 'Pa', ratio: swaraRatios.Pa },
  { name: 'dha', ratio: swaraRatios.dha },
  { name: 'Dha', ratio: swaraRatios.Dha },
  { name: 'ni', ratio: swaraRatios.ni },
  { name: 'Ni', ratio: swaraRatios.Ni },
];

// Western note names for each Sa position (C through B) — single octave for legacy
export const saOptions = [
  { label: 'C',  hz: 261.63 },
  { label: 'C#', hz: 277.18 },
  { label: 'D',  hz: 293.66 },
  { label: 'D#', hz: 311.13 },
  { label: 'E',  hz: 329.63 },
  { label: 'F',  hz: 349.23 },
  { label: 'F#', hz: 369.99 },
  { label: 'G',  hz: 392.00 },
  { label: 'G#', hz: 415.30 },
  { label: 'A',  hz: 440.00 },
  { label: 'A#', hz: 466.16 },
  { label: 'B',  hz: 493.88 },
];

// Piano keyboard keys from G3 to E5
export interface PianoKey {
  note: string;   // e.g. "C4", "F#3"
  label: string;  // e.g. "C", "F#"
  octave: number;
  hz: number;
  isBlack: boolean;
}

export const pianoKeys: PianoKey[] = [
  // Octave 3 (partial: G3–B3)
  { note: 'G3',  label: 'G',  octave: 3, hz: 196.00, isBlack: false },
  { note: 'G#3', label: 'G#', octave: 3, hz: 207.65, isBlack: true },
  { note: 'A3',  label: 'A',  octave: 3, hz: 220.00, isBlack: false },
  { note: 'A#3', label: 'A#', octave: 3, hz: 233.08, isBlack: true },
  { note: 'B3',  label: 'B',  octave: 3, hz: 246.94, isBlack: false },
  // Octave 4 (full)
  { note: 'C4',  label: 'C',  octave: 4, hz: 261.63, isBlack: false },
  { note: 'C#4', label: 'C#', octave: 4, hz: 277.18, isBlack: true },
  { note: 'D4',  label: 'D',  octave: 4, hz: 293.66, isBlack: false },
  { note: 'D#4', label: 'D#', octave: 4, hz: 311.13, isBlack: true },
  { note: 'E4',  label: 'E',  octave: 4, hz: 329.63, isBlack: false },
  { note: 'F4',  label: 'F',  octave: 4, hz: 349.23, isBlack: false },
  { note: 'F#4', label: 'F#', octave: 4, hz: 369.99, isBlack: true },
  { note: 'G4',  label: 'G',  octave: 4, hz: 392.00, isBlack: false },
  { note: 'G#4', label: 'G#', octave: 4, hz: 415.30, isBlack: true },
  { note: 'A4',  label: 'A',  octave: 4, hz: 440.00, isBlack: false },
  { note: 'A#4', label: 'A#', octave: 4, hz: 466.16, isBlack: true },
  { note: 'B4',  label: 'B',  octave: 4, hz: 493.88, isBlack: false },
  // Octave 5 (partial: C5–E5)
  { note: 'C5',  label: 'C',  octave: 5, hz: 523.25, isBlack: false },
  { note: 'C#5', label: 'C#', octave: 5, hz: 554.37, isBlack: true },
  { note: 'D5',  label: 'D',  octave: 5, hz: 587.33, isBlack: false },
  { note: 'D#5', label: 'D#', octave: 5, hz: 622.25, isBlack: true },
  { note: 'E5',  label: 'E',  octave: 5, hz: 659.26, isBlack: false },
];

export interface RagaDefinition {
  name: string;
  aroha: string[];
  avaroha: string[];
  swaras: string[];
  description: string;
}

export const ragaDefinitions: Record<string, RagaDefinition> = {
  Yaman: {
    name: 'Yaman',
    aroha: ['Sa', 'Re', 'Ga', 'ma', 'Pa', 'Dha', 'Ni'],
    avaroha: ['Ni', 'Dha', 'Pa', 'ma', 'Ga', 'Re', 'Sa'],
    swaras: ['Sa', 'Re', 'Ga', 'ma', 'Pa', 'Dha', 'Ni'],
    description: 'Kalyan thaat, Tivra Ma',
  },
  Bhupali: {
    name: 'Bhupali',
    aroha: ['Sa', 'Re', 'Ga', 'Pa', 'Dha'],
    avaroha: ['Dha', 'Pa', 'Ga', 'Re', 'Sa'],
    swaras: ['Sa', 'Re', 'Ga', 'Pa', 'Dha'],
    description: 'Pentatonic, omits Ma and Ni',
  },
  Bhairav: {
    name: 'Bhairav',
    aroha: ['Sa', 're', 'Ga', 'Ma', 'Pa', 'dha', 'Ni'],
    avaroha: ['Ni', 'dha', 'Pa', 'Ma', 'Ga', 're', 'Sa'],
    swaras: ['Sa', 're', 'Ga', 'Ma', 'Pa', 'dha', 'Ni'],
    description: 'Komal Re, Komal Dha',
  },
  Kafi: {
    name: 'Kafi',
    aroha: ['Sa', 'Re', 'ga', 'Ma', 'Pa', 'Dha', 'ni'],
    avaroha: ['ni', 'Dha', 'Pa', 'Ma', 'ga', 'Re', 'Sa'],
    swaras: ['Sa', 'Re', 'ga', 'Ma', 'Pa', 'Dha', 'ni'],
    description: 'Komal Ga, Komal Ni',
  },
};

export function getSwaraFrequency(swara: string, saHz: number): number {
  const ratio = swaraRatios[swara];
  if (!ratio) return saHz;
  return saHz * ratio;
}

export function getRagaSwaraFrequencies(ragaName: string, saHz: number): Record<string, number> {
  const raga = ragaDefinitions[ragaName];
  if (!raga) return getRagaSwaraFrequencies('Yaman', saHz);
  const freqs: Record<string, number> = {};
  for (const s of raga.swaras) {
    freqs[s] = getSwaraFrequency(s, saHz);
  }
  return freqs;
}

export function isSwaraInRaga(swara: string, ragaName: string): boolean {
  const raga = ragaDefinitions[ragaName];
  if (!raga) return false;
  return raga.swaras.includes(swara);
}

// Parse a palta string like "Sa Re Ga Ma Pa" into swara array
// Supports octave markers: Sa. = mandra, Sa' = taar
export function parsePalta(input: string): string[] {
  return input.trim().split(/\s+/).filter(Boolean);
}

// Validate that every swara in a palta is recognized
export function validatePalta(swaras: string[]): { valid: boolean; invalid: string[] } {
  const invalid: string[] = [];
  for (const s of swaras) {
    const base = s.replace(/[.']/g, '');
    if (!swaraRatios[base]) invalid.push(s);
  }
  return { valid: invalid.length === 0, invalid };
}
