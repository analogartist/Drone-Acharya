import { cn } from "@/lib/utils";
import { PaltaDefinition, PaltaComparison } from "@/lib/paltaSystem";

interface PaltaDisplayProps {
  palta: PaltaDefinition | null;
  comparison: PaltaComparison;
  currentHeldSwara: string | null;
  isActive: boolean;
}

const PaltaDisplay = ({ palta, comparison, currentHeldSwara, isActive }: PaltaDisplayProps) => {
  if (!palta) {
    return (
      <div className="text-center text-muted-foreground text-sm py-4">
        Select a palta to begin practice
      </div>
    );
  }

  const { sungNotes, matches, isComplete, accuracy, expectedIndex } = comparison;

  return (
    <div className="space-y-4">
      {/* Palta name and accuracy */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm">{palta.name}</h4>
        {sungNotes.length > 0 && (
          <span
            className={cn(
              "text-xs font-mono px-2 py-0.5 rounded-full",
              accuracy >= 80
                ? "bg-success/20 text-success"
                : accuracy >= 50
                ? "bg-warning/20 text-warning"
                : "bg-destructive/20 text-destructive"
            )}
          >
            {accuracy.toFixed(0)}% accurate
          </span>
        )}
      </div>

      {/* Expected sequence with sung overlay */}
      <div className="flex flex-wrap gap-1.5">
        {palta.sequence.map((swara, i) => {
          const isSung = i < sungNotes.length;
          const isMatch = isSung && matches[i];
          const isMismatch = isSung && !matches[i];
          const isCurrent = i === expectedIndex && isActive;
          const isBeingHeld = isCurrent && currentHeldSwara === swara;

          return (
            <div key={i} className="flex flex-col items-center gap-0.5">
              {/* Expected swara */}
              <div
                className={cn(
                  "px-3 py-1.5 rounded-md text-sm font-mono transition-all min-w-[40px] text-center border",
                  isMatch && "bg-success/20 border-success text-success-foreground",
                  isMismatch && "bg-destructive/20 border-destructive text-destructive",
                  isCurrent && !isSung && "border-primary bg-primary/10 ring-2 ring-primary/30",
                  isBeingHeld && "ring-2 ring-success/50 bg-success/10",
                  !isSung && !isCurrent && "border-muted bg-muted/30 text-muted-foreground"
                )}
              >
                {swara}
              </div>

              {/* Sung swara (shown below if mismatched) */}
              {isMismatch && (
                <span className="text-[10px] text-destructive font-mono">
                  {sungNotes[i].swara}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Completion status */}
      {isComplete && (
        <div
          className={cn(
            "text-center py-4 rounded-md space-y-2",
            accuracy >= 80
              ? "bg-success/10"
              : accuracy >= 50
              ? "bg-warning/10"
              : "bg-destructive/10"
          )}
        >
          <div className={cn(
            "text-3xl font-bold",
            accuracy >= 80
              ? "text-success"
              : accuracy >= 50
              ? "text-warning"
              : "text-destructive"
          )}>
            {accuracy.toFixed(0)}%
          </div>
          <div
            className={cn(
              "text-sm font-medium",
              accuracy >= 80
                ? "text-success"
                : accuracy >= 50
                ? "text-warning"
                : "text-destructive"
            )}
          >
            {accuracy >= 80
              ? "Excellent! Palta completed accurately"
              : accuracy >= 50
              ? "Good attempt - try to match each swara more precisely"
              : "Keep practicing - focus on singing the correct sequence"}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Click Reset to try again
          </div>
        </div>
      )}
    </div>
  );
};

export default PaltaDisplay;
