import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, Settings } from "lucide-react";
import PitchMeter from "@/components/PitchMeter";
import BeatIndicator from "@/components/BeatIndicator";
import RagaSelector from "@/components/RagaSelector";
import AudioLevelMeter from "@/components/AudioLevelMeter";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { AudioEngine, TanpuraGenerator, TablaGenerator, PitchResult } from "@/lib/audioEngine";
import * as Tone from "tone";

interface PracticeStageProps {
  onBack: () => void;
}

const PracticeStage = ({ onBack }: PracticeStageProps) => {
  const { toast } = useToast();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedRaga, setSelectedRaga] = useState("Yaman");
  const [selectedTaal, setSelectedTaal] = useState("Teentaal");
  const [pitchData, setPitchData] = useState<PitchResult | null>(null);
  const [currentBeat, setCurrentBeat] = useState(0);
  const [sessionTime, setSessionTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const tanpuraRef = useRef<TanpuraGenerator | null>(null);
  const tablaRef = useRef<TablaGenerator | null>(null);
  const beatIntervalRef = useRef<number | null>(null);
  const sessionTimerRef = useRef<number | null>(null);
  const audioLevelAnimationRef = useRef<number | null>(null);

  // Initialize audio engines
  useEffect(() => {
    const initAudio = async () => {
      try {
      audioEngineRef.current = new AudioEngine();
      await audioEngineRef.current.initialize();
      // Set initial raga
      audioEngineRef.current.setRaga(selectedRaga);
        
        tanpuraRef.current = new TanpuraGenerator();
        await tanpuraRef.current.initialize();
        
        tablaRef.current = new TablaGenerator();
        await tablaRef.current.initialize();
        
        setIsInitialized(true);
        
        toast({
          title: "Ready to practice",
          description: "Microphone connected successfully",
        });
      } catch (error) {
        console.error("Failed to initialize audio:", error);
        toast({
          title: "Audio Error",
          description: error instanceof Error ? error.message : "Failed to access microphone",
          variant: "destructive",
        });
      }
    };

    initAudio();

    return () => {
      audioEngineRef.current?.cleanup();
      tanpuraRef.current?.cleanup();
      tablaRef.current?.cleanup();
      if (beatIntervalRef.current) clearInterval(beatIntervalRef.current);
      if (sessionTimerRef.current) clearInterval(sessionTimerRef.current);
    };
  }, [selectedRaga]);

  const handleRagaChange = (raga: string) => {
    setSelectedRaga(raga);
    
    // Update audio engine with new raga
    if (audioEngineRef.current) {
      audioEngineRef.current.setRaga(raga);
    }
    
    toast({
      title: `Switched to Raga ${raga}`,
      description: `Pitch detection updated for ${raga} swaras`,
    });
  };

  // Handle practice start/stop
  const togglePractice = () => {
    if (!isInitialized) {
      toast({
        title: "Not Ready",
        description: "Audio system is still initializing",
        variant: "destructive",
      });
      return;
    }

    if (isPlaying) {
      // Stop practice
      audioEngineRef.current?.stopPitchDetection();
      tanpuraRef.current?.stop();
      
      if (audioLevelAnimationRef.current) {
        cancelAnimationFrame(audioLevelAnimationRef.current);
        audioLevelAnimationRef.current = null;
      }
      
      if (beatIntervalRef.current) {
        clearInterval(beatIntervalRef.current);
        beatIntervalRef.current = null;
      }
      
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
        sessionTimerRef.current = null;
      }
      setCurrentBeat(0);
    } else {
      // Start practice - ensure Tone.js is started first
      const startPractice = async () => {
        try {
          // Ensure Tone.js audio context is running
          await Tone.start();
          console.log("Tone.js audio context started");
          
          audioEngineRef.current?.startPitchDetection((result) => {
            console.log("Pitch detected in UI:", result);
            setPitchData(result);
          });
          
          // Update audio level continuously
          const updateAudioLevel = () => {
            if (audioEngineRef.current && audioLevelAnimationRef.current !== null) {
              const level = audioEngineRef.current.getAudioLevel();
              setAudioLevel(level);
              audioLevelAnimationRef.current = requestAnimationFrame(updateAudioLevel);
            }
          };
          audioLevelAnimationRef.current = requestAnimationFrame(updateAudioLevel);
          
          tanpuraRef.current?.start(130.81); // Sa = C3 (base frequency)
          console.log("Tanpura started");
          
          // Start tabla beats
          const totalBeats = selectedTaal === "Teentaal" ? 16 : 6;
          const bpm = 80; // Beats per minute
          const beatInterval = (60 / bpm) * 1000;
          
          let beat = 0;
          beatIntervalRef.current = window.setInterval(() => {
            const isSam = beat === 0;
            tablaRef.current?.playBeat(isSam);
            console.log(`Tabla beat ${beat}${isSam ? ' (Sam)' : ''}`);
            setCurrentBeat(beat);
            beat = (beat + 1) % totalBeats;
          }, beatInterval);

          // Start session timer
          sessionTimerRef.current = window.setInterval(() => {
            setSessionTime(prev => prev + 1);
          }, 1000);
        } catch (error) {
          console.error("Failed to start practice:", error);
          toast({
            title: "Audio Error",
            description: "Failed to start audio playback",
            variant: "destructive",
          });
          return;
        }
      };
      
      startPractice();
    }

    setIsPlaying(!isPlaying);
  };

  // Format session time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="mr-2 w-4 h-4" />
            Back
          </Button>
          
          <div className="text-center">
            <h2 className="font-semibold text-lg">{selectedRaga}</h2>
            <p className="text-sm text-muted-foreground">{selectedTaal}</p>
          </div>

          <Button variant="ghost" size="icon">
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Main Practice Area */}
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Panel - Controls */}
          <Card className="lg:col-span-1 p-6 space-y-6 shadow-soft">
            <div>
              <h3 className="font-semibold mb-4">Raga Selection</h3>
              <RagaSelector value={selectedRaga} onChange={handleRagaChange} />
            </div>

            <div>
              <h3 className="font-semibold mb-4">Taal</h3>
              <div className="space-y-2">
                <Button
                  variant={selectedTaal === "Teentaal" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedTaal("Teentaal")}
                >
                  Teentaal (16 beats)
                </Button>
                <Button
                  variant={selectedTaal === "Dadra" ? "default" : "outline"}
                  className="w-full justify-start"
                  onClick={() => setSelectedTaal("Dadra")}
                >
                  Dadra (6 beats)
                </Button>
              </div>
            </div>

            <div className="pt-4">
              <Button
                size="lg"
                className="w-full shadow-glow"
                onClick={togglePractice}
                disabled={!isInitialized}
              >
                {isPlaying ? (
                  <>
                    <Pause className="mr-2 w-5 h-5" />
                    Pause Practice
                  </>
                ) : (
                  <>
                    <Play className="mr-2 w-5 h-5" />
                    {isInitialized ? "Start Practice" : "Initializing..."}
                  </>
                )}
              </Button>
            </div>

            {/* Audio Level Meter */}
            <div className="pt-4">
              <AudioLevelMeter level={audioLevel} isActive={isPlaying} />
            </div>

            <div className="pt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Session Time</span>
                <span className="font-mono">{formatTime(sessionTime)}</span>
              </div>
              <div className="flex justify-between">
                <span>Current Note</span>
                <span className="font-mono text-primary">
                  {pitchData?.note || "--"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Frequency</span>
                <span className="font-mono text-muted-foreground">
                  {pitchData?.frequency ? `${pitchData.frequency.toFixed(1)} Hz` : "--"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Clarity</span>
                <span className="font-mono text-muted-foreground">
                  {pitchData?.clarity ? `${(pitchData.clarity * 100).toFixed(0)}%` : "--"}
                </span>
              </div>
            </div>
          </Card>

          {/* Center Panel - Visual Feedback */}
          <Card className="lg:col-span-2 p-8 shadow-soft">
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold mb-4 text-center">Pitch (Sur) Detection</h3>
                <PitchMeter 
                  isActive={isPlaying} 
                  pitchData={pitchData}
                  currentRaga={selectedRaga}
                />
              </div>

              <div>
                <h3 className="font-semibold mb-4 text-center">Beat (Taal) Alignment</h3>
                <BeatIndicator 
                  isActive={isPlaying} 
                  totalBeats={selectedTaal === "Teentaal" ? 16 : 6}
                  currentBeat={currentBeat}
                />
              </div>

              {!isPlaying && (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-lg">Click "Start Practice" to begin your riyaaz</p>
                  <p className="text-sm mt-2">Grant microphone access when prompted</p>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Tips */}
        <Card className="mt-6 p-6 bg-primary/5 border-primary/20">
          <div className="flex gap-4">
            <div className="text-3xl">💡</div>
            <div className="space-y-2">
              <h4 className="font-semibold">Practice Tips</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Green indicator = perfect sur, keep it up!</li>
                <li>• Yellow = slight drift, adjust your pitch</li>
                <li>• Red = off-pitch, return to the swara</li>
                <li>• Sam (first beat) glows brighter to mark the cycle</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PracticeStage;
