/**
 * Tanpura drone using offline-rendered sample buffers.
 *
 * Instead of real-time synthesis, we render a realistic tanpura string pluck
 * offline using additive synthesis with jivari (bridge-buzz) harmonics.
 * The buffer is rendered once at a reference pitch, then played back with
 * rate adjustment for the selected Sa.
 *
 * 4-string cycle: Pa(low), Sa, Sa, Sa(low) — traditional stringing.
 */

const REFERENCE_HZ = 261.63; // C4 — the pitch at which we render the base sample
const SAMPLE_RATE = 44100;
const PLUCK_DURATION = 5; // seconds per string pluck
const CYCLE_INTERVAL = 0.6; // seconds between each pluck

// Render a single tanpura string pluck as an AudioBuffer using additive synthesis.
// Models the jivari buzz: harmonics 2–6 have slow amplitude modulation,
// higher harmonics decay faster, and the fundamental sustains long.
function renderStringBuffer(ctx: OfflineAudioContext, freq: number): void {
  const numHarmonics = 18;

  for (let h = 1; h <= numHarmonics; h++) {
    const hFreq = freq * h;
    if (hFreq > SAMPLE_RATE / 2) break;

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = hFreq;

    const gain = ctx.createGain();

    // Harmonic amplitude: fundamental strong, upper partials drop off
    // but harmonics 2-6 are boosted slightly (jivari effect)
    let amp: number;
    if (h === 1) amp = 0.35;
    else if (h <= 6) amp = 0.18 / h;
    else amp = 0.06 / h;

    // Envelope: gentle attack, long sustain, natural decay
    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(amp, now + 0.02); // fast attack

    // Jivari: harmonics 2–8 get slow amplitude modulation (the "buzz")
    if (h >= 2 && h <= 8) {
      const modRate = 0.4 + h * 0.1; // slightly different rate per harmonic
      const modDepth = 0.3;
      const steps = 20;
      for (let s = 0; s < steps; s++) {
        const t = now + 0.02 + (s / steps) * (PLUCK_DURATION - 0.5);
        const decay = Math.exp(-t * (0.3 + h * 0.08));
        const mod = 1 - modDepth * (0.5 + 0.5 * Math.sin(2 * Math.PI * modRate * (t - now)));
        gain.gain.linearRampToValueAtTime(amp * decay * mod, t);
      }
    } else {
      // Simple exponential decay for fundamental and high harmonics
      const decayRate = h === 1 ? 0.15 : 0.4 + h * 0.05;
      const steps = 10;
      for (let s = 0; s < steps; s++) {
        const t = now + 0.02 + (s / steps) * (PLUCK_DURATION - 0.5);
        const decay = Math.exp(-t * decayRate);
        gain.gain.linearRampToValueAtTime(amp * decay, t);
      }
    }

    gain.gain.linearRampToValueAtTime(0, now + PLUCK_DURATION - 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + PLUCK_DURATION);
  }
}

async function createStringBuffer(baseFreq: number): Promise<AudioBuffer> {
  const ctx = new OfflineAudioContext(1, SAMPLE_RATE * PLUCK_DURATION, SAMPLE_RATE);
  renderStringBuffer(ctx, baseFreq);
  return ctx.startRendering();
}

export class Tanpura {
  private ctx: AudioContext | null = null;
  private buffers: { sa: AudioBuffer | null; saLow: AudioBuffer | null; pa: AudioBuffer | null } = {
    sa: null, saLow: null, pa: null,
  };
  private activeSources: AudioBufferSourceNode[] = [];
  private gainNode: GainNode | null = null;
  private loopId: number | null = null;
  private playing = false;
  private saHz = REFERENCE_HZ;
  private renderedForHz = 0;

  async init() {
    this.ctx = new AudioContext({ sampleRate: SAMPLE_RATE });
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 0.7;
    this.gainNode.connect(this.ctx.destination);
    // Pre-render buffers at the reference pitch
    await this.renderBuffers(REFERENCE_HZ);
  }

  private async renderBuffers(hz: number) {
    if (this.renderedForHz === hz) return;
    const [sa, saLow, pa] = await Promise.all([
      createStringBuffer(hz),
      createStringBuffer(hz / 2),
      createStringBuffer(hz * 3 / 4), // Pa in lower octave
    ]);
    this.buffers = { sa, saLow, pa };
    this.renderedForHz = hz;
  }

  // Play a single buffer with optional playback rate adjustment
  private playBuffer(buffer: AudioBuffer, rate: number) {
    if (!this.ctx || !this.gainNode) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.playbackRate.value = rate;
    src.connect(this.gainNode);
    src.start();
    this.activeSources.push(src);
    src.onended = () => {
      const idx = this.activeSources.indexOf(src);
      if (idx !== -1) this.activeSources.splice(idx, 1);
    };
  }

  async start(saHz: number) {
    if (!this.ctx || !this.gainNode) return;
    this.stop();
    this.saHz = saHz;

    // Render new buffers if Sa changed significantly
    if (Math.abs(this.saHz - this.renderedForHz) > 0.5) {
      await this.renderBuffers(this.saHz);
    }

    if (this.ctx.state === 'suspended') await this.ctx.resume();
    this.playing = true;

    // The playback rate is 1.0 when saHz matches renderedForHz
    const rate = this.saHz / this.renderedForHz;

    // Traditional 4-string cycle: Pa(low), Sa, Sa, Sa(low)
    const cycle = [
      this.buffers.pa!,
      this.buffers.sa!,
      this.buffers.sa!,
      this.buffers.saLow!,
    ];

    let step = 0;
    const pluck = () => {
      if (!this.playing) return;
      const buf = cycle[step % 4];
      this.playBuffer(buf, rate);
      step++;
      this.loopId = window.setTimeout(pluck, CYCLE_INTERVAL * 1000);
    };
    pluck();
  }

  async setSa(saHz: number) {
    this.saHz = saHz;
    if (this.playing) {
      // Re-render and restart with the new Sa
      await this.renderBuffers(saHz);
      // The cycle loop will pick up new buffers, but we also need the new rate
      // Simplest: restart
      this.stop();
      await this.start(saHz);
    }
  }

  stop() {
    this.playing = false;
    if (this.loopId !== null) {
      clearTimeout(this.loopId);
      this.loopId = null;
    }
    // Stop all active sources
    for (const src of this.activeSources) {
      try { src.stop(); } catch { /* already stopped */ }
    }
    this.activeSources = [];
  }

  get isPlaying() { return this.playing; }

  cleanup() {
    this.stop();
    this.ctx?.close();
    this.ctx = null;
    this.gainNode = null;
    this.buffers = { sa: null, saLow: null, pa: null };
  }
}
