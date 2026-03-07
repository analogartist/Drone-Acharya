import { useState, useEffect, useRef, useCallback } from 'react';
import SaSelector from '@/components/SaSelector';
import RagaPicker from '@/components/RagaPicker';
import PaltaInput from '@/components/PaltaInput';
import TempoControls from '@/components/TempoControls';
import PaltaRunner, { type SwaraFeedback } from '@/components/PaltaRunner';
import PitchDisplay from '@/components/PitchDisplay';
import AudioMeter from '@/components/AudioMeter';
import { AudioEngine, type PitchResult } from '@/lib/audioEngine';
import { Tanpura } from '@/lib/tanpura';
import { Metronome, type SpeedMultiplier } from '@/lib/metronome';
import { ragaDefinitions } from '@/lib/ragaSystem';
import * as Tone from 'tone';

export default function App() {
  // Settings
  const [saHz, setSaHz] = useState(261.63); // C4
  const [raga, setRaga] = useState('Yaman');
  const [palta, setPalta] = useState<string[]>([]);
  const [bpm, setBpm] = useState(60);
  const [speed, setSpeed] = useState<SpeedMultiplier>(1);
  const [metronomeOn, setMetronomeOn] = useState(true);

  // Runtime state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [pitchData, setPitchData] = useState<PitchResult | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [feedback, setFeedback] = useState<SwaraFeedback[]>([]);

  // Refs
  const engineRef = useRef<AudioEngine | null>(null);
  const tanpuraRef = useRef<Tanpura | null>(null);
  const metronomeRef = useRef<Metronome | null>(null);
  const stopMetronomeRef = useRef<(() => void) | null>(null);
  const levelRafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  // Initialize audio on first user interaction
  const handleInit = useCallback(async () => {
    if (isReady) return;
    try {
      await Tone.start();

      const engine = new AudioEngine();
      await engine.init();
      engine.setSa(saHz);
      engine.setRaga(raga);
      engineRef.current = engine;

      const tanpura = new Tanpura();
      await tanpura.init();
      tanpuraRef.current = tanpura;

      const met = new Metronome();
      await met.init();
      metronomeRef.current = met;

      setIsReady(true);
    } catch (err) {
      console.error('Init failed:', err);
      alert('Microphone access is required. Please allow and reload.');
    }
  }, [isReady, saHz, raga]);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      engineRef.current?.cleanup();
      tanpuraRef.current?.cleanup();
      metronomeRef.current?.cleanup();
      stopMetronomeRef.current?.();
      if (levelRafRef.current) cancelAnimationFrame(levelRafRef.current);
    };
  }, []);

  // Update engine when Sa or Raga changes
  useEffect(() => {
    engineRef.current?.setSa(saHz);
    tanpuraRef.current?.setSa(saHz);
  }, [saHz]);

  useEffect(() => {
    engineRef.current?.setRaga(raga);
  }, [raga]);

  // Update metronome enabled state
  useEffect(() => {
    if (metronomeRef.current) metronomeRef.current.enabled = metronomeOn;
  }, [metronomeOn]);

  // Set default palta when raga changes
  useEffect(() => {
    const r = ragaDefinitions[raga];
    if (r) setPalta([...r.aroha, ...r.avaroha.slice(1)]);
  }, [raga]);

  // Start / Stop practice
  const togglePlay = useCallback(async () => {
    if (!isReady) {
      await handleInit();
      return;
    }

    if (isPlaying) {
      // STOP
      engineRef.current?.stopDetection();
      tanpuraRef.current?.stop();
      stopMetronomeRef.current?.();
      if (levelRafRef.current) {
        cancelAnimationFrame(levelRafRef.current);
        levelRafRef.current = null;
      }
      setIsPlaying(false);
      setCurrentBeat(0);
      return;
    }

    // START
    if (palta.length === 0) {
      alert('Set a palta first');
      return;
    }

    // Reset feedback
    setFeedback(palta.map((s) => ({ swara: s, status: 'pending' })));
    setCurrentBeat(0);

    // Start tanpura
    tanpuraRef.current?.start(saHz);

    // Start pitch detection
    await engineRef.current?.startDetection((result) => {
      if (!mountedRef.current) return;
      setPitchData(result);
    });

    // Audio level polling
    const pollLevel = () => {
      if (!mountedRef.current) return;
      setAudioLevel(engineRef.current?.audioLevel ?? 0);
      levelRafRef.current = requestAnimationFrame(pollLevel);
    };
    levelRafRef.current = requestAnimationFrame(pollLevel);

    // Start metronome — each tick advances the palta cursor
    let beatIndex = 0;
    stopMetronomeRef.current = metronomeRef.current!.start(bpm, speed, () => {
      if (!mountedRef.current) return;
      const idx = beatIndex % palta.length;
      setCurrentBeat(idx);

      // Mark current as active
      setFeedback((prev) => {
        const next = [...prev];
        next[idx] = { swara: palta[idx], status: 'active' };
        return next;
      });

      beatIndex++;
    });

    setIsPlaying(true);
  }, [isReady, isPlaying, palta, saHz, bpm, speed, handleInit]);

  // Evaluate pitch against current palta swara for feedback
  useEffect(() => {
    if (!isPlaying || !pitchData || palta.length === 0) return;

    const targetSwara = palta[currentBeat];
    if (!targetSwara) return;

    const targetBase = targetSwara.replace(/[.']/g, '');
    const detectedBase = pitchData.note;

    let status: SwaraFeedback['status'];
    if (detectedBase === targetBase && Math.abs(pitchData.cents) < 10) {
      status = 'correct';
    } else if (detectedBase === targetBase && Math.abs(pitchData.cents) < 30) {
      status = 'close';
    } else {
      status = 'wrong';
    }

    setFeedback((prev) => {
      const next = [...prev];
      if (next[currentBeat]?.status === 'active' || next[currentBeat]?.status === 'wrong') {
        next[currentBeat] = { swara: targetSwara, status };
      } else if (next[currentBeat]?.status === 'close' && status === 'correct') {
        next[currentBeat] = { swara: targetSwara, status };
      }
      return next;
    });
  }, [pitchData, currentBeat, isPlaying, palta]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Header */}
      <header className="border-b border-[var(--color-border)] px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold tracking-tight">SwarPath</h1>
          <div className="text-sm text-[var(--color-text-muted)]">
            {raga} &middot; Sa = {saHz.toFixed(0)} Hz
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-[320px_1fr] gap-6">
          {/* Left Panel - Controls */}
          <aside className="space-y-6">
            <SaSelector value={saHz} onChange={setSaHz} />
            <RagaPicker value={raga} onChange={setRaga} />
            <PaltaInput value={palta} onChange={setPalta} currentRaga={raga} />
            <TempoControls
              bpm={bpm}
              onBpmChange={setBpm}
              speed={speed}
              onSpeedChange={setSpeed}
              metronomeOn={metronomeOn}
              onMetronomeToggle={() => setMetronomeOn((v) => !v)}
            />

            {/* Play button */}
            <button
              onClick={togglePlay}
              className="btn btn-primary btn-lg w-full"
            >
              {!isReady ? 'Initialize Audio' : isPlaying ? 'Stop' : 'Start Practice'}
            </button>

            <AudioMeter level={audioLevel} isActive={isPlaying} />
          </aside>

          {/* Right Panel - Visual */}
          <div className="space-y-6">
            <PaltaRunner
              swaras={palta}
              currentIndex={currentBeat}
              isPlaying={isPlaying}
              feedback={feedback}
            />
            <PitchDisplay
              pitchData={pitchData}
              isActive={isPlaying}
              targetSwara={palta[currentBeat] ?? null}
            />
          </div>
        </div>
      </main>
    </div>
  );
}
