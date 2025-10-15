import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface PitchMeterProps {
  isActive: boolean;
}

const PitchMeter = ({ isActive }: PitchMeterProps) => {
  const [pitchDeviation, setPitchDeviation] = useState(0);
  const [pitchState, setPitchState] = useState<"perfect" | "close" | "off">("perfect");

  // Simulate pitch changes for demo
  useEffect(() => {
    if (!isActive) {
      setPitchDeviation(0);
      setPitchState("perfect");
      return;
    }

    const interval = setInterval(() => {
      const randomDeviation = (Math.random() - 0.5) * 100;
      setPitchDeviation(randomDeviation);

      if (Math.abs(randomDeviation) < 10) {
        setPitchState("perfect");
      } else if (Math.abs(randomDeviation) < 30) {
        setPitchState("close");
      } else {
        setPitchState("off");
      }
    }, 500);

    return () => clearInterval(interval);
  }, [isActive]);

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
        {["Sa", "Re", "Ga", "Ma", "Pa", "Dha", "Ni", "Sa'"].map((swara, i) => (
          <div
            key={i}
            className={cn(
              "px-3 py-1 rounded-full transition-all",
              i === 2 && isActive && pitchState === "perfect"
                ? "bg-success text-success-foreground font-semibold"
                : "bg-muted text-muted-foreground"
            )}
          >
            {swara}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PitchMeter;
