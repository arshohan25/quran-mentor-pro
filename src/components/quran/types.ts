export type ActiveSection = null | "translation" | "audio" | "wordmeaning" | "hifz" | "bookmarks" | "topics" | "juz" | "reading";

export const LINES_PER_PAGE = 15;
export const CHARS_PER_LINE = 30;

export interface QuranSectionProps {
  selectedSurah: number;
  setSelectedSurah: (n: number) => void;
  onBack: () => void;
}
