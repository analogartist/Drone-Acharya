import * as Tone from 'tone';

/**
 * Tanpura drone using layered plucked-string simulation.
 * 4-string cycle: Pa(low), Sa, Sa, Sa(low) — the traditional stringing.
 * Each "pluck" uses a PluckSynth with rich harmonics, routed through
 * a gentle reverb and subtle chorus for the jivari shimmer.
 */
export class Tanpura {
  private strings: Tone.PluckSynth[] = [];
  private reverb: Tone.Reverb | null = null;
  private chorus: Tone.Chorus | null = null;
  private gain: Tone.Gain | null = null;
  private loopId: number | null = null;
  private playing = false;
  private saHz = 261.63;

  // The 4-string cycle (relative to Sa)
  // Traditional: Pa(low octave), Sa, Sa, Sa(low octave)
  private getStringFreqs(): number[] {
    const saLow = this.saHz / 2;
    const pa = this.saHz * 3 / 4; // Pa in lower octave (Sa/2 * 3/2)
    return [pa, this.saHz, this.saHz, saLow];
  }

  async init() {
    await Tone.start();

    // Effects chain: chorus → reverb → gain → destination
    this.gain = new Tone.Gain(0.6).toDestination();
    this.reverb = new Tone.Reverb({ decay: 4, wet: 0.35 });
    await this.reverb.generate();
    this.reverb.connect(this.gain);
    this.chorus = new Tone.Chorus({ frequency: 0.3, delayTime: 3.5, depth: 0.15, wet: 0.25 });
    this.chorus.connect(this.reverb);
    this.chorus.start();

    // Create 4 pluck synths (one per string)
    for (let i = 0; i < 4; i++) {
      const pluck = new Tone.PluckSynth({
        attackNoise: 1.2,
        dampening: 3000,
        resonance: 0.985,
        release: 2,
      });
      pluck.volume.value = -8;
      pluck.connect(this.chorus);
      this.strings.push(pluck);
    }
  }

  start(saHz: number) {
    if (this.strings.length === 0) return;
    this.stop();
    this.saHz = saHz;
    this.playing = true;
    this.runCycle();
  }

  private runCycle() {
    if (!this.playing) return;
    const freqs = this.getStringFreqs();
    const interval = 600; // ms between each pluck
    let step = 0;

    const pluck = () => {
      if (!this.playing) return;
      const idx = step % 4;
      const freq = freqs[idx];
      try {
        this.strings[idx].triggerAttackRelease(
          Tone.Frequency(freq, 'hz').toNote(),
          2.0
        );
      } catch {
        // Tone.js can throw if context is suspended
      }
      step++;
      this.loopId = window.setTimeout(pluck, interval);
    };
    pluck();
  }

  setSa(saHz: number) {
    this.saHz = saHz;
    // Cycle will pick up the new freqs on the next pluck
  }

  stop() {
    this.playing = false;
    if (this.loopId !== null) {
      clearTimeout(this.loopId);
      this.loopId = null;
    }
  }

  get isPlaying() { return this.playing; }

  cleanup() {
    this.stop();
    this.strings.forEach((s) => s.dispose());
    this.strings = [];
    this.chorus?.dispose();
    this.reverb?.dispose();
    this.gain?.dispose();
    this.chorus = null;
    this.reverb = null;
    this.gain = null;
  }
}
