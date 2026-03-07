// Palta System - tracks sung note sequences and compares against expected patterns
import { ragaDefinitions } from "./ragaSystem";

export type PracticeMode = "sequence" | "taal";

export interface PaltaDefinition {
  name: string;
  sequence: string[]; // Expected sequence of swaras (e.g., ["Sa", "Re", "Ga", "Ma", "Pa"])
}

export interface SungNote {
  swara: string;
  octave: number;
  startTime: number; // ms timestamp
  duration: number; // ms
}

export interface PaltaComparison {
  expectedIndex: number; // how far into the palta we are
  sungNotes: SungNote[];
  matches: boolean[]; // per-note: did the sung note match the expected?
  isComplete: boolean;
  accuracy: number; // 0-100%
}

export interface PaltaTrackerConfig {
  bpm: number;
  notesPerBeat: number;
  thresholdFactor?: number; // default 0.3
}

// Generate paltas from raga definitions
export function getRagaPaltas(ragaName: string): PaltaDefinition[] {
  const raga = ragaDefinitions[ragaName];
  if (!raga) return [];

  const paltas: PaltaDefinition[] = [];

  // Palta 1: Aroha (ascending)
  const arohaClean = raga.aroha.filter(s => !s.includes("'"));
  paltas.push({ name: "Aroha", sequence: arohaClean });

  // Palta 2: Avaroha (descending)
  const avarohaClean = raga.avaroha.filter(s => !s.includes("'"));
  paltas.push({ name: "Avaroha", sequence: avarohaClean });

  // Palta 3: Aroha-Avaroha (full scale up and down)
  paltas.push({
    name: "Aroha-Avaroha",
    sequence: [...arohaClean, ...avarohaClean.slice(1)], // skip duplicate at top
  });

  // Palta 4: Simple 3-note patterns (Sa Re Ga, Re Ga Ma, etc.)
  if (raga.swaras.length >= 3) {
    for (let i = 0; i <= raga.swaras.length - 3; i++) {
      const triplet = raga.swaras.slice(i, i + 3);
      paltas.push({
        name: `${triplet.join("-")}`,
        sequence: [...triplet, ...[...triplet].reverse()],
      });
    }
  }

  return paltas;
}

// If the same note persists for this long without change, it's one held note
const SAME_NOTE_MERGE_WINDOW = 80;

export class PaltaTracker {
  private currentPalta: PaltaDefinition | null = null;
  private sungNotes: SungNote[] = [];
  private currentNote: { swara: string; octave: number; startTime: number } | null = null;
  private lastUpdateTime: number = 0;
  private mode: PracticeMode = "sequence";

  // Dynamic timing config
  private minNoteDuration: number = 150; // fallback default
  private silenceTimeoutMs: number = 500; // fallback default

  setPalta(palta: PaltaDefinition): void {
    this.currentPalta = palta;
    this.reset();
  }

  setMode(mode: PracticeMode): void {
    this.mode = mode;
    this.reset();
  }

  getMode(): PracticeMode {
    return this.mode;
  }

  configure(config: PaltaTrackerConfig): void {
    const { bpm, notesPerBeat, thresholdFactor = 0.3 } = config;
    const beatDuration = 60000 / bpm; // ms per beat
    const noteDuration = beatDuration / notesPerBeat; // ms per note
    this.minNoteDuration = noteDuration * thresholdFactor;
    this.silenceTimeoutMs = noteDuration * 2;
  }

  reset(): void {
    this.sungNotes = [];
    this.currentNote = null;
    this.lastUpdateTime = 0;
  }

  // Called every frame with the detected note (or null if silence)
  update(swara: string | null, octave: number | null): void {
    if (!this.currentPalta) return;

    // Stop accepting notes once palta is complete
    if (this.sungNotes.length >= this.currentPalta.sequence.length) {
      return;
    }

    const now = performance.now();

    if (swara === null || octave === null) {
      // Silence — finalize current note if held long enough
      this.finalizeCurrentNote(now);
      this.lastUpdateTime = now;
      return;
    }

    if (
      this.currentNote &&
      this.currentNote.swara === swara &&
      this.currentNote.octave === octave
    ) {
      // Same note continuing — just update timestamp
      this.lastUpdateTime = now;
      return;
    }

    // Different note — finalize previous, start new
    this.finalizeCurrentNote(now);
    this.currentNote = { swara, octave, startTime: now };
    this.lastUpdateTime = now;
  }

  // Check if the current note should be finalized due to silence timeout
  // Returns true if a note was finalized
  checkSilenceTimeout(): boolean {
    if (!this.currentNote) return false;
    if (!this.currentPalta) return false;
    if (this.sungNotes.length >= this.currentPalta.sequence.length) return false;

    const now = performance.now();
    if (now - this.lastUpdateTime > this.silenceTimeoutMs) {
      this.finalizeCurrentNote(now);
      return true;
    }
    return false;
  }

  private finalizeCurrentNote(now: number): void {
    if (!this.currentNote) return;

    // Guard against exceeding palta length
    if (this.currentPalta && this.sungNotes.length >= this.currentPalta.sequence.length) {
      this.currentNote = null;
      return;
    }

    const duration = now - this.currentNote.startTime;

    // In sequence mode, accept any clearly detected note (no duration check)
    // In taal mode, enforce minimum duration
    const shouldAccept = this.mode === "sequence" || duration >= this.minNoteDuration;

    if (shouldAccept) {
      this.sungNotes.push({
        swara: this.currentNote.swara,
        octave: this.currentNote.octave,
        startTime: this.currentNote.startTime,
        duration,
      });
    }
    this.currentNote = null;
  }

  getComparison(): PaltaComparison {
    if (!this.currentPalta) {
      return {
        expectedIndex: 0,
        sungNotes: [],
        matches: [],
        isComplete: false,
        accuracy: 0,
      };
    }

    const expected = this.currentPalta.sequence;
    const matches: boolean[] = [];
    let correctCount = 0;

    for (let i = 0; i < this.sungNotes.length; i++) {
      if (i < expected.length) {
        const isMatch = this.sungNotes[i].swara === expected[i];
        matches.push(isMatch);
        if (isMatch) correctCount++;
      } else {
        matches.push(false); // extra notes beyond the palta
      }
    }

    const accuracy = expected.length > 0 ? (correctCount / expected.length) * 100 : 0;
    const isComplete = this.sungNotes.length >= expected.length;

    return {
      expectedIndex: this.sungNotes.length,
      sungNotes: [...this.sungNotes],
      matches,
      isComplete,
      accuracy,
    };
  }

  // Get the current note being held (not yet finalized)
  getCurrentHeldNote(): { swara: string; octave: number } | null {
    return this.currentNote ? { swara: this.currentNote.swara, octave: this.currentNote.octave } : null;
  }

  getSungNotes(): SungNote[] {
    return [...this.sungNotes];
  }

  getPalta(): PaltaDefinition | null {
    return this.currentPalta;
  }
}
