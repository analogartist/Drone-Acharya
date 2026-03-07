import * as Tone from 'tone';

export class Tanpura {
  private synth: Tone.FMSynth | null = null;
  private filter: Tone.AutoFilter | null = null;
  private playing = false;

  async init() {
    await Tone.start();
    this.synth = new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 10,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.5, decay: 2, sustain: 0.8, release: 3 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 },
    });
    this.filter = new Tone.AutoFilter('0.5hz').toDestination();
    this.filter.start();
    this.synth.connect(this.filter);
    this.synth.volume.value = -20;
  }

  start(saHz: number) {
    if (!this.synth) return;
    this.stop();
    this.synth.triggerAttack(Tone.Frequency(saHz, 'hz').toNote());
    this.playing = true;
  }

  setSa(saHz: number) {
    if (this.synth && this.playing) {
      this.synth.frequency.rampTo(saHz, 0.5);
    }
  }

  stop() {
    if (this.synth && this.playing) {
      this.synth.triggerRelease();
      this.playing = false;
    }
  }

  get isPlaying() { return this.playing; }

  cleanup() {
    this.stop();
    this.synth?.dispose();
    this.filter?.dispose();
    this.synth = null;
    this.filter = null;
  }
}
