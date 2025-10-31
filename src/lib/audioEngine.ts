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

  // Constants for valid vocal frequency range
  private readonly MIN_VOCAL_FREQUENCY = 60; // Hz (below C2)
  private readonly MAX_VOCAL_FREQUENCY = 1200; // Hz (above D#6)
  private readonly MIN_CLARITY = 0.7; // Stricter clarity threshold
  private readonly MIN_AUDIO_LEVEL = 0.005; // 0.5% minimum audio level
  private readonly FREQUENCY_TOLERANCE = 0.08; // ±8% tolerance for swara matching
  
  // Frequency stability tracking
  private recentFrequencies: number[] = [];
  private readonly STABILITY_WINDOW = 5;
  private readonly STABILITY_THRESHOLD = 20; // Hz

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

      // Filter out invalid frequencies and low quality detections
      if (!frequency) {
        this.animationFrameId = requestAnimationFrame(detectPitch);
        return;
      }

      // Check audio level threshold
      if (this.currentAudioLevel < this.MIN_AUDIO_LEVEL) {
        if (this.debugMode) {
          console.log(`[AudioEngine] Rejected: Audio level too low (${(this.currentAudioLevel * 100).toFixed(2)}%)`);
        }
        this.animationFrameId = requestAnimationFrame(detectPitch);
        return;
      }

      // Check clarity threshold
      if (clarity < this.MIN_CLARITY) {
        if (this.debugMode) {
          console.log(`[AudioEngine] Rejected: Low clarity (${clarity.toFixed(2)})`);
        }
        this.animationFrameId = requestAnimationFrame(detectPitch);
        return;
      }

      // Check frequency range
      if (frequency < this.MIN_VOCAL_FREQUENCY || frequency > this.MAX_VOCAL_FREQUENCY) {
        if (this.debugMode) {
          console.log(`[AudioEngine] Rejected: Out of vocal range (${frequency.toFixed(1)} Hz)`);
        }
        this.animationFrameId = requestAnimationFrame(detectPitch);
        return;
      }

      // Frequency stability check
      this.recentFrequencies.push(frequency);
      if (this.recentFrequencies.length > this.STABILITY_WINDOW) {
        this.recentFrequencies.shift();
      }

      if (this.recentFrequencies.length >= 3) {
        const avg = this.recentFrequencies.reduce((a, b) => a + b, 0) / this.recentFrequencies.length;
        const deviation = Math.abs(frequency - avg);
        
        if (deviation > this.STABILITY_THRESHOLD) {
          if (this.debugMode) {
            console.log(`[AudioEngine] Rejected: Unstable frequency (deviation: ${deviation.toFixed(1)} Hz)`);
          }
          this.animationFrameId = requestAnimationFrame(detectPitch);
          return;
        }
      }

      const result = this.analyzeFrequency(frequency);
      
      if (result) {
        if (this.debugMode) {
          const octaveSymbol = result.octave === -1 ? "." : result.octave === 1 ? "'" : result.octave === 2 ? "''" : "";
          console.log(`Detected: ${result.note}${octaveSymbol} | ${frequency.toFixed(1)} Hz | ${result.cents > 0 ? '+' : ''}${result.cents.toFixed(0)} cents | ${result.isInRaga ? 'In Raga' : 'Out of Raga'}`);
        }
        
        this.onPitchDetected?.({
          frequency,
          clarity,
          ...result,
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
  } | null {
    // Determine octave using proper boundaries
    // C2 = 65.4 Hz, C3 = 130.8 Hz, C4 = 261.6 Hz, C5 = 523.2 Hz
    let octave: number;
    
    if (frequency < this.baseFrequency) {
      octave = -1; // Mandra saptak (C2-C3)
    } else if (frequency < this.baseFrequency * 2) {
      octave = 0; // Madhya saptak (C3-C4)
    } else if (frequency < this.baseFrequency * 4) {
      octave = 1; // Taar saptak (C4-C5)
    } else {
      octave = 2; // Taar+ saptak (C5+)
    }
    
    // Normalize frequency to madhya saptak (base octave) for comparison
    const octaveShift = Math.floor(Math.log2(frequency / this.baseFrequency));
    const searchFreq = frequency / Math.pow(2, octaveShift);
    
    // Find closest swara with tolerance check
    let closestSwara: string | null = null;
    let minPercentDiff = Infinity;

    for (const [swara, baseFreq] of Object.entries(this.swaraFrequencies)) {
      const percentDiff = Math.abs(searchFreq - baseFreq) / baseFreq;
      
      if (percentDiff < minPercentDiff) {
        minPercentDiff = percentDiff;
        closestSwara = swara;
      }
    }

    // Reject if no swara found within tolerance
    if (!closestSwara || minPercentDiff > this.FREQUENCY_TOLERANCE) {
      if (this.debugMode) {
        console.log(`[AudioEngine] Rejected: No swara match within tolerance (${(minPercentDiff * 100).toFixed(1)}% diff)`);
      }
      return null;
    }

    // Get the target frequency in the correct octave
    const baseSwaraFreq = this.swaraFrequencies[closestSwara];
    const targetFreq = baseSwaraFreq * Math.pow(2, octaveShift);
    
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
