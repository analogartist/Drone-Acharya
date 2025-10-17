import { cn } from "@/lib/utils";

interface AudioLevelMeterProps {
  level: number; // 0 to 1
  isActive: boolean;
}

const AudioLevelMeter = ({ level, isActive }: AudioLevelMeterProps) => {
  // Convert level to percentage (0-100)
  const percentage = Math.min(100, level * 100);
  
  // Determine color based on level
  const getColorClass = () => {
    if (percentage < 10) return "bg-destructive";
    if (percentage < 30) return "bg-warning";
    return "bg-success";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Microphone Input</span>
        <span className={cn(
          "font-mono text-xs",
          isActive ? "text-foreground" : "text-muted-foreground"
        )}>
          {percentage.toFixed(0)}%
        </span>
      </div>
      
      {/* Visual meter */}
      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-100 rounded-full",
            isActive ? getColorClass() : "bg-muted-foreground/30"
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      {/* Status indicator */}
      <div className="flex items-center gap-2 text-xs">
        <div className={cn(
          "w-2 h-2 rounded-full transition-colors",
          isActive && percentage > 10 ? "bg-success animate-pulse" : "bg-muted-foreground"
        )} />
        <span className="text-muted-foreground">
          {!isActive ? "Paused" : percentage < 10 ? "Too quiet - speak louder" : "Listening..."}
        </span>
      </div>
    </div>
  );
};

export default AudioLevelMeter;
