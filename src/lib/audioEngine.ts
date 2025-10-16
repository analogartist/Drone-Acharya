import { PitchDetector } from "pitchy";

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
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: 44100 });
      
      // Create analyser
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 2048;
      this.analyserNode.smoothingTimeConstant = 0.8;

      // Connect microphone to analyser
      const source = this.audioContext.createMediaStreamSource(this.micStream);
      source.connect(this.analyserNode);

      // Initialize pitch detector
      this.detector = PitchDetector.forFloat32Array(this.analyserNode.fftSize);
      this.detector.minVolumeDecibels = -30;

      console.log("Audio engine initialized successfully");
    } catch (error) {
      console.error("Failed to initialize audio engine:", error);
      throw new Error("Microphone access denied or unavailable");
    }
  }

  startPitchDetection(callback: (result: PitchResult) => void): void {
    this.onPitchDetected = callback;
    
    const detectPitch = () => {
      if (!this.analyserNode || !this.detector || !this.audioContext) return;

      const buffer = new Float32Array(this.analyserNode.fftSize);
      this.analyserNode.getFloatTimeDomainData(buffer);

      const [frequency, clarity] = this.detector.findPitch(
        buffer,
        this.audioContext.sampleRate
      );

      if (frequency && clarity > 0.9) {
        const { cents, note } = this.analyzeFrequency(frequency);
        
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

// Tanpura sound generator using Web Audio API
export class TanpuraGenerator {
  private audioContext: AudioContext | null = null;
  private oscillators: OscillatorNode[] = [];
  private gainNode: GainNode | null = null;

  initialize(): void {
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0.15;
    this.gainNode.connect(this.audioContext.destination);
  }

  start(baseFrequency: number = 261.63): void {
    if (!this.audioContext || !this.gainNode) return;

    // Stop existing oscillators
    this.stop();

    // Single string tanpura - C3 (lower Sa)
    const osc = this.audioContext.createOscillator();
    osc.frequency.value = 130.81; // C3 frequency
    osc.type = "sawtooth"; // Approximates tanpura timbre
    
    osc.connect(this.gainNode);
    osc.start(this.audioContext.currentTime);
    
    this.oscillators.push(osc);

    console.log("Tanpura started at C3 (130.81 Hz)");
  }

  stop(): void {
    this.oscillators.forEach(osc => {
      try {
        osc.stop();
      } catch (e) {
        // Oscillator might already be stopped
      }
    });
    this.oscillators = [];
  }

  cleanup(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Tabla beat generator
export class TablaGenerator {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;

  initialize(): void {
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0.3;
    this.gainNode.connect(this.audioContext.destination);
  }

  playBeat(isSam: boolean = false): void {
    if (!this.audioContext || !this.gainNode) return;

    const now = this.audioContext.currentTime;
    
    // Create oscillator for beat sound
    const osc = this.audioContext.createOscillator();
    const oscGain = this.audioContext.createGain();
    
    // Sam (first beat) is emphasized
    if (isSam) {
      osc.frequency.value = 200; // Lower, deeper sound for sam
      oscGain.gain.value = 0.8;
    } else {
      osc.frequency.value = 300;
      oscGain.gain.value = 0.5;
    }
    
    osc.type = "triangle";
    
    // Quick decay envelope
    oscGain.gain.setValueAtTime(oscGain.gain.value, now);
    oscGain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
    
    osc.connect(oscGain);
    oscGain.connect(this.gainNode);
    
    osc.start(now);
    osc.stop(now + 0.1);
  }

  cleanup(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
