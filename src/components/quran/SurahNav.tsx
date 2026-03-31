import { ChevronLeft, ChevronRight } from "lucide-react";
import { surahList } from "@/data/surahList";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  selectedSurah: number;
  setSelectedSurah: (n: number) => void;
  onSurahChange?: () => void;
}

export default function SurahNav({ selectedSurah, setSelectedSurah, onSurahChange }: Props) {
  const { language } = useLanguage();
  return (
    <div className="flex items-center justify-between mt-2 mb-4 gap-2">
      <button
        onClick={() => { if (selectedSurah > 1) { setSelectedSurah(selectedSurah - 1); onSurahChange?.(); } }}
        disabled={selectedSurah <= 1}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
      >
        <ChevronLeft className="w-3 h-3" />
        {selectedSurah > 1 && (language === "bn" ? surahList[selectedSurah - 2]?.bengaliName : surahList[selectedSurah - 2]?.englishName)}
      </button>
      <span className="text-xs text-muted-foreground">{selectedSurah} / 114</span>
      <button
        onClick={() => { if (selectedSurah < 114) { setSelectedSurah(selectedSurah + 1); onSurahChange?.(); } }}
        disabled={selectedSurah >= 114}
        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-30"
      >
        {selectedSurah < 114 && (language === "bn" ? surahList[selectedSurah]?.bengaliName : surahList[selectedSurah]?.englishName)}
        <ChevronRight className="w-3 h-3" />
      </button>
    </div>
  );
}
