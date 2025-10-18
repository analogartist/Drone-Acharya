// Raga System for Indian Classical Music Pitch Detection
// Base frequency: C3 = 130.81 Hz (tanpura reference)

// Swara interval ratios using Just Intonation for authentic Indian classical sound
export const swaraRatios: Record<string, number> = {
  // Natural swaras
  Sa: 1.0,
  Re: 9 / 8, // Shuddh Re = 1.125
  Ga: 5 / 4, // Shuddh Ga = 1.25
  Ma: 4 / 3, // Shuddh Ma = 1.333
  Pa: 3 / 2, // Pa = 1.5
  Dha: 5 / 3, // Shuddh Dha = 1.667
  Ni: 15 / 8, // Shuddh Ni = 1.875
  
  // Komal (flat) swaras
  re: 256 / 243, // Komal Re ≈ 1.0535
  ga: 32 / 27, // Komal Ga ≈ 1.185
  dha: 128 / 81, // Komal Dha ≈ 1.580
  ni: 16 / 9, // Komal Ni ≈ 1.778
  
  // Tivra (sharp) swara
  ma: 45 / 32, // Tivra Ma (F#) ≈ 1.406
};

// Raga definitions with their specific swaras
export interface RagaDefinition {
  name: string;
  aroha: string[]; // Ascending scale
  avaroha: string[]; // Descending scale
  swaras: string[]; // Valid swaras in this raga
  description?: string;
}

export const ragaDefinitions: Record<string, RagaDefinition> = {
  Yaman: {
    name: "Yaman",
    aroha: ["Sa", "Re", "Ga", "ma", "Pa", "Dha", "Ni", "Sa'"],
    avaroha: ["Sa'", "Ni", "Dha", "Pa", "ma", "Ga", "Re", "Sa"],
    swaras: ["Sa", "Re", "Ga", "ma", "Pa", "Dha", "Ni"],
    description: "Kalyan thaat, uses Tivra Ma (F#)",
  },
  Bhupali: {
    name: "Bhupali",
    aroha: ["Sa", "Re", "Ga", "Pa", "Dha", "Sa'"],
    avaroha: ["Sa'", "Dha", "Pa", "Ga", "Re", "Sa"],
    swaras: ["Sa", "Re", "Ga", "Pa", "Dha"],
    description: "Pentatonic raga, omits Ma and Ni",
  },
  Bhairav: {
    name: "Bhairav",
    aroha: ["Sa", "re", "Ga", "Ma", "Pa", "dha", "Ni", "Sa'"],
    avaroha: ["Sa'", "Ni", "dha", "Pa", "Ma", "Ga", "re", "Sa"],
    swaras: ["Sa", "re", "Ga", "Ma", "Pa", "dha", "Ni"],
    description: "Bhairav thaat, uses Komal Re and Komal Dha",
  },
  Kafi: {
    name: "Kafi",
    aroha: ["Sa", "Re", "ga", "Ma", "Pa", "Dha", "ni", "Sa'"],
    avaroha: ["Sa'", "ni", "Dha", "Pa", "Ma", "ga", "Re", "Sa"],
    swaras: ["Sa", "Re", "ga", "Ma", "Pa", "Dha", "ni"],
    description: "Kafi thaat, uses Komal Ga and Komal Ni",
  },
};

// Calculate frequency for a specific swara
export function getSwaraFrequency(
  swara: string,
  baseFrequency: number = 130.81
): number {
  const ratio = swaraRatios[swara];
  if (!ratio) {
    console.warn(`Unknown swara: ${swara}, defaulting to Sa`);
    return baseFrequency;
  }
  return baseFrequency * ratio;
}

// Get all swara frequencies for a specific raga
export function getRagaSwaraFrequencies(
  ragaName: string,
  baseFrequency: number = 130.81
): Record<string, number> {
  const raga = ragaDefinitions[ragaName];
  if (!raga) {
    console.warn(`Unknown raga: ${ragaName}, defaulting to Yaman`);
    return getRagaSwaraFrequencies("Yaman", baseFrequency);
  }

  const frequencies: Record<string, number> = {};

  for (const swara of raga.swaras) {
    frequencies[swara] = getSwaraFrequency(swara, baseFrequency);
  }

  return frequencies;
}

// Get octave name for display
export function getOctaveName(octave: number): string {
  switch (octave) {
    case -1:
      return "Mandra"; // Lower octave (.)
    case 0:
      return "Madhya"; // Middle octave
    case 1:
      return "Taar"; // Upper octave (')
    default:
      return "Madhya";
  }
}

// Format swara with octave indicator
export function formatSwaraWithOctave(swara: string, octave: number): string {
  if (octave === -1) {
    return `${swara}.`; // Mandra (dot below)
  } else if (octave === 1) {
    return `${swara}'`; // Taar (apostrophe)
  }
  return swara; // Madhya (no indicator)
}

// Check if a swara is valid in a raga
export function isSwaraInRaga(swara: string, ragaName: string): boolean {
  const raga = ragaDefinitions[ragaName];
  if (!raga) return false;
  return raga.swaras.includes(swara);
}

// Get reference frequency display (for UI)
export function getRagaFrequencyInfo(ragaName: string): string {
  const baseFreq = 130.81; // C3
  const raga = ragaDefinitions[ragaName];
  if (!raga) return "";

  const freqStrings = raga.swaras.map((swara) => {
    const freq = getSwaraFrequency(swara, baseFreq);
    return `${swara}: ${freq.toFixed(1)}Hz`;
  });

  return freqStrings.join(", ");
}
