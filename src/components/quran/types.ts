export type ActiveSection = null | "reading" | "translation" | "audio" | "wordmeaning" | "hifz" | "bookmarks";

export const LINES_PER_PAGE = 15;

export interface QuranSectionProps {
  selectedSurah: number;
  setSelectedSurah: (n: number) => void;
  onBack: () => void;
}
