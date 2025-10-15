import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Play, Pause, Settings } from "lucide-react";
import PitchMeter from "@/components/PitchMeter";
import BeatIndicator from "@/components/BeatIndicator";
import RagaSelector from "@/components/RagaSelector";
import { Card } from "@/components/ui/card";

interface PracticeStageProps {
  onBack: () => void;
}

const PracticeStage = ({ onBack }: PracticeStageProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedRaga, setSelectedRaga] = useState("Yaman");
  const [selectedTaal, setSelectedTaal] = useState("Teentaal");

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
              <RagaSelector value={selectedRaga} onChange={setSelectedRaga} />
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
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? (
                  <>
                    <Pause className="mr-2 w-5 h-5" />
                    Pause Practice
                  </>
                ) : (
                  <>
                    <Play className="mr-2 w-5 h-5" />
                    Start Practice
                  </>
                )}
              </Button>
            </div>

            <div className="pt-4 space-y-2 text-sm text-muted-foreground">
              <div className="flex justify-between">
                <span>Session Time</span>
                <span className="font-mono">00:00</span>
              </div>
              <div className="flex justify-between">
                <span>Sur Accuracy</span>
                <span className="font-mono text-success">--</span>
              </div>
              <div className="flex justify-between">
                <span>Taal Sync</span>
                <span className="font-mono text-success">--</span>
              </div>
            </div>
          </Card>

          {/* Center Panel - Visual Feedback */}
          <Card className="lg:col-span-2 p-8 shadow-soft">
            <div className="space-y-8">
              <div>
                <h3 className="font-semibold mb-4 text-center">Pitch (Sur) Detection</h3>
                <PitchMeter isActive={isPlaying} />
              </div>

              <div>
                <h3 className="font-semibold mb-4 text-center">Beat (Taal) Alignment</h3>
                <BeatIndicator 
                  isActive={isPlaying} 
                  totalBeats={selectedTaal === "Teentaal" ? 16 : 6}
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
