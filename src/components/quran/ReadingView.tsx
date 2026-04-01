import { useState, useMemo, useEffect, useRef } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
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

function toArabicNum(n: number): string {
  return n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
}

export default function ReadingView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t } = useLanguage();
  const { data, isLoading, error } = useSurah(selectedSurah, "quran-uthmani");
  const [page, setPage] = useState(0);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("mushaf-font-size");
    return saved ? Number(saved) : 26;
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
    if (page < pages.length - 1) setPage(page + 1);
    else if (selectedSurah < 114) setSelectedSurah(selectedSurah + 1);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const goPrev = () => {
    if (page > 0) setPage(page - 1);
    else if (selectedSurah > 1) setSelectedSurah(selectedSurah - 1);
    contentRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#1B1B2F" }}>
        <div className="text-center space-y-3">
          <p className="text-red-400 text-lg">⚠️ {t("লোড করা যায়নি", "Failed to load", "فشل التحميل")}</p>
          <button onClick={onBack} className="text-sm text-white/50 underline">
            {t("ফিরে যান", "Go back", "عودة")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "#1B1B2F" }}>
      {/* Single-row sticky header */}
      <header
        className="sticky top-0 z-50 flex items-center justify-between px-3 py-2.5"
        style={{
          background: "#1B1B2F",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white/60" />
          </button>
          <span className="text-white/40 text-xs">
            {t(`পৃষ্ঠা ${currentMushafPage}`, `Page ${currentMushafPage}`, `صفحة ${toArabicNum(currentMushafPage)}`)}
          </span>
        </div>

        <div className="text-white">
          <SurahSelector value={selectedSurah} onChange={(n) => setSelectedSurah(n)} variant="header" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-white/40 text-xs">
            {t(`জুয ${currentJuz}`, `Juz ${currentJuz}`, `الجزء ${toArabicNum(currentJuz)}`)}
          </span>
          <ReadingSettings fontSize={fontSize} setFontSize={setFontSize} />
        </div>
      </header>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="max-w-2xl mx-auto p-6 space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" style={{ background: "rgba(255,255,255,0.05)" }} />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-6">
            {/* Surah intro — first page only */}
            {page === 0 && surahInfo && (
              <div className="text-center mb-6 space-y-3">
                {/* Bordered frame */}
                <div
                  className="py-4 px-8 rounded-lg mx-auto max-w-xs"
                  style={{ border: "1px solid rgba(255,255,255,0.12)" }}
                >
                  <h2
                    className="text-2xl md:text-3xl font-bold"
                    dir="rtl"
                    style={{
                      fontFamily: "'Scheherazade New', 'Amiri', serif",
                      color: "rgba(255,255,255,0.92)",
                    }}
                  >
                    {surahInfo.name}
                  </h2>
                  <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                    {surahInfo.englishName} • {surahInfo.numberOfAyahs} {t("আয়াত", "Ayahs", "آيات")}
                  </p>
                </div>

                {/* Bismillah */}
                {selectedSurah !== 9 && (
                  <p
                    className="text-xl md:text-2xl py-2"
                    dir="rtl"
                    style={{
                      fontFamily: "'Scheherazade New', 'Amiri', serif",
                      color: "rgba(255,255,255,0.92)",
                    }}
                  >
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </p>
                )}

                <div className="h-px mx-auto w-48" style={{ background: "rgba(255,255,255,0.08)" }} />
              </div>
            )}

            {/* Flowing Arabic text */}
            <div
              dir="rtl"
              style={{
                fontFamily: "'Scheherazade New', 'Amiri', serif",
                fontSize: `${fontSize}px`,
                color: "rgba(255,255,255,0.92)",
                lineHeight: "2.0",
                textAlign: "justify",
              }}
            >
              {currentAyahs.map((ayah) => (
                <span key={ayah.numberInSurah}>
                  {ayah.text}{" "}
                  <span
                    className="inline-block mx-0.5 select-none"
                    style={{
                      color: "rgba(255,255,255,0.45)",
                      fontSize: `${Math.max(12, fontSize * 0.6)}px`,
                      fontFamily: "serif",
                    }}
                  >
                    ﴿{toArabicNum(ayah.numberInSurah)}﴾
                  </span>{" "}
                </span>
              ))}
            </div>

            {/* Page number */}
            <div className="text-center mt-8 mb-4">
              <span style={{ color: "rgba(255,255,255,0.25)", fontSize: "12px" }}>
                {currentMushafPage}
              </span>
            </div>
          </div>
        )}

        {/* Bottom nav */}
        <div
          className="sticky bottom-0 px-4 py-3 flex items-center justify-between"
          style={{
            background: "rgba(27, 27, 47, 0.95)",
            backdropFilter: "blur(8px)",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <button
            onClick={goPrev}
            disabled={page === 0 && selectedSurah <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-20"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            <ChevronLeft className="w-4 h-4" />
            {t("আগে", "Prev", "السابق")}
          </button>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: "12px" }}>
            {page + 1} / {pages.length || 1}
          </span>
          <button
            onClick={goNext}
            disabled={page >= pages.length - 1 && selectedSurah >= 114}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-20"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            {t("পরে", "Next", "التالي")}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
