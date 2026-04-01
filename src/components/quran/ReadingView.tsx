import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { ArrowLeft, Settings, BookOpen, Layers } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSurah } from "@/hooks/useQuranApi";
import { surahList } from "@/data/surahList";
import { SURAH_START_PAGES } from "@/data/mushafPages";
import { applyTajweedColors } from "@/utils/tajweed";
import SurahSelector from "./SurahSelector";
import ReadingSettings from "./ReadingSettings";
import type { QuranSectionProps } from "./types";
import { Skeleton } from "@/components/ui/skeleton";

const LINES_PER_PAGE = 15;

function toArabicNumeral(n: number): string {
  return n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]);
}

// Verse end marker — decorative circle like Quran.com
function VerseMarker({ num }: { num: number }) {
  return (
    <span className="inline-flex items-center justify-center mx-1 align-middle select-none" style={{ verticalAlign: "middle" }}>
      <span className="relative inline-flex items-center justify-center w-[1.6em] h-[1.6em]">
        {/* Outer decorative circle */}
        <svg viewBox="0 0 40 40" className="absolute inset-0 w-full h-full" fill="none">
          <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
          <circle cx="20" cy="20" r="15" stroke="currentColor" strokeWidth="0.8" opacity="0.3" />
        </svg>
        <span className="relative text-[0.5em] font-semibold" style={{ fontFamily: "sans-serif" }}>
          {toArabicNumeral(num)}
        </span>
      </span>
    </span>
  );
}

// Split ayahs into mushaf-like pages
function paginateAyahs(ayahs: any[], linesPerPage: number) {
  if (!ayahs.length) return [];

  const pages: any[][] = [];
  let currentPage: any[] = [];
  let lineCount = 0;

  for (const ayah of ayahs) {
    // Estimate lines this ayah takes (rough: ~50 chars per line for Arabic)
    const estimatedLines = Math.max(1, Math.ceil(ayah.text.length / 45));
    
    if (lineCount + estimatedLines > linesPerPage && currentPage.length > 0) {
      pages.push(currentPage);
      currentPage = [ayah];
      lineCount = estimatedLines;
    } else {
      currentPage.push(ayah);
      lineCount += estimatedLines;
    }
  }
  if (currentPage.length > 0) pages.push(currentPage);
  return pages;
}

export default function ReadingView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t } = useLanguage();
  const { data, isLoading } = useSurah(selectedSurah, "quran-uthmani");
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("mushaf-font-size");
    return saved ? Number(saved) : 26;
  });
  const [tajweedEnabled, setTajweedEnabled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);

  const surahInfo = surahList.find((s) => s.number === selectedSurah);
  const mushafStartPage = SURAH_START_PAGES[selectedSurah] || 1;

  const pages = useMemo(() => {
    if (!data?.ayahs) return [];
    return paginateAyahs(data.ayahs, LINES_PER_PAGE);
  }, [data]);

  const setFontSizePersist = useCallback((v: number) => {
    setFontSize(v);
    localStorage.setItem("mushaf-font-size", String(v));
  }, []);

  // Track which page section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute("data-page-index"));
            if (!isNaN(idx)) setCurrentPageIndex(idx);
          }
        }
      },
      { threshold: 0.5 }
    );

    pageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, [pages]);

  // Reset scroll on surah change
  useEffect(() => {
    scrollRef.current?.scrollTo(0, 0);
    setCurrentPageIndex(0);
  }, [selectedSurah]);

  const currentMushafPage = mushafStartPage + currentPageIndex;
  const firstAyahOnPage = pages[currentPageIndex]?.[0];
  const currentJuz = firstAyahOnPage?.juz || 1;
  const currentHizb = Math.ceil(currentJuz * 2); // approximate

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1B1B2F] text-white">
        <div className="sticky top-0 z-10 bg-[#1B1B2F] border-b border-white/10 px-4 py-2">
          <Skeleton className="h-5 w-40 bg-white/10" />
        </div>
        <div className="p-6 space-y-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full bg-white/5" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="min-h-screen bg-[#1B1B2F] text-white overflow-y-auto">
      {/* Sticky top header — Page & Juz info */}
      <div className="sticky top-0 z-20 bg-[#1B1B2F]/95 backdrop-blur-sm border-b border-white/10">
        {/* Row 1: Page info */}
        <div className="flex items-center justify-between px-4 py-1.5 text-xs text-white/60">
          <div className="flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t("পৃষ্ঠা", "Page", "صفحة")} {currentMushafPage}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5" />
            <span>{t("জুয", "Juz", "جزء")} {currentJuz} / {t("হিযব", "Hizb", "حزب")} {currentHizb}</span>
          </div>
        </div>

        {/* Row 2: Surah name + controls */}
        <div className="flex items-center justify-between px-3 py-1.5 border-t border-white/5">
          <div className="flex items-center gap-1.5">
            <button onClick={onBack} className="p-1.5 rounded-full hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4.5 h-4.5" />
            </button>
            <SurahSelector
              value={selectedSurah}
              onChange={(n) => { setSelectedSurah(n); }}
              variant="header"
            />
          </div>
          <div className="flex items-center gap-1">
            <ReadingSettings
              fontSize={fontSize}
              setFontSize={setFontSizePersist}
              tajweedEnabled={tajweedEnabled}
              onTajweedToggle={() => setTajweedEnabled((p) => !p)}
            />
          </div>
        </div>
      </div>

      {/* Surah header */}
      <div className="text-center pt-6 pb-4 px-4">
        <h2 className="font-arabic text-3xl mb-1 text-white/90">{surahInfo?.name}</h2>
        <p className="text-sm text-white/40 mb-1">
          {surahInfo?.englishName} — {surahInfo?.englishNameTranslation}
        </p>
        <p className="text-xs text-white/30">
          {surahInfo?.numberOfAyahs} {t("আয়াত", "Ayahs", "آيات")} · {surahInfo?.revelationType === "Meccan" ? t("মাক্কী", "Meccan", "مكية") : t("মাদানী", "Medinan", "مدنية")}
        </p>

        {/* Bismillah */}
        {selectedSurah !== 9 && selectedSurah !== 1 && (
          <div className="mt-5 mb-2">
            <p className="font-arabic text-2xl text-white/80 leading-relaxed">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </p>
            <p className="text-[11px] text-white/30 mt-1">
              In the Name of Allah—the Most Compassionate, Most Merciful
            </p>
          </div>
        )}
      </div>

      {/* Page sections — continuous scroll */}
      <div className="pb-20">
        {pages.map((pageAyahs, pageIdx) => (
          <div
            key={pageIdx}
            ref={(el) => { pageRefs.current[pageIdx] = el; }}
            data-page-index={pageIdx}
            className="mx-3 mb-6"
          >
            {/* Arabic text block */}
            <div
              className="font-arabic text-right leading-[2.4] px-3 py-4"
              dir="rtl"
              style={{ fontSize: `${fontSize}px` }}
            >
              {pageAyahs.map((ayah: any) => {
                if (tajweedEnabled) {
                  return (
                    <span key={ayah.number}>
                      <span
                        className="text-white/95"
                        dangerouslySetInnerHTML={{ __html: applyTajweedColors(ayah.text) }}
                      />
                      <VerseMarker num={ayah.numberInSurah} />
                    </span>
                  );
                }
                return (
                  <span key={ayah.number}>
                    <span className="text-white/95">{ayah.text}</span>
                    <VerseMarker num={ayah.numberInSurah} />
                  </span>
                );
              })}
            </div>

            {/* Page number at bottom */}
            <div className="text-center mt-2">
              <span className="text-xs text-white/25">{mushafStartPage + pageIdx}</span>
            </div>

            {/* Page divider */}
            {pageIdx < pages.length - 1 && (
              <div className="mt-4 border-t border-white/5" />
            )}
          </div>
        ))}
      </div>

      {/* Bottom surah nav */}
      <div className="sticky bottom-0 bg-[#1B1B2F]/95 backdrop-blur-sm border-t border-white/10 py-2.5 px-4">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <button
            onClick={() => { if (selectedSurah > 1) setSelectedSurah(selectedSurah - 1); }}
            disabled={selectedSurah <= 1}
            className="text-xs text-white/50 hover:text-white/80 disabled:opacity-20 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            ← {selectedSurah > 1 ? surahList[selectedSurah - 2]?.englishName : ""}
          </button>
          <span className="text-xs text-white/30">
            {surahInfo?.englishName}
          </span>
          <button
            onClick={() => { if (selectedSurah < 114) setSelectedSurah(selectedSurah + 1); }}
            disabled={selectedSurah >= 114}
            className="text-xs text-white/50 hover:text-white/80 disabled:opacity-20 transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5"
          >
            {selectedSurah < 114 ? surahList[selectedSurah]?.englishName : ""} →
          </button>
        </div>
      </div>
    </div>
  );
}
