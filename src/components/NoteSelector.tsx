import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getChromaticScale, NoteInfo } from "@/lib/noteSystem";
import { isSwaraInRaga } from "@/lib/ragaSystem";
import { Music } from "lucide-react";

interface NoteSelectorProps {
  selectedNote: string | null; // null = "All Notes" mode
  onSelectNote: (western: string | null) => void;
  currentRaga: string;
}

const NoteSelector = ({ selectedNote, onSelectNote, currentRaga }: NoteSelectorProps) => {
  const chromaticScale = getChromaticScale();
  
  // Group notes by octave for better UI
  const notesByOctave = {
    mandra: chromaticScale.filter(n => n.octave === -1),
    madhya: chromaticScale.filter(n => n.octave === 0),
    taar: chromaticScale.filter(n => n.octave === 1),
  };

  const isNoteInRaga = (note: NoteInfo): boolean => {
    // Extract base swara without sharps/flats for matching
    const baseSwara = note.swara.replace('♭', '').replace('#', '');
    return isSwaraInRaga(baseSwara, currentRaga) || 
           isSwaraInRaga(note.swara, currentRaga);
  };

  const renderNoteButton = (note: NoteInfo) => {
    const isSelected = selectedNote === note.western;
    const inRaga = isNoteInRaga(note);
    const isSharp = note.western.includes('#');

    return (
      <Button
        key={note.western}
        variant={isSelected ? "default" : "outline"}
        size="sm"
        onClick={() => onSelectNote(note.western)}
        className={cn(
          "flex flex-col items-center gap-1 h-auto py-2 px-3 transition-all",
          isSelected && "shadow-glow",
          !inRaga && "opacity-40",
          inRaga && !isSelected && "hover:bg-primary/10"
        )}
      >
        <span className="text-xs font-mono font-semibold">
          {note.western}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {note.swara}
        </span>
        {inRaga && (
          <span className="text-[8px] text-primary">●</span>
        )}
      </Button>
    );
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={selectedNote === null ? "default" : "outline"}
          size="sm"
          onClick={() => onSelectNote(null)}
          className="flex-1"
        >
          <Music className="w-4 h-4 mr-2" />
          All Notes
        </Button>
      </div>

      {/* Note Grid */}
      <div className="space-y-3">
        {/* Taar Saptak (Upper Octave) */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-semibold">Taar Saptak (Upper)</p>
          <div className="grid grid-cols-4 gap-1.5">
            {notesByOctave.taar.map(renderNoteButton)}
          </div>
        </div>

        {/* Madhya Saptak (Middle Octave) */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-semibold">Madhya Saptak (Middle)</p>
          <div className="grid grid-cols-4 gap-1.5">
            {notesByOctave.madhya.map(renderNoteButton)}
          </div>
        </div>

        {/* Mandra Saptak (Lower Octave) */}
        <div>
          <p className="text-xs text-muted-foreground mb-2 font-semibold">Mandra Saptak (Lower)</p>
          <div className="grid grid-cols-3 gap-1.5">
            {notesByOctave.mandra.map(renderNoteButton)}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-lg space-y-1">
        <p className="flex items-center gap-2">
          <span className="text-primary">●</span>
          <span>In current raga ({currentRaga})</span>
        </p>
        <p className="opacity-60">Faded notes are outside the raga</p>
      </div>
    </div>
  );
};

export default NoteSelector;
