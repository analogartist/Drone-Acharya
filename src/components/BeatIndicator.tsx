import { cn } from "@/lib/utils";

interface BeatIndicatorProps {
  isActive: boolean;
  totalBeats: number;
  currentBeat: number;
}

const BeatIndicator = ({ isActive, totalBeats, currentBeat }: BeatIndicatorProps) => {

  return (
    <div className="space-y-6">
      {/* Beat Circle Grid */}
      <div className="grid grid-cols-8 gap-3 max-w-md mx-auto">
        {Array.from({ length: totalBeats }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "aspect-square rounded-full transition-all duration-200 flex items-center justify-center text-sm font-semibold",
              i === 0
                ? "ring-2 ring-primary" // Sam (first beat)
                : "",
              isActive && i === currentBeat
                ? i === 0
                  ? "bg-primary text-primary-foreground scale-110 shadow-glow animate-beat"
                  : "bg-accent text-accent-foreground scale-110 animate-beat"
                : "bg-muted/40 text-muted-foreground"
            )}
          >
            {i + 1}
          </div>
        ))}
      </div>

      {/* Sam Indicator */}
      <div className="text-center">
        <p
          className={cn(
            "text-sm font-medium transition-colors",
            isActive && currentBeat === 0 ? "text-primary font-bold" : "text-muted-foreground"
          )}
        >
          {isActive && currentBeat === 0 ? "सम (Sam) 🎵" : ""}
        </p>
      </div>

      {/* Taal Pattern */}
      <div className="flex justify-center gap-4 text-xs text-muted-foreground">
        {totalBeats === 16 ? (
          <>
            <div>X 2 3 4 |</div>
            <div>2 2 3 4 |</div>
            <div>0 2 3 4 |</div>
            <div>3 2 3 4</div>
          </>
        ) : (
          <>
            <div>X 2 3 |</div>
            <div>0 2 3</div>
          </>
        )}
      </div>
    </div>
  );
};

export default BeatIndicator;
