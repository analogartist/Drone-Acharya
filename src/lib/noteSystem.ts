// Chromatic note system for targeted practice
// Covers A2 to D#4 (3 notes below C3, C3-C4, and 3 notes above C4)

export interface NoteInfo {
  western: string;      // C3, D3, etc.
  swara: string;        // Sa, Re, etc.
  frequency: number;
  octave: -1 | 0 | 1;   // Mandra, Madhya, Taar
  cents: number;        // Cents from base Sa (C3)
}

const BASE_FREQUENCY = 130.81; // C3 = Sa

// Chromatic scale semitone ratios (equal temperament)
const SEMITONE_RATIO = Math.pow(2, 1/12);

// Western to Swara mapping (for C = Sa)
const WESTERN_TO_SWARA: Record<string, string> = {
  'C': 'Sa',
  'C#': 'Re♭',
  'D': 'Re',
  'D#': 'Ga♭',
  'E': 'Ga',
  'F': 'Ma',
  'F#': 'ma',  // Tivra Ma
  'G': 'Pa',
  'G#': 'Dha♭',
  'A': 'Dha',
  'A#': 'Ni♭',
  'B': 'Ni'
};

// Generate chromatic scale from A2 to D#4
export function getChromaticScale(): NoteInfo[] {
  const notes: NoteInfo[] = [];
  
  // A2 = -3 semitones from C3 (A, A#, B)
  // C3 to B3 = 0 to 11 semitones from C3
  // C4 to D#4 = 12 to 15 semitones from C3
  
  const noteNames = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
  
  // Start from A2 (-3 semitones from C3)
  for (let semitone = -3; semitone <= 15; semitone++) {
    const frequency = BASE_FREQUENCY * Math.pow(SEMITONE_RATIO, semitone);
    const cents = semitone * 100; // Each semitone is 100 cents
    
    // Determine octave and note name
    let octaveNum: 2 | 3 | 4;
    let noteIndex: number;
    let octave: -1 | 0 | 1;
    
    if (semitone < 0) {
      // A2, A#2, B2
      octaveNum = 2;
      octave = -1; // Mandra
      noteIndex = 9 + (semitone + 3); // A=9, A#=10, B=11
    } else if (semitone < 12) {
      // C3 to B3
      octaveNum = 3;
      octave = 0; // Madhya
      noteIndex = (semitone + 3) % 12;
    } else {
      // C4 to D#4
      octaveNum = 4;
      octave = 1; // Taar
      noteIndex = (semitone - 12 + 3) % 12;
    }
    
    const noteName = noteNames[noteIndex];
    const western = `${noteName}${octaveNum}`;
    const swara = WESTERN_TO_SWARA[noteName] || noteName;
    
    notes.push({
      western,
      swara,
      frequency,
      octave,
      cents
    });
  }
  
  return notes;
}

// Get note info by western name
export function getNoteByWestern(western: string): NoteInfo | undefined {
  const scale = getChromaticScale();
  return scale.find(note => note.western === western);
}

// Get notes within a frequency range
export function getNotesInRange(minFreq: number, maxFreq: number): NoteInfo[] {
  const scale = getChromaticScale();
  return scale.filter(note => note.frequency >= minFreq && note.frequency <= maxFreq);
}

// Find closest note to a frequency
export function findClosestNote(frequency: number): NoteInfo | null {
  const scale = getChromaticScale();
  let closest: NoteInfo | null = null;
  let minDiff = Infinity;
  
  for (const note of scale) {
    const diff = Math.abs(note.frequency - frequency);
    if (diff < minDiff) {
      minDiff = diff;
      closest = note;
    }
  }
  
  return closest;
}

// Calculate cents deviation from target note
export function getCentsFromTarget(frequency: number, targetFrequency: number): number {
  return 1200 * Math.log2(frequency / targetFrequency);
}
