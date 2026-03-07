import { useState, useEffect, useRef, useCallback } from 'react';
import PianoKeyboard from '@/components/PianoKeyboard';
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
  const [saHz, setSaHz] = useState(261.63);
  const [raga, setRaga] = useState('Yaman');
  const [palta, setPalta] = useState<string[]>([]);
  const [bpm, setBpm] = useState(60);
  const [speed, setSpeed] = useState<SpeedMultiplier>(1);
  const [metronomeOn, setMetronomeOn] = useState(true);
  const [showSettings, setShowSettings] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [pitchData, setPitchData] = useState<PitchResult | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [feedback, setFeedback] = useState<SwaraFeedback[]>([]);

  const engineRef = useRef<AudioEngine | null>(null);
  const tanpuraRef = useRef<Tanpura | null>(null);
  const metronomeRef = useRef<Metronome | null>(null);
  const stopMetronomeRef = useRef<(() => void) | null>(null);
  const levelRafRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

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

  useEffect(() => { engineRef.current?.setSa(saHz); void tanpuraRef.current?.setSa(saHz); }, [saHz]);
  useEffect(() => { engineRef.current?.setRaga(raga); }, [raga]);
  useEffect(() => { if (metronomeRef.current) metronomeRef.current.enabled = metronomeOn; }, [metronomeOn]);
  useEffect(() => { const r = ragaDefinitions[raga]; if (r) setPalta([...r.aroha, ...r.avaroha.slice(1)]); }, [raga]);

  const togglePlay = useCallback(async () => {
    if (!isReady) { await handleInit(); return; }
    if (isPlaying) {
      engineRef.current?.stopDetection();
      tanpuraRef.current?.stop();
      stopMetronomeRef.current?.();
      if (levelRafRef.current) { cancelAnimationFrame(levelRafRef.current); levelRafRef.current = null; }
      setIsPlaying(false); setCurrentBeat(0); return;
    }
    if (palta.length === 0) { alert('Set a palta first'); return; }
    setFeedback(palta.map((s) => ({ swara: s, status: 'pending' })));
    setCurrentBeat(0);
    await tanpuraRef.current?.start(saHz);
    await engineRef.current?.startDetection((result) => { if (mountedRef.current) setPitchData(result); });
    const pollLevel = () => { if (!mountedRef.current) return; setAudioLevel(engineRef.current?.audioLevel ?? 0); levelRafRef.current = requestAnimationFrame(pollLevel); };
    levelRafRef.current = requestAnimationFrame(pollLevel);
    let beatIndex = 0;
    stopMetronomeRef.current = metronomeRef.current!.start(bpm, speed, () => {
      if (!mountedRef.current) return;
      const idx = beatIndex % palta.length;
      setCurrentBeat(idx);
      setFeedback((prev) => { const next = [...prev]; next[idx] = { swara: palta[idx], status: 'active' }; return next; });
      beatIndex++;
    });
    setIsPlaying(true);
  }, [isReady, isPlaying, palta, saHz, bpm, speed, handleInit]);

  useEffect(() => {
    if (!isPlaying || !pitchData || palta.length === 0) return;
    const targetSwara = palta[currentBeat];
    if (!targetSwara) return;
    const targetBase = targetSwara.replace(/[.']/g, '');
    const detectedBase = pitchData.note;
    let status: SwaraFeedback['status'];
    if (detectedBase === targetBase && Math.abs(pitchData.cents) < 10) status = 'correct';
    else if (detectedBase === targetBase && Math.abs(pitchData.cents) < 30) status = 'close';
    else status = 'wrong';
    setFeedback((prev) => {
      const next = [...prev];
      if (next[currentBeat]?.status === 'active' || next[currentBeat]?.status === 'wrong') next[currentBeat] = { swara: targetSwara, status };
      else if (next[currentBeat]?.status === 'close' && status === 'correct') next[currentBeat] = { swara: targetSwara, status };
      return next;
    });
  }, [pitchData, currentBeat, isPlaying, palta]);

  return (
    <div className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      {/* Header */}
      <header className="header">
        <div className="header-inner">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎵</span>
            <div>
              <h1 className="text-lg font-bold tracking-tight">SwarPath</h1>
              <p className="text-xs text-[var(--color-text-muted)]">Riyaaz Companion</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-sm">
              <span className="badge">{raga}</span>
              <span className="text-[var(--color-text-muted)]">Sa = {saHz.toFixed(0)} Hz</span>
            </div>
            <button onClick={() => setShowSettings(!showSettings)} className="btn btn-ghost btn-sm">
              {showSettings ? 'Close' : 'Settings'}
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Play controls bar */}
        <div className="play-bar">
          <div className="flex items-center gap-4 flex-1">
            <button onClick={togglePlay} className={isPlaying ? 'play-btn play-btn--stop' : 'play-btn play-btn--start'}>
              {!isReady ? 'Initialize Audio' : isPlaying ? 'Stop' : 'Start Practice'}
            </button>
            <div className="flex-1 max-w-xs">
              <AudioMeter level={audioLevel} isActive={isPlaying} />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-3 text-sm text-[var(--color-text-muted)]">
            <span className="font-mono">{bpm * speed} BPM</span>
            <span className="opacity-30">|</span>
            <span>{metronomeOn ? 'Click ON' : 'Click OFF'}</span>
          </div>
        </div>

        {/* Settings panel (collapsible) */}
        {showSettings && (
          <div className="settings-grid">
            <div className="card" style={{ gridColumn: '1 / -1' }}><PianoKeyboard value={saHz} onChange={setSaHz} /></div>
            <div className="card"><RagaPicker value={raga} onChange={setRaga} /></div>
            <div className="card"><PaltaInput value={palta} onChange={setPalta} currentRaga={raga} /></div>
            <div className="card">
              <TempoControls bpm={bpm} onBpmChange={setBpm} speed={speed} onSpeedChange={setSpeed} metronomeOn={metronomeOn} onMetronomeToggle={() => setMetronomeOn((v) => !v)} />
            </div>
          </div>
        )}

        {/* Main practice area */}
        <div className="practice-area">
          <PaltaRunner swaras={palta} currentIndex={currentBeat} isPlaying={isPlaying} feedback={feedback} />
          <PitchDisplay pitchData={pitchData} isActive={isPlaying} targetSwara={palta[currentBeat] ?? null} />
        </div>
      </main>
    </div>
  );
}
