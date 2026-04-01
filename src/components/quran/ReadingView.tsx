import { useState, useMemo, useEffect, useRef } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Settings } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSurah } from "@/hooks/useQuranApi";
import { surahList } from "@/data/surahList";
import { juzList } from "@/data/juzData";
import { SURAH_START_PAGES } from "@/data/mushafPages";
import SurahSelector from "@/components/quran/SurahSelector";
import ReadingSettings from "@/components/quran/ReadingSettings";
import { Skeleton } from "@/components/ui/skeleton";
import type { QuranSectionProps } from "@/components/quran/types";

const LINES_PER_PAGE = 15;

function getJuzForAyah(surah: number, ayah: number): number {
  for (let i = juzList.length - 1; i >= 0; i--) {
    const j = juzList[i];
    if (surah > j.startSurah || (surah === j.startSurah && ayah >= j.startAyah)) {
      return j.number;
    }
  }
  return 1;
}

// Convert number to Arabic-Indic numerals
function toArabicNum(n: number): string {
  return n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
}

export default function ReadingView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t } = useLanguage();
  const { data, isLoading, error } = useSurah(selectedSurah, "quran-uthmani");
  const [page, setPage] = useState(0);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("mushaf-font-size");
    return saved ? Number(saved) : 28;
  });
  const contentRef = useRef<HTMLDivElement>(null);

  const surahInfo = surahList.find((s) => s.number === selectedSurah);
  const mushafPage = SURAH_START_PAGES[selectedSurah] || 1;

  useEffect(() => {
    localStorage.setItem("mushaf-font-size", String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    setPage(0);
    contentRef.current?.scrollTo({ top: 0 });
  }, [selectedSurah]);

  // Build pages from ayahs
  const pages = useMemo(() => {
    if (!data?.ayahs) return [];
    const result: typeof data.ayahs[] = [];
    for (let i = 0; i < data.ayahs.length; i += LINES_PER_PAGE) {
      result.push(data.ayahs.slice(i, i + LINES_PER_PAGE));
    }
    return result;
  }, [data]);

  const currentAyahs = pages[page] || [];
  const currentJuz = currentAyahs.length > 0
    ? getJuzForAyah(selectedSurah, currentAyahs[0].numberInSurah)
    : 1;
  const currentMushafPage = mushafPage + page;

  const goNext = () => {
    if (page < pages.length - 1) {
      setPage(page + 1);
    } else if (selectedSurah < 114) {
      setSelectedSurah(selectedSurah + 1);
    }
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    if (page > 0) {
      setPage(page - 1);
    } else if (selectedSurah > 1) {
      setSelectedSurah(selectedSurah - 1);
    }
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-destructive text-lg">⚠️ {t("লোড করা যায়নি", "Failed to load", "فشل التحميل")}</p>
          <button onClick={onBack} className="text-sm text-muted-foreground underline">
            {t("ফিরে যান", "Go back", "عودة")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(220 20% 7%)" }}>
      {/* Sticky top bar — Quran.com style */}
      <header className="sticky top-0 z-50 border-b" style={{
        background: "hsl(220 20% 10%)",
        borderColor: "hsl(220 15% 18%)"
      }}>
        {/* Primary bar: page info */}
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5 text-white/70" />
            </button>
            <span className="text-white/50 text-xs">
              {t(`পৃষ্ঠা ${currentMushafPage}`, `Page ${currentMushafPage}`, `صفحة ${toArabicNum(currentMushafPage)}`)}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-white/50 text-xs font-arabic" dir="rtl">
              {t(`জুয ${currentJuz}`, `Juz ${currentJuz}`, `الجزء ${toArabicNum(currentJuz)}`)}
            </span>
            <ReadingSettings fontSize={fontSize} setFontSize={setFontSize} />
          </div>
        </div>

        {/* Secondary bar: surah selector */}
        <div className="flex items-center justify-center px-3 pb-2">
          <div className="text-white">
            <SurahSelector value={selectedSurah} onChange={(n) => setSelectedSurah(n)} variant="header" />
          </div>
        </div>
      </header>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="max-w-2xl mx-auto p-6 space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" style={{ background: "hsl(220 15% 15%)" }} />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Surah name header — on first page only */}
            {page === 0 && surahInfo && (
              <div className="text-center mb-6 space-y-2">
                {/* Decorative surah banner */}
                <div className="relative py-4 px-6 rounded-xl mx-auto max-w-sm" style={{
                  background: "hsl(220 15% 12%)",
                  border: "1px solid hsl(220 15% 20%)"
                }}>
                  <h2 className="font-arabic text-2xl md:text-3xl font-bold" dir="rtl"
                    style={{ color: "hsl(170 100% 26%)" }}>
                    {surahInfo.name}
                  </h2>
                  <p className="text-white/40 text-xs mt-1">
                    {surahInfo.englishName} • {surahInfo.numberOfAyahs} {t("আয়াত", "Ayahs", "آيات")}
                  </p>
                </div>

                {/* Bismillah — not for Surah 9 (At-Tawba) */}
                {selectedSurah !== 9 && (
                  <p className="font-arabic text-xl md:text-2xl py-3" dir="rtl"
                    style={{ color: "hsl(170 100% 26%)" }}>
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </p>
                )}

                <div className="h-px mx-auto w-48" style={{ background: "hsl(220 15% 20%)" }} />
              </div>
            )}

            {/* Flowing Arabic text — paragraph style */}
            <div className="font-arabic leading-[2.4] text-center" dir="rtl" style={{
              fontSize: `${fontSize}px`,
              color: "hsl(40 20% 88%)",
              wordSpacing: "4px",
              lineHeight: "2.6"
            }}>
              {currentAyahs.map((ayah) => (
                <span key={ayah.numberInSurah}>
                  {/* For surah 1 page 0, skip first ayah if it's bismillah duplicate */}
                  {ayah.text}{" "}
                  <span
                    className="inline-block mx-1 align-middle select-none"
                    style={{
                      color: "hsl(170 100% 26%)",
                      fontSize: `${Math.max(14, fontSize * 0.55)}px`,
                      fontFamily: "serif"
                    }}
                  >
                    ﴿{toArabicNum(ayah.numberInSurah)}﴾
                  </span>{" "}
                </span>
              ))}
            </div>

            {/* Page number at bottom */}
            <div className="text-center mt-8 mb-4">
              <span className="text-white/30 text-xs tracking-wider">
                — {currentMushafPage} —
              </span>
            </div>
          </div>
        )}

        {/* Page navigation */}
        <div className="sticky bottom-0 px-4 py-3 flex items-center justify-between" style={{
          background: "hsl(220 20% 8% / 0.95)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid hsl(220 15% 15%)"
        }}>
          <button
            onClick={goPrev}
            disabled={page === 0 && selectedSurah <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-20"
            style={{ color: "hsl(170 100% 26%)" }}
          >
            <ChevronLeft className="w-4 h-4" />
            {t("আগে", "Prev", "السابق")}
          </button>
          <span className="text-white/40 text-xs">
            {page + 1} / {pages.length || 1}
          </span>
          <button
            onClick={goNext}
            disabled={page >= pages.length - 1 && selectedSurah >= 114}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-20"
            style={{ color: "hsl(170 100% 26%)" }}
          >
            {t("পরে", "Next", "التالي")}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
