import { PitchDetector } from "pitchy";
import * as Tone from "tone";
import {
  getRagaSwaraFrequencies,
  isSwaraInRaga,
  swaraRatios,
} from "./ragaSystem";

export interface PitchResult {
  frequency: number;
  clarity: number;
  cents: number;
  note: string;
  octave: number; // -1 (mandra), 0 (madhya), 1 (taar)
  isInRaga: boolean; // whether detected note is valid in current raga
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private detector: PitchDetector<Float32Array> | null = null;
  private animationFrameId: number | null = null;
  private onPitchDetected: ((result: PitchResult) => void) | null = null;
  private currentAudioLevel: number = 0;
  private debugMode: boolean = true; // Enable debug logging

  // Dynamic swara frequencies based on current raga
  private baseFrequency: number = 130.81; // C3 (tanpura reference)
  private currentRaga: string = "Yaman";
  private swaraFrequencies: Record<string, number> = {};
  private validSwarasInRaga: string[] = [];

  async initialize(): Promise<void> {
    try {
      // Request microphone access
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: 44100 });
      
      // Create analyser with optimized settings for vocal range
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 4096; // Higher resolution for better low-frequency detection
      this.analyserNode.smoothingTimeConstant = 0.5; // Faster response

      // Connect microphone to analyser
      const source = this.audioContext.createMediaStreamSource(this.micStream);
      source.connect(this.analyserNode);

      // Initialize pitch detector with relaxed volume threshold
      this.detector = PitchDetector.forFloat32Array(this.analyserNode.fftSize);
      this.detector.minVolumeDecibels = -50; // More sensitive to quieter singing

      // Initialize with default raga
      this.setRaga("Yaman");

      console.log("Audio engine initialized successfully");
    } catch (error) {
      console.error("Failed to initialize audio engine:", error);
      throw new Error("Microphone access denied or unavailable");
    }
  }

  setRaga(ragaName: string): void {
    this.currentRaga = ragaName;
    this.swaraFrequencies = getRagaSwaraFrequencies(ragaName, this.baseFrequency);
    this.validSwarasInRaga = Object.keys(this.swaraFrequencies);
    
    console.log(`[AudioEngine] Raga set to ${ragaName}`);
    console.log(`[AudioEngine] Swara frequencies:`, this.swaraFrequencies);
  }

  startPitchDetection(callback: (result: PitchResult) => void): void {
    this.onPitchDetected = callback;

    // Ensure audio context is running (required on some browsers)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume().catch((e) => console.warn('Failed to resume audio context', e));
    }
    
    const detectPitch = () => {
      if (!this.analyserNode || !this.detector || !this.audioContext) return;

      const buffer = new Float32Array(this.analyserNode.fftSize);
      this.analyserNode.getFloatTimeDomainData(buffer);

      // Calculate audio level (RMS)
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
      }
      this.currentAudioLevel = Math.sqrt(sum / buffer.length);

      const [frequency, clarity] = this.detector.findPitch(
        buffer,
        this.audioContext.sampleRate
      );

      // Always log if audio level is detectable
      if (this.currentAudioLevel > 0.001) {
        console.log(`[AudioEngine] Level: ${(this.currentAudioLevel * 100).toFixed(2)}% | Freq: ${frequency?.toFixed(1) || 'N/A'} Hz | Clarity: ${clarity?.toFixed(2) || 'N/A'}`);
      }

      // Relaxed clarity threshold for better detection
      if (frequency && clarity > 0.5) {
        const { cents, note, octave, isInRaga } = this.analyzeFrequency(frequency);
        
        if (this.debugMode) {
          const octaveSymbol = octave === -1 ? "." : octave === 1 ? "'" : "";
          console.log(`Detected: ${note}${octaveSymbol} | ${frequency.toFixed(1)} Hz | ${cents > 0 ? '+' : ''}${cents.toFixed(0)} cents | ${isInRaga ? 'In Raga' : 'Out of Raga'}`);
        }
        
        this.onPitchDetected?.({
          frequency,
          clarity,
          cents,
          note,
          octave,
          isInRaga,
        });
      }

      this.animationFrameId = requestAnimationFrame(detectPitch);
    };

    detectPitch();
  }

  private analyzeFrequency(frequency: number): { 
    cents: number; 
    note: string; 
    octave: number; 
    isInRaga: boolean;
  } {
    // Determine which octave the frequency belongs to
    // baseFrequency is C3 (130.81 Hz), madhya saptak is centered around it
    // Mandra: < baseFreq * 1.5 (< ~196 Hz)
    // Madhya: baseFreq * 1.5 to baseFreq * 3 (~196-393 Hz)
    // Taar: > baseFreq * 3 (> ~393 Hz)
    
    let octave = 0;
    let searchFreq = frequency;
    
    // Normalize to base octave range
    if (frequency < this.baseFrequency * 1.5) {
      octave = -1; // Mandra saptak
      // Normalize up to madhya range for comparison
      while (searchFreq < this.baseFrequency) {
        searchFreq *= 2;
      }
    } else if (frequency > this.baseFrequency * 3) {
      octave = 1; // Taar saptak
      // Normalize down to madhya range for comparison
      while (searchFreq > this.baseFrequency * 2) {
        searchFreq /= 2;
      }
    } else {
      octave = 0; // Madhya saptak
    }
    
    // Find closest swara in current raga
    let closestSwara = "Sa";
    let minDiff = Infinity;

    for (const [swara, baseFreq] of Object.entries(this.swaraFrequencies)) {
      const diff = Math.abs(searchFreq - baseFreq);
      if (diff < minDiff) {
        minDiff = diff;
        closestSwara = swara;
      }
    }

    // Get the target frequency in the correct octave
    const baseSwaraFreq = this.swaraFrequencies[closestSwara];
    let targetFreq = baseSwaraFreq;
    
    // Adjust target frequency to match detected octave
    if (octave === -1) {
      targetFreq = baseSwaraFreq / 2;
    } else if (octave === 1) {
      targetFreq = baseSwaraFreq * 2;
    }
    
    // Calculate cents deviation from target frequency
    const cents = 1200 * Math.log2(frequency / targetFreq);
    
    // Check if swara is valid in current raga
    const isInRaga = isSwaraInRaga(closestSwara, this.currentRaga);

    return { cents, note: closestSwara, octave, isInRaga };
  }

  getAudioLevel(): number {
    return this.currentAudioLevel;
  }

  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  stopPitchDetection(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  cleanup(): void {
    this.stopPitchDetection();
    
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }

    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }

    console.log("Audio engine cleaned up");
  }
}

// Tanpura sound generator using Tone.js
export class TanpuraGenerator {
  private synth: Tone.FMSynth | null = null;
  private autoFilter: Tone.AutoFilter | null = null;

  async initialize(): Promise<void> {
    await Tone.start();
    
    // Create a warm, resonant synth for tanpura
    this.synth = new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 10,
      oscillator: { type: "sine" },
      envelope: { attack: 0.5, decay: 2, sustain: 0.8, release: 3 },
      modulation: { type: "square" },
      modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 }
    });
    
    // Add subtle vibrato for realism
    this.autoFilter = new Tone.AutoFilter("0.5hz").toDestination();
    this.autoFilter.start();
    
    // Connect synth through the filter
    this.synth.connect(this.autoFilter);
    this.synth.volume.value = -20;
  }

  start(baseFrequency: number = 130.81): void {
    if (!this.synth) return;

    this.stop();

    // Convert frequency to note name
    const noteName = Tone.Frequency(baseFrequency, "hz").toNote();
    this.synth.triggerAttack(noteName);

    console.log(`[Tanpura] Started at ${noteName} (${baseFrequency.toFixed(2)} Hz)`);
  }

  setPitch(baseFrequency: number): void {
    if (this.synth) {
      this.synth.frequency.rampTo(baseFrequency, 0.5);
      console.log(`[Tanpura] Pitch changed to ${baseFrequency.toFixed(2)} Hz`);
    }
  }

  stop(): void {
    if (this.synth) {
      this.synth.triggerRelease();
    }
  }

  cleanup(): void {
    this.stop();
    if (this.synth) {
      this.synth.dispose();
      this.synth = null;
    }
    if (this.autoFilter) {
      this.autoFilter.dispose();
      this.autoFilter = null;
    }
  }
}

// Tabla beat generator using Tone.js
export class TablaGenerator {
  private membraneSynth: Tone.MembraneSynth | null = null;
  private noiseSynth: Tone.NoiseSynth | null = null;

  async initialize(): Promise<void> {
    await Tone.start();
    
    // Deep bass for tabla
    this.membraneSynth = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: "sine" },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 }
    }).toDestination();
    
    // High-frequency attack for tabla
    this.noiseSynth = new Tone.NoiseSynth({
      noise: { type: "white" },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0 }
    }).toDestination();
    
    this.membraneSynth.volume.value = -10;
    this.noiseSynth.volume.value = -25;
  }

  playBeat(isSam: boolean = false): void {
    if (!this.membraneSynth || !this.noiseSynth) return;

    const now = Tone.now();
    
    if (isSam) {
      // Sam: deeper, emphasized beat
      this.membraneSynth.triggerAttackRelease("C2", "16n", now);
      this.noiseSynth.triggerAttackRelease("16n", now);
    } else {
      // Regular beat: lighter
      this.membraneSynth.triggerAttackRelease("G2", "32n", now);
      this.noiseSynth.triggerAttackRelease("32n", now, -35);
    }
  }

  cleanup(): void {
    if (this.membraneSynth) {
      this.membraneSynth.dispose();
      this.membraneSynth = null;
    }
    if (this.noiseSynth) {
      this.noiseSynth.dispose();
      this.noiseSynth = null;
    }
  }
}
