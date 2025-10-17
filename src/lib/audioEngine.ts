import { PitchDetector } from "pitchy";
import * as Tone from "tone";

export interface PitchResult {
  frequency: number;
  clarity: number;
  cents: number;
  note: string;
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

  // Reference frequencies for swaras in Hz (Sa = C4)
  private readonly swaraFrequencies = {
    Sa: 261.63,  // C
    Re: 293.66,  // D
    Ga: 329.63,  // E
    Ma: 349.23,  // F
    Pa: 392.00,  // G
    Dha: 440.00, // A
    Ni: 493.88,  // B
  };

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

      console.log("Audio engine initialized successfully");
    } catch (error) {
      console.error("Failed to initialize audio engine:", error);
      throw new Error("Microphone access denied or unavailable");
    }
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
        const { cents, note } = this.analyzeFrequency(frequency);
        
        if (this.debugMode) {
          console.log(`Detected: ${note} | ${frequency.toFixed(1)} Hz | ${cents > 0 ? '+' : ''}${cents.toFixed(0)} cents`);
        }
        
        this.onPitchDetected?.({
          frequency,
          clarity,
          cents,
          note,
        });
      }

      this.animationFrameId = requestAnimationFrame(detectPitch);
    };

    detectPitch();
  }

  private analyzeFrequency(frequency: number): { cents: number; note: string } {
    // Normalize frequency to base octave (C4-B4 range)
    let normalizedFreq = frequency;
    while (normalizedFreq > 523.25) normalizedFreq /= 2; // Above B4
    while (normalizedFreq < 261.63) normalizedFreq *= 2; // Below C4
    
    // Find closest swara in normalized octave
    let closestSwara = "Sa";
    let minDiff = Infinity;

    for (const [swara, freq] of Object.entries(this.swaraFrequencies)) {
      const diff = Math.abs(normalizedFreq - freq);
      if (diff < minDiff) {
        minDiff = diff;
        closestSwara = swara;
      }
    }

    // Calculate cents deviation using original frequency
    const targetFreq = this.swaraFrequencies[closestSwara as keyof typeof this.swaraFrequencies];
    
    // Find the closest octave of the target frequency to the actual frequency
    let closestOctaveFreq = targetFreq;
    while (Math.abs(frequency - closestOctaveFreq * 2) < Math.abs(frequency - closestOctaveFreq)) {
      closestOctaveFreq *= 2;
    }
    while (Math.abs(frequency - closestOctaveFreq / 2) < Math.abs(frequency - closestOctaveFreq)) {
      closestOctaveFreq /= 2;
    }
    
    const cents = 1200 * Math.log2(frequency / closestOctaveFreq);

    return { cents, note: closestSwara };
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

  start(baseFrequency: number = 261.63): void {
    if (!this.synth) return;

    this.stop();

    // C3 note (130.81 Hz)
    this.synth.triggerAttack("C3");

    console.log("Tanpura started at C3 with Tone.js");
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
