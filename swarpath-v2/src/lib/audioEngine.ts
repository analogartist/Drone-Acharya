import { PitchDetector } from 'pitchy';
import { getRagaSwaraFrequencies, isSwaraInRaga } from './ragaSystem';

export interface PitchResult {
  frequency: number;
  clarity: number;
  cents: number;
  note: string;       // closest swara name
  octave: number;     // -1 mandra, 0 madhya, 1 taar
  isInRaga: boolean;
}

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private stream: MediaStream | null = null;
  private detector: PitchDetector<Float32Array> | null = null;
  private rafId: number | null = null;
  private onPitch: ((r: PitchResult) => void) | null = null;
  private _audioLevel = 0;
  private ready = false;

  private saHz = 261.63; // default C4
  private ragaName = 'Yaman';
  private swaraFreqs: Record<string, number> = {};

  // Tuning constants
  private readonly MIN_FREQ = 60;
  private readonly MAX_FREQ = 1200;
  private readonly MIN_CLARITY = 0.7;
  private readonly MIN_LEVEL = 0.005;
  private readonly TOLERANCE = 0.08; // 8%

  // Stability
  private recentFreqs: number[] = [];
  private readonly STAB_WINDOW = 5;
  private readonly STAB_THRESH = 20; // Hz

  async init(): Promise<void> {
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    this.ctx = new AudioContext({ sampleRate: 44100 });
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 4096;
    this.analyser.smoothingTimeConstant = 0.5;
    this.source = this.ctx.createMediaStreamSource(this.stream);
    this.source.connect(this.analyser);
    this.detector = PitchDetector.forFloat32Array(this.analyser.fftSize);
    this.detector.minVolumeDecibels = -50;
    this.updateSwaraFreqs();
    this.ready = true;
  }

  isReady(): boolean {
    return this.ready && !!this.ctx && !!this.analyser && !!this.detector;
  }

  setSa(hz: number) {
    this.saHz = hz;
    this.updateSwaraFreqs();
  }

  setRaga(name: string) {
    this.ragaName = name;
    this.updateSwaraFreqs();
  }

  private updateSwaraFreqs() {
    this.swaraFreqs = getRagaSwaraFrequencies(this.ragaName, this.saHz);
  }

  get audioLevel() { return this._audioLevel; }

  async startDetection(cb: (r: PitchResult) => void) {
    if (!this.isReady()) throw new Error('Not initialized');
    this.onPitch = cb;
    if (this.ctx!.state === 'suspended') await this.ctx!.resume();

    const tick = () => {
      if (!this.analyser || !this.detector || !this.ctx) return;
      const buf = new Float32Array(this.analyser.fftSize);
      this.analyser.getFloatTimeDomainData(buf);

      // RMS level
      let sum = 0;
      for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
      this._audioLevel = Math.sqrt(sum / buf.length);

      const [freq, clarity] = this.detector.findPitch(buf, this.ctx.sampleRate);
      if (!freq || this._audioLevel < this.MIN_LEVEL || clarity < this.MIN_CLARITY ||
          freq < this.MIN_FREQ || freq > this.MAX_FREQ) {
        this.rafId = requestAnimationFrame(tick);
        return;
      }

      // Stability
      this.recentFreqs.push(freq);
      if (this.recentFreqs.length > this.STAB_WINDOW) this.recentFreqs.shift();
      if (this.recentFreqs.length >= 3) {
        const avg = this.recentFreqs.reduce((a, b) => a + b, 0) / this.recentFreqs.length;
        if (Math.abs(freq - avg) > this.STAB_THRESH) {
          this.rafId = requestAnimationFrame(tick);
          return;
        }
      }

      const result = this.matchSwara(freq);
      if (result) this.onPitch?.({ frequency: freq, clarity, ...result });
      this.rafId = requestAnimationFrame(tick);
    };
    tick();
  }

  private matchSwara(freq: number): Omit<PitchResult, 'frequency' | 'clarity'> | null {
    const octaveShift = Math.floor(Math.log2(freq / this.saHz));
    const searchFreq = freq / Math.pow(2, octaveShift);

    let closest: string | null = null;
    let minDiff = Infinity;
    for (const [swara, base] of Object.entries(this.swaraFreqs)) {
      const d = Math.abs(searchFreq - base) / base;
      if (d < minDiff) { minDiff = d; closest = swara; }
    }
    if (!closest || minDiff > this.TOLERANCE) return null;

    const target = this.swaraFreqs[closest] * Math.pow(2, octaveShift);
    const cents = 1200 * Math.log2(freq / target);
    const octave = freq < this.saHz ? -1 : freq < this.saHz * 2 ? 0 : 1;
    return { cents, note: closest, octave, isInRaga: isSwaraInRaga(closest, this.ragaName) };
  }

  stopDetection() {
    if (this.rafId) { cancelAnimationFrame(this.rafId); this.rafId = null; }
  }

  cleanup() {
    this.stopDetection();
    this.ready = false;
    this.source?.disconnect();
    this.stream?.getTracks().forEach(t => t.stop());
    this.ctx?.close();
    this.ctx = null;
    this.analyser = null;
    this.source = null;
    this.stream = null;
    this.detector = null;
  }
}
