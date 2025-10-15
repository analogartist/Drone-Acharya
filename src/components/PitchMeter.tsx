import { cn } from "@/lib/utils";
import { PitchResult } from "@/lib/audioEngine";

interface PitchMeterProps {
  isActive: boolean;
  pitchData: PitchResult | null;
}

const PitchMeter = ({ isActive, pitchData }: PitchMeterProps) => {
  const pitchDeviation = pitchData?.cents || 0;
  
  const getPitchState = (): "perfect" | "close" | "off" => {
    if (!isActive || !pitchData) return "perfect";
    
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
      <div className="text-center">
        <p
          className={cn(
            "text-sm font-medium transition-colors",
            pitchState === "perfect" && "text-success",
            pitchState === "close" && "text-warning",
            pitchState === "off" && "text-destructive",
            !isActive && "text-muted-foreground"
          )}
        >
          {isActive
            ? pitchState === "perfect"
              ? "Perfect Sur! 🎯"
              : pitchState === "close"
              ? "Almost there..."
              : "Adjust your pitch"
            : "Ready to practice"}
        </p>
      </div>

      {/* Swara Reference */}
      <div className="flex justify-center gap-2 text-xs">
        {["Sa", "Re", "Ga", "Ma", "Pa", "Dha", "Ni", "Sa'"].map((swara, i) => {
          const swaraName = swara.replace("'", "");
          const isCurrentSwara = pitchData?.note === swaraName && isActive;
          
          return (
            <div
              key={i}
              className={cn(
                "px-3 py-1 rounded-full transition-all",
                isCurrentSwara && pitchState === "perfect"
                  ? "bg-success text-success-foreground font-semibold shadow-glow"
                  : isCurrentSwara && pitchState === "close"
                  ? "bg-warning text-warning-foreground font-semibold"
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
