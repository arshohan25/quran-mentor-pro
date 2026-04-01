import { useState, useMemo, useCallback, TouchEvent } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSurah } from "@/hooks/useQuranApi";
import { surahList } from "@/data/surahList";
import { SURAH_START_PAGES } from "@/data/mushafPages";
import { applyTajweedColors } from "@/utils/tajweed";
import SurahSelector from "./SurahSelector";
import ReadingSettings from "./ReadingSettings";
import type { QuranSectionProps } from "./types";
import { Skeleton } from "@/components/ui/skeleton";

const AYAHS_PER_PAGE = 15;

function toArabicNumeral(n: number): string {
  return n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
}

export default function ReadingView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t } = useLanguage();
  const { data, isLoading } = useSurah(selectedSurah, "quran-uthmani");
  const [page, setPage] = useState(0);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("mushaf-font-size");
    return saved ? Number(saved) : 24;
  });
  const [tajweedEnabled, setTajweedEnabled] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const surahInfo = surahList.find((s) => s.number === selectedSurah);
  const mushafPage = SURAH_START_PAGES[selectedSurah] || 1;

  const pages = useMemo(() => {
    if (!data?.ayahs) return [];
    const chunks: typeof data.ayahs[] = [];
    for (let i = 0; i < data.ayahs.length; i += AYAHS_PER_PAGE) {
      chunks.push(data.ayahs.slice(i, i + AYAHS_PER_PAGE));
    }
    return chunks;
  }, [data]);

  const totalPages = pages.length;
  const currentAyahs = pages[page] || [];
  const firstAyah = currentAyahs[0];
  const currentJuz = firstAyah?.juz || 1;

  const setFontSizePersist = useCallback((v: number) => {
    setFontSize(v);
    localStorage.setItem("mushaf-font-size", String(v));
  }, []);

  const goPage = (dir: number) => {
    const next = page + dir;
    if (next >= 0 && next < totalPages) {
      setPage(next);
    } else if (dir > 0 && selectedSurah < 114) {
      setSelectedSurah(selectedSurah + 1);
      setPage(0);
    } else if (dir < 0 && selectedSurah > 1) {
      setSelectedSurah(selectedSurah - 1);
      setPage(0);
    }
  };

  const onTouchStart = (e: TouchEvent) => setTouchStartX(e.touches[0].clientX);
  const onTouchEnd = (e: TouchEvent) => {
    if (touchStartX === null) return;
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 60) goPage(diff > 0 ? 1 : -1);
    setTouchStartX(null);
  };

  const handleSurahChange = (n: number) => {
    setSelectedSurah(n);
    setPage(0);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950">
        <div className="bg-[#008374] text-white py-3 px-4">
          <Skeleton className="h-6 w-48 bg-white/20" />
        </div>
        <div className="p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950" onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {/* Header */}
      <header className="bg-[#008374] text-white py-2.5 px-4 shadow-sm">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1.5 rounded-full hover:bg-white/20 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-base font-semibold font-arabic">{surahInfo?.name}</h1>
          </div>
          <div className="flex items-center gap-1">
            <SurahSelector value={selectedSurah} onChange={handleSurahChange} variant="header" />
            <ReadingSettings
              fontSize={fontSize}
              setFontSize={setFontSizePersist}
              tajweedEnabled={tajweedEnabled}
              onTajweedToggle={() => setTajweedEnabled((p) => !p)}
            />
          </div>
        </div>
      </header>

      {/* Info bar */}
      <div className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 py-1.5 px-4 text-center">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {t("পৃষ্ঠা", "Page", "صفحة")} {mushafPage + page} · {t("জুয", "Juz", "جزء")} {toArabicNumeral(currentJuz)}
        </span>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Surah header on first page */}
        {page === 0 && (
          <div className="text-center mb-6">
            <h2 className="font-arabic text-2xl text-gray-900 dark:text-gray-100 mb-1">{surahInfo?.name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              {surahInfo?.englishName} · {surahInfo?.numberOfAyahs} {t("আয়াত", "Ayahs", "آيات")}
            </p>
            {selectedSurah !== 9 && (
              <p className="font-arabic text-xl text-gray-800 dark:text-gray-200 mb-2">
                بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
              </p>
            )}
            <div className="h-px bg-gray-200 dark:bg-gray-800 w-24 mx-auto" />
          </div>
        )}

        {/* Ayah text - flowing paragraph */}
        <div className="font-arabic leading-[2.2] text-right" dir="rtl" style={{ fontSize: `${fontSize}px` }}>
          {currentAyahs.map((ayah) => {
            const verseMarker = ` ﴿${toArabicNumeral(ayah.numberInSurah)}﴾ `;
            if (tajweedEnabled) {
              return (
                <span key={ayah.number}>
                  <span
                    className="text-gray-900 dark:text-gray-100"
                    dangerouslySetInnerHTML={{ __html: applyTajweedColors(ayah.text) }}
                  />
                  <span className="text-[#008374] dark:text-[#00b3a0]" style={{ fontSize: `${fontSize * 0.75}px` }}>
                    {verseMarker}
                  </span>
                </span>
              );
            }
            return (
              <span key={ayah.number}>
                <span className="text-gray-900 dark:text-gray-100">{ayah.text}</span>
                <span className="text-[#008374] dark:text-[#00b3a0]" style={{ fontSize: `${fontSize * 0.75}px` }}>
                  {verseMarker}
                </span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="sticky bottom-0 bg-white/90 dark:bg-gray-950/90 backdrop-blur border-t border-gray-200 dark:border-gray-800 py-2.5 px-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => goPage(-1)}
            disabled={page === 0 && selectedSurah === 1}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => goPage(1)}
            disabled={page === totalPages - 1 && selectedSurah === 114}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>
    </div>
  );
}
