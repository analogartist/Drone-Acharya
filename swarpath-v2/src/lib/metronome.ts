import * as Tone from 'tone';

export type SpeedMultiplier = 1 | 2 | 3 | 4; // barabar/dugun/tigun/chaugun

export class Metronome {
  private membrane: Tone.MembraneSynth | null = null;
  private noise: Tone.NoiseSynth | null = null;
  private intervalId: number | null = null;
  private _enabled = true;

  async init() {
    await Tone.start();
    this.membrane = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 6,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
    }).toDestination();
    this.noise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
    }).toDestination();
    this.membrane.volume.value = -10;
    this.noise.volume.value = -25;
  }

  get enabled() { return this._enabled; }
  set enabled(v: boolean) { this._enabled = v; }

  // Returns a cleanup function. Calls onBeat(beatIndex) on each tick.
  start(bpm: number, multiplier: SpeedMultiplier, onBeat: (beat: number) => void): () => void {
    this.stop();
    const effectiveBpm = bpm * multiplier;
    const ms = (60 / effectiveBpm) * 1000;
    let beat = 0;

    const tick = () => {
      onBeat(beat);
      if (this._enabled) this.click(beat === 0);
      beat++;
    };

    tick(); // first beat immediately
    this.intervalId = window.setInterval(tick, ms);
    return () => this.stop();
  }

  private click(isSam: boolean) {
    if (!this.membrane || !this.noise) return;
    const now = Tone.now();
    if (isSam) {
      this.membrane.triggerAttackRelease('C2', '16n', now);
      this.noise.triggerAttackRelease('16n', now);
    } else {
      this.membrane.triggerAttackRelease('G2', '32n', now);
    }
  }

  stop() {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  cleanup() {
    this.stop();
    this.membrane?.dispose();
    this.noise?.dispose();
    this.membrane = null;
    this.noise = null;
  }
}
