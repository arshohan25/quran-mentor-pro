import { useState, useMemo, useCallback } from "react";
import { ArrowLeft, Search, BookOpen, AlignJustify } from "lucide-react";
import { surahList } from "@/data/surahList";
import { juzList } from "@/data/juzData";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import SurahSelector from "./SurahSelector";
import ReadingSettings from "./ReadingSettings";
import VerseByVerseMode from "./VerseByVerseMode";
import MushafReadingMode from "./MushafReadingMode";
import { useBookmark } from "@/hooks/useBookmark";

function getJuzNumber(surahNumber: number, ayahNumber: number): number {
  for (let i = juzList.length - 1; i >= 0; i--) {
    const j = juzList[i];
    if (surahNumber > j.startSurah || (surahNumber === j.startSurah && ayahNumber >= j.startAyah)) return j.number;
  }
  return 1;
}

type ViewMode = "verse" | "mushaf";

interface QuranSectionProps {
  selectedSurah: number;
  setSelectedSurah: (n: number) => void;
  onBack: () => void;
}

export default function ReadingView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { saveLastRead } = useBookmark();
  const { t } = useLanguage();

  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    try { return (localStorage.getItem("quranViewMode") as ViewMode) || "verse"; } catch { return "verse"; }
  });
  const [tajweedEnabled, setTajweedEnabled] = useState(() => {
    try { return localStorage.getItem("tajweedEnabled") !== "false"; } catch { return true; }
  });
  const [arabicFontSize, setArabicFontSize] = useState(() => {
    try { return Number(localStorage.getItem("arabicFontSize")) || 22; } catch { return 22; }
  });
  const [showPageJump, setShowPageJump] = useState(false);
  const [pageJumpInput, setPageJumpInput] = useState("");
  const [readProgress, setReadProgress] = useState(0);

  const handleFontSizeChange = (n: number) => {
    setArabicFontSize(n);
    try { localStorage.setItem("arabicFontSize", String(n)); } catch {}
  };
  const handleTajweedToggle = () => {
    const next = !tajweedEnabled;
    setTajweedEnabled(next);
    try { localStorage.setItem("tajweedEnabled", String(next)); } catch {}
  };
  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    try { localStorage.setItem("quranViewMode", mode); } catch {}
  };

  const { data, isLoading } = useSurahWithTranslations(selectedSurah);
  const surah = surahList.find(s => s.number === selectedSurah);

  const ayahs = useMemo(() => {
    if (!data) return [];
    return data.arabic.ayahs.map((a, i) => ({
      ...a,
      bengaliText: data.bengali?.ayahs?.[i]?.text || "",
      englishText: data.english?.ayahs?.[i]?.text || "",
    }));
  }, [data]);

  const handleSurahChange = (n: number) => { setSelectedSurah(n); };

  const handlePageJump = () => {
    const num = parseInt(pageJumpInput, 10);
    if (isNaN(num) || num < 1 || num > 604) return;
    setShowPageJump(false);
    setPageJumpInput("");
  };

  const firstAyah = ayahs[0];
  const currentJuz = firstAyah ? getJuzNumber(selectedSurah, 1) : 1;
  const currentPage = firstAyah?.page || 1;

  const onProgressChange = useCallback((pct: number) => setReadProgress(pct), []);

  // Save last read
  const handleProgressForSave = useCallback((pct: number) => {
    setReadProgress(pct);
    if (firstAyah) saveLastRead(selectedSurah, 1, firstAyah.page || 1, "reading");
  }, [firstAyah, selectedSurah, saveLastRead]);

  return (
    <div className={`h-screen flex flex-col overflow-hidden ${viewMode === "mushaf" ? "bg-[#F5EFE0] dark:bg-[#1a1510]" : "bg-background"}`}>
      {/* Header */}
      <header className={viewMode === "mushaf" ? "bg-[#2D5016] dark:bg-[#1a3009] text-white" : "bg-[#008374] dark:bg-[#006B5F] text-white"}>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="hover:opacity-80 p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <SurahSelector value={selectedSurah} onChange={handleSurahChange} />
              <button
                onClick={() => { setShowPageJump(!showPageJump); setPageJumpInput(String(currentPage)); }}
                className="text-[10px] opacity-70 pl-1 hover:opacity-100 transition-opacity flex items-center gap-1"
              >
                <Search className="w-2.5 h-2.5" />
                {t("পৃষ্ঠা", "Page", "صفحة")} {currentPage} · {t("পারা", "Juz", "الجزء")} {currentJuz}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Mode toggle */}
            <div className="flex bg-white/15 rounded-md p-0.5">
              <button
                onClick={() => handleViewModeChange("verse")}
                className={`p-1.5 rounded transition-colors ${viewMode === "verse" ? "bg-white/25 shadow-sm" : "hover:bg-white/10"}`}
                title={t("আয়াত ভিউ", "Verse by Verse", "آية بآية")}
              >
                <AlignJustify className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleViewModeChange("mushaf")}
                className={`p-1.5 rounded transition-colors ${viewMode === "mushaf" ? "bg-white/25 shadow-sm" : "hover:bg-white/10"}`}
                title={t("মুসহাফ", "Reading", "مصحف")}
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
            </div>
            <ReadingSettings
              fontSize={arabicFontSize}
              setFontSize={handleFontSizeChange}
              tajweedEnabled={tajweedEnabled}
              onTajweedToggle={handleTajweedToggle}
            />
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-0.5 bg-white/20">
          <div className="h-full bg-white/80 transition-all duration-300" style={{ width: `${readProgress}%` }} />
        </div>
      </header>

      {/* Page jump */}
      {showPageJump && (
        <div className={`${viewMode === "mushaf" ? "bg-[#2D5016]/90 dark:bg-[#1a3009]/95" : "bg-[#008374]/90 dark:bg-[#006B5F]/95"} px-4 py-2.5 flex items-center gap-2`}>
          <input
            type="number" min={1} max={604}
            value={pageJumpInput}
            onChange={(e) => setPageJumpInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePageJump()}
            placeholder="1-604" autoFocus
            className="w-20 px-2 py-1 rounded text-sm bg-white/15 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button onClick={handlePageJump} className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-xs font-medium">
            {t("যাও", "Go", "اذهب")}
          </button>
          <button onClick={() => setShowPageJump(false)} className="ml-auto text-white/60 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Content */}
      {isLoading ? (
        <div className="space-y-4 p-4 flex-1">
          {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
        </div>
      ) : viewMode === "verse" ? (
        <VerseByVerseMode
          selectedSurah={selectedSurah}
          setSelectedSurah={setSelectedSurah}
          ayahs={ayahs}
          tajweedEnabled={tajweedEnabled}
          arabicFontSize={arabicFontSize}
          onProgressChange={handleProgressForSave}
        />
      ) : (
        <MushafReadingMode
          selectedSurah={selectedSurah}
          setSelectedSurah={setSelectedSurah}
          arabicAyahs={data?.arabic.ayahs || []}
          tajweedEnabled={tajweedEnabled}
          arabicFontSize={arabicFontSize}
          onProgressChange={handleProgressForSave}
        />
      )}
    </div>
  );
}
