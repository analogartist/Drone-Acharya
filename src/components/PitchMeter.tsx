import { cn } from "@/lib/utils";
import { PitchResult } from "@/lib/audioEngine";
import { ragaDefinitions, formatSwaraWithOctave } from "@/lib/ragaSystem";

interface PitchMeterProps {
  isActive: boolean;
  pitchData: PitchResult | null;
  currentRaga: string;
}

const PitchMeter = ({ isActive, pitchData, currentRaga }: PitchMeterProps) => {
  const pitchDeviation = pitchData?.cents || 0;
  
  const getPitchState = (): "perfect" | "close" | "off" | "outOfRaga" => {
    if (!isActive || !pitchData) return "perfect";
    
    // Check if note is in raga first
    if (!pitchData.isInRaga) return "outOfRaga";
    
    const absCents = Math.abs(pitchDeviation);
    if (absCents < 10) return "perfect";
    if (absCents < 30) return "close";
    return "off";
  };

  const pitchState = getPitchState();

  const getIndicatorColor = () => {
    switch (pitchState) {
      case "perfect":
        return "bg-success";
      case "close":
        return "bg-warning";
      case "off":
        return "bg-destructive";
      case "outOfRaga":
        return "bg-muted-foreground/50";
      default:
        return "bg-muted";
    }
  };

  const getIndicatorPosition = () => {
    const clampedDeviation = Math.max(-50, Math.min(50, pitchDeviation));
    return 50 + clampedDeviation;
  };

  return (
    <div className="space-y-4">
      {/* Pitch Scale */}
      <div className="relative h-32 bg-muted/30 rounded-lg overflow-hidden">
        {/* Center Line */}
        <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-foreground/20" />
        
        {/* Scale Markers */}
        <div className="absolute inset-0 flex items-center justify-around px-4">
          {[-50, -25, 0, 25, 50].map((cents) => (
            <div key={cents} className="text-xs text-muted-foreground font-mono">
              {cents > 0 ? `+${cents}` : cents}¢
            </div>
          ))}
        </div>

        {/* Active Indicator */}
        {isActive && (
          <div
            className={cn(
              "absolute top-1/2 -translate-y-1/2 w-2 h-20 rounded-full transition-all duration-300",
              getIndicatorColor(),
              pitchState === "perfect" && "shadow-glow"
            )}
            style={{
              left: `${getIndicatorPosition()}%`,
              transform: `translateX(-50%) translateY(-50%)`,
            }}
          />
        )}
      </div>

      {/* Status Text */}
      <div className="text-center space-y-1">
        <p
          className={cn(
            "text-sm font-medium transition-colors",
            pitchState === "perfect" && "text-success",
            pitchState === "close" && "text-warning",
            pitchState === "off" && "text-destructive",
            pitchState === "outOfRaga" && "text-muted-foreground",
            !isActive && "text-muted-foreground"
          )}
        >
          {isActive
            ? pitchState === "perfect"
              ? "Perfect Sur! 🎯"
              : pitchState === "close"
              ? "Almost there..."
              : pitchState === "outOfRaga"
              ? "Not in this raga"
              : "Adjust your pitch"
            : "Ready to practice"}
        </p>
        {isActive && pitchData && (
          <p className="text-xs text-muted-foreground">
            {formatSwaraWithOctave(pitchData.note, pitchData.octave)} 
            {" • "}
            {pitchData.octave === -1 ? "Mandra" : pitchData.octave === 1 ? "Taar" : "Madhya"} Saptak
          </p>
        )}
      </div>

      {/* Swara Reference - Show only swaras in current raga */}
      <div className="flex justify-center gap-2 text-xs flex-wrap">
        {ragaDefinitions[currentRaga]?.swaras.map((swara, i) => {
          const isCurrentSwara = pitchData?.note === swara && isActive && pitchData.octave === 0;
          
          return (
            <div
              key={i}
              className={cn(
                "px-3 py-1 rounded-full transition-all",
                isCurrentSwara && pitchState === "perfect"
                  ? "bg-success text-success-foreground font-semibold shadow-glow"
                  : isCurrentSwara && pitchState === "close"
                  ? "bg-warning text-warning-foreground font-semibold"
                  : isCurrentSwara && pitchState === "outOfRaga"
                  ? "bg-muted text-muted-foreground font-semibold"
                  : isCurrentSwara
                  ? "bg-destructive/20 text-foreground font-semibold"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {swara}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PitchMeter;
