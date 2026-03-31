import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { surahList } from "@/data/surahList";
import { juzList } from "@/data/juzData";
import { surahForPage } from "@/data/mushafPages";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import TajweedText, { TajweedLegend } from "@/components/TajweedText";
import SurahSelector from "./SurahSelector";
import SurahNav from "./SurahNav";
import ReadingSettings from "./ReadingSettings";
import MushafFrame, { SurahBanner } from "./MushafFrame";
import { useBookmark } from "@/hooks/useBookmark";

function toArabicNum(n: number): string {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).replace(/\d/g, (d) => arabicDigits[parseInt(d)]);
}

function getJuzNumber(surahNumber: number, ayahNumber: number): number {
  for (let i = juzList.length - 1; i >= 0; i--) {
    const j = juzList[i];
    if (surahNumber > j.startSurah || (surahNumber === j.startSurah && ayahNumber >= j.startAyah)) return j.number;
  }
  return 1;
}

function getJuzName(juzNum: number): string {
  const juz = juzList.find(j => j.number === juzNum);
  return juz?.name || `الجزء ${toArabicNum(juzNum)}`;
}

function stripBismillah(text: string): string {
  const t = text.trim();
  const markers = ['ٱلرَّحِيمِ', 'الرَّحِيمِ', 'الرحيم', 'لرَّحِيمِ', 'لرحيم'];
  for (const marker of markers) {
    const idx = t.indexOf(marker);
    if (idx >= 0 && idx < 80) {
      const after = t.substring(idx + marker.length).trim();
      return after.length > 0 ? after : '';
    }
  }
  if (t.startsWith('بِسْ') || t.startsWith('بسم') || t.startsWith('بِسۡ')) {
    const stripped = t.substring(Math.min(50, t.length)).trim();
    if (stripped.length > 0) return stripped;
  }
  return t;
}

interface QuranSectionProps {
  selectedSurah: number;
  setSelectedSurah: (n: number) => void;
  onBack: () => void;
}

export default function ReadingView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { saveLastRead } = useBookmark();
  const { t } = useLanguage();
  const [pageIndex, setPageIndex] = useState(0);
  const [goToLastPage, setGoToLastPage] = useState(false);
  const [tajweedEnabled, setTajweedEnabled] = useState(() => {
    try { return localStorage.getItem("tajweedEnabled") !== "false"; } catch { return true; }
  });
  const [arabicFontSize, setArabicFontSize] = useState(() => {
    try { return Number(localStorage.getItem("arabicFontSize")) || 20; } catch { return 20; }
  });

  const handleFontSizeChange = (n: number) => {
    setArabicFontSize(n);
    try { localStorage.setItem("arabicFontSize", String(n)); } catch {}
  };

  const handleTajweedToggle = () => {
    const next = !tajweedEnabled;
    setTajweedEnabled(next);
    try { localStorage.setItem("tajweedEnabled", String(next)); } catch {}
  };

  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const { data, isLoading } = useSurahWithTranslations(selectedSurah);
  const surah = surahList.find(s => s.number === selectedSurah);

  // Group ayahs by their real Mushaf page number from the API
  const pages = useMemo(() => {
    if (!data) return [];
    const ayahs = data.arabic.ayahs;
    const pageMap = new Map<number, typeof ayahs>();
    for (const ayah of ayahs) {
      const pg = ayah.page;
      if (!pageMap.has(pg)) pageMap.set(pg, []);
      pageMap.get(pg)!.push(ayah);
    }
    // Sort by page number and return as array of { pageNum, ayahs }
    return Array.from(pageMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([pageNum, ayas]) => ({ pageNum, ayahs: ayas }));
  }, [data]);

  const totalPages = pages.length;

  // Clamp pageIndex whenever pages change
  useEffect(() => {
    if (totalPages === 0) return;
    if (goToLastPage) {
      setPageIndex(totalPages - 1);
      setGoToLastPage(false);
    } else {
      setPageIndex(prev => Math.min(prev, totalPages - 1));
    }
  }, [totalPages, goToLastPage]);

  // Auto-save reading position
  useEffect(() => {
    const currentPageData = pages[pageIndex];
    if (currentPageData && currentPageData.ayahs[0]) {
      saveLastRead(selectedSurah, currentPageData.ayahs[0].numberInSurah, currentPageData.pageNum, "reading");
    }
  }, [selectedSurah, pageIndex, pages, saveLastRead]);

  const canGoPrev = pageIndex > 0 || selectedSurah > 1;
  const canGoNext = pageIndex < totalPages - 1 || selectedSurah < 114;

  const goToPrev = useCallback(() => {
    if (pageIndex > 0) {
      setPageIndex(pageIndex - 1);
    } else if (selectedSurah > 1) {
      setGoToLastPage(true);
      setSelectedSurah(selectedSurah - 1);
    }
  }, [pageIndex, selectedSurah, setSelectedSurah]);

  const goToNext = useCallback(() => {
    if (pageIndex < totalPages - 1) {
      setPageIndex(pageIndex + 1);
    } else if (selectedSurah < 114) {
      setSelectedSurah(selectedSurah + 1);
      setPageIndex(0);
    }
  }, [pageIndex, totalPages, selectedSurah, setSelectedSurah]);

  const handleSurahChange = (n: number) => { setSelectedSurah(n); setPageIndex(0); };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isAnimating) return;
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    setSwipeOffset(0);
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null || isAnimating) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) setSwipeOffset(dx);
  };
  const handleTouchEnd = () => {
    if (touchStartX.current === null || isAnimating) return;
    const threshold = 80;
    if (swipeOffset > threshold && canGoPrev) {
      setIsAnimating(true); setSwipeOffset(300);
      setTimeout(() => { goToPrev(); setSwipeOffset(0); setIsAnimating(false); }, 200);
    } else if (swipeOffset < -threshold && canGoNext) {
      setIsAnimating(true); setSwipeOffset(-300);
      setTimeout(() => { goToNext(); setSwipeOffset(0); setIsAnimating(false); }, 200);
    } else { setSwipeOffset(0); }
    touchStartX.current = null; touchStartY.current = null;
  };

  const currentPageData = pages[pageIndex];
  const realPageNum = currentPageData?.pageNum;
  const firstAyah = currentPageData?.ayahs[0];
  const currentJuz = firstAyah ? getJuzNumber(selectedSurah, firstAyah.numberInSurah) : 1;
  const isFirstPageOfSurah = currentPageData?.ayahs.some(a => a.numberInSurah === 1);

  return (
    <div className="min-h-screen bg-[#F5EFE0] dark:bg-[#1a1510] flex flex-col">
      {/* Header bar */}
      <header className="bg-[#2D5016] dark:bg-[#1a3009] text-white py-2">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <SurahSelector value={selectedSurah} onChange={handleSurahChange} />
              <p className="text-[10px] opacity-70 pl-1">
                {t("পৃষ্ঠা", "Page", "صفحة")} {realPageNum || pageIndex + 1}
              </p>
            </div>
          </div>
          <ReadingSettings
            fontSize={arabicFontSize}
            setFontSize={handleFontSizeChange}
            tajweedEnabled={tajweedEnabled}
            onTajweedToggle={handleTajweedToggle}
          />
        </div>
      </header>

      <div className="container py-3 max-w-xl mx-auto px-2">
        {tajweedEnabled && <div className="mb-3"><TajweedLegend /></div>}

        {isLoading ? (
          <div className="space-y-3 p-4">
            {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}
          </div>
        ) : currentPageData ? (
          <div
            className="relative select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="transition-transform duration-200 ease-out"
              style={{ transform: `translateX(${swipeOffset}px)`, opacity: isAnimating ? 0.6 : 1 }}
            >
              <MushafFrame>
                {/* Top info bar */}
                <div className="flex items-center justify-between px-4 py-1.5 text-[11px]" dir="rtl">
                  <span className="font-arabic text-[#5C4A2A] dark:text-[#C4A96A] font-semibold">{getJuzName(currentJuz)}</span>
                  <span className="text-[#8B7355] dark:text-[#9B8365] tabular-nums">{realPageNum ? toArabicNum(realPageNum) : toArabicNum(pageIndex + 1)}</span>
                  <span className="font-arabic text-[#5C4A2A] dark:text-[#C4A96A] font-semibold">{surah?.name}</span>
                </div>

                <div className="mx-3 border-b border-[#8B7355]/15 dark:border-[#C4A96A]/15" />

                {/* Surah header banner */}
                {isFirstPageOfSurah && (
                  <SurahBanner>
                    <p className="font-arabic text-[18px] md:text-[22px] font-bold text-[#2D5016] dark:text-[#C4A96A]">
                      سُورَةُ {surah?.name}
                    </p>
                  </SurahBanner>
                )}

                {/* Bismillah */}
                {isFirstPageOfSurah && selectedSurah !== 9 && (
                  <div className="py-2 text-center">
                    <p className="font-arabic font-bold text-[#1a1008] dark:text-[#E8DCC8]"
                       style={{ fontSize: `${Math.max(arabicFontSize - 2, 18)}px` }}>
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-1 px-8">
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8B7355]/25 to-transparent dark:via-[#C4A96A]/20" />
                      <svg viewBox="0 0 12 12" className="w-2 h-2 text-[#8B7355]/30 dark:text-[#C4A96A]/25" fill="currentColor">
                        <rect x="3" y="3" width="6" height="6" transform="rotate(45, 6, 6)" />
                      </svg>
                      <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8B7355]/25 to-transparent dark:via-[#C4A96A]/20" />
                    </div>
                  </div>
                )}

                {/* Flowing paragraph */}
                <div className="px-5 md:px-7 py-2" dir="rtl">
                  <p className="font-arabic font-bold text-[#1a1008] dark:text-[#E8DCC8] text-justify leading-[2.2] sm:leading-[2.4] md:leading-[2.6]"
                     style={{ fontSize: `${arabicFontSize}px`, wordSpacing: '0.12em', letterSpacing: '0.01em' }}>
                    {currentPageData.ayahs.map((ayah, idx) => {
                      let displayText = ayah.text;
                      if (isFirstPageOfSurah && ayah.numberInSurah === 1 && selectedSurah !== 9) {
                        displayText = stripBismillah(displayText);
                      }
                      if (!displayText && ayah.numberInSurah === 1) return null;
                      return (
                        <span key={ayah.number}>
                          {tajweedEnabled ? (
                            <TajweedText text={displayText} enabled={true} className="inline" />
                          ) : (
                            <span>{displayText}</span>
                          )}
                          <span className="inline-flex items-center justify-center mx-0.5 text-[#2D5016] dark:text-[#7BAF4C] font-bold select-none align-middle"
                                style={{ fontSize: `${Math.max(11, arabicFontSize - 7)}px`, fontFamily: 'serif' }}>
                            ﴿{toArabicNum(ayah.numberInSurah)}﴾
                          </span>
                          {' '}
                        </span>
                      );
                    })}
                  </p>
                </div>

                {/* Bottom page number with ornament */}
                <div className="mt-auto">
                  <div className="mx-3 border-t border-[#8B7355]/15 dark:border-[#C4A96A]/15" />
                  <div className="text-center py-2 flex items-center justify-center gap-2">
                    <div className="h-px w-8 bg-gradient-to-r from-transparent to-[#8B7355]/20 dark:to-[#C4A96A]/15" />
                    <span className="text-[11px] text-[#8B7355] dark:text-[#9B8365] tabular-nums font-medium">
                      {realPageNum && toArabicNum(realPageNum)}
                    </span>
                    <div className="h-px w-8 bg-gradient-to-l from-transparent to-[#8B7355]/20 dark:to-[#C4A96A]/15" />
                  </div>
                </div>
              </MushafFrame>
            </div>

            {Math.abs(swipeOffset) > 30 && !isAnimating && (
              <div className={`absolute top-1/2 -translate-y-1/2 ${swipeOffset > 0 ? "left-1" : "right-1"} bg-[#2D5016]/80 text-white rounded-full p-2 shadow-lg`}>
                {swipeOffset > 0 ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
            )}
          </div>
        ) : null}

        {/* Page navigation */}
        <div className="flex items-center justify-between mt-3 gap-2">
          <button onClick={goToPrev} disabled={!canGoPrev}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#2D5016]/10 dark:bg-[#7BAF4C]/10 text-[#2D5016] dark:text-[#7BAF4C] hover:bg-[#2D5016]/20 transition-colors disabled:opacity-30 text-xs font-medium">
            <ChevronLeft className="w-4 h-4" />{t("আগের", "Prev", "السابق")}
          </button>
          <div className="flex items-center gap-1">
            {totalPages > 0 && Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const idx = totalPages <= 7 ? i :
                pageIndex <= 3 ? i :
                pageIndex >= totalPages - 4 ? totalPages - 7 + i :
                pageIndex - 3 + i;
              return (
                <button key={idx} onClick={() => setPageIndex(idx)}
                  className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
                    idx === pageIndex
                      ? "bg-[#2D5016] dark:bg-[#7BAF4C] text-white dark:text-[#1a1510] shadow-md scale-110"
                      : "bg-[#E8DCC8] dark:bg-[#2a1f0e] text-[#5C4A2A] dark:text-[#9B8365] hover:bg-[#DDD0B8]"
                  }`}>
                  {toArabicNum(idx + 1)}
                </button>
              );
            })}
          </div>
          <button onClick={goToNext} disabled={!canGoNext}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#2D5016]/10 dark:bg-[#7BAF4C]/10 text-[#2D5016] dark:text-[#7BAF4C] hover:bg-[#2D5016]/20 transition-colors disabled:opacity-30 text-xs font-medium">
            {t("পরের", "Next", "التالي")}<ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <SurahNav selectedSurah={selectedSurah} setSelectedSurah={handleSurahChange} />
      </div>
    </div>
  );
}
