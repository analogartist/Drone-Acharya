import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface RagaSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

const ragas = [
  { name: "Yaman", swaras: "Sa Re Ga ma Pa Dha Ni Sa" }, // Tivra Ma
  { name: "Bhupali", swaras: "Sa Re Ga Pa Dha Sa" }, // Pentatonic
  { name: "Bhairav", swaras: "Sa re Ga Ma Pa dha Ni Sa" }, // Komal Re, Komal Dha
  { name: "Kafi", swaras: "Sa Re ga Ma Pa Dha ni Sa" }, // Komal Ga, Komal Ni
];

const RagaSelector = ({ value, onChange }: RagaSelectorProps) => {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select a raga" />
      </SelectTrigger>
      <SelectContent>
        {ragas.map((raga) => (
          <SelectItem key={raga.name} value={raga.name}>
            <div className="flex flex-col items-start">
              <span className="font-semibold">{raga.name}</span>
              <span className="text-xs text-muted-foreground">{raga.swaras}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default RagaSelector;
