import { useState, useMemo, useCallback, useRef } from "react";
import { ArrowLeft, Palette, ChevronLeft, ChevronRight } from "lucide-react";
import { surahList } from "@/data/surahList";
import { juzList } from "@/data/juzData";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import TajweedText, { TajweedLegend } from "@/components/TajweedText";
import SurahSelector from "./SurahSelector";
import SurahNav from "./SurahNav";
import { LINES_PER_PAGE, CHARS_PER_LINE } from "./types";

// Convert number to Arabic numerals
function toArabicNum(n: number): string {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).replace(/\d/g, (d) => arabicDigits[parseInt(d)]);
}

// Find juz number for an ayah
function getJuzNumber(surahNumber: number, ayahNumber: number): number {
  for (let i = juzList.length - 1; i >= 0; i--) {
    const j = juzList[i];
    if (
      surahNumber > j.startSurah ||
      (surahNumber === j.startSurah && ayahNumber >= j.startAyah)
    ) {
      return j.number;
    }
  }
  return 1;
}

// Get juz name
function getJuzName(juzNum: number): string {
  const juz = juzList.find(j => j.number === juzNum);
  return juz?.name || `الجزء ${toArabicNum(juzNum)}`;
}

// Get manzil number (Quran divided into 7 manzils)
function getManzil(surahNumber: number, ayahNumber: number): number {
  const juz = getJuzNumber(surahNumber, ayahNumber);
  if (juz <= 4) return 1;
  if (juz <= 8) return 2;
  if (juz <= 13) return 3;
  if (juz <= 17) return 4;
  if (juz <= 21) return 5;
  if (juz <= 26) return 6;
  return 7;
}

interface QuranSectionProps {
  selectedSurah: number;
  setSelectedSurah: (n: number) => void;
  onBack: () => void;
}

export default function ReadingView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(0);
  const [tajweedEnabled, setTajweedEnabled] = useState(() => {
    try { return localStorage.getItem("tajweedEnabled") !== "false"; } catch { return true; }
  });

  // Swipe state
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const { data, isLoading } = useSurahWithTranslations(selectedSurah);
  const surah = surahList.find(s => s.number === selectedSurah);

  const pages = useMemo(() => {
    if (!data) return [];
    const ayahs = data.arabic.ayahs;
    const result: typeof ayahs[] = [];
    let currentPageAyahs: typeof ayahs = [];
    let currentLineCount = 0;

    for (const ayah of ayahs) {
      const ayahLines = Math.max(1, Math.ceil(ayah.text.length / CHARS_PER_LINE));
      if (currentLineCount + ayahLines > LINES_PER_PAGE && currentPageAyahs.length > 0) {
        result.push(currentPageAyahs);
        currentPageAyahs = [ayah];
        currentLineCount = ayahLines;
      } else {
        currentPageAyahs.push(ayah);
        currentLineCount += ayahLines;
      }
    }
    if (currentPageAyahs.length) result.push(currentPageAyahs);
    return result;
  }, [data]);

  const totalPages = pages.length;
  const canGoPrev = currentPage > 0 || selectedSurah > 1;
  const canGoNext = currentPage < totalPages - 1 || selectedSurah < 114;

  const goToPrev = useCallback(() => {
    if (currentPage > 0) setCurrentPage(currentPage - 1);
    else if (selectedSurah > 1) { setSelectedSurah(selectedSurah - 1); setCurrentPage(999); }
  }, [currentPage, selectedSurah, setSelectedSurah]);

  const goToNext = useCallback(() => {
    if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1);
    else if (selectedSurah < 114) { setSelectedSurah(selectedSurah + 1); setCurrentPage(0); }
  }, [currentPage, totalPages, selectedSurah, setSelectedSurah]);

  const handleSurahChange = (n: number) => { setSelectedSurah(n); setCurrentPage(0); };

  // Touch handlers
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

  // Get juz number from first ayah of current page
  const currentJuz = pages[currentPage]?.[0]
    ? getJuzNumber(selectedSurah, pages[currentPage][0].numberInSurah)
    : 1;

  const currentManzil = pages[currentPage]?.[0]
    ? getManzil(selectedSurah, pages[currentPage][0].numberInSurah)
    : 1;

  return (
    <div className="min-h-screen bg-[#F5EFE0] dark:bg-[#1a1510]">
      {/* Compact top toolbar */}
      <header className="bg-[#2D5016] dark:bg-[#1a3009] text-white py-2 shadow-lg sticky top-0 z-20">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="hover:opacity-80 transition-opacity p-1">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xs font-semibold opacity-90">{t("কুরআন তেলাওয়াত", "Quran Reading", "تلاوة القرآن")}</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setTajweedEnabled(!tajweedEnabled); localStorage.setItem("tajweedEnabled", String(!tajweedEnabled)); }}
                className={`p-1.5 rounded-lg transition-colors ${tajweedEnabled ? "bg-white/20" : "text-white/60 hover:text-white"}`}
                title={t("তাজবীদ কালার", "Tajweed Colors", "ألوان التجويد")}
              >
                <Palette className="w-4 h-4" />
              </button>
              <SurahSelector value={selectedSurah} onChange={handleSurahChange} />
            </div>
          </div>
        </div>
      </header>

      <div className="container py-3 max-w-xl mx-auto px-2">
        {tajweedEnabled && <div className="mb-3"><TajweedLegend /></div>}

        {isLoading ? (
          <div className="space-y-3 p-4">
            {[...Array(LINES_PER_PAGE)].map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}
          </div>
        ) : pages.length > 0 ? (
          <div
            className="relative select-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            {/* Mushaf Page */}
            <div
              className="transition-transform duration-200 ease-out"
              style={{ transform: `translateX(${swipeOffset}px)`, opacity: isAnimating ? 0.6 : 1 }}
            >
              {/* === OUTER HEADER (above frame) === */}
              <div className="flex items-center justify-between px-2 pb-1.5" dir="rtl">
                <span className="font-arabic text-[11px] text-[#5C4A2A] dark:text-[#C4A96A] font-bold">
                  {getJuzName(currentJuz)}
                </span>
                <span className="text-[12px] text-[#8B7355] dark:text-[#9B8365] font-bold tabular-nums">
                  {toArabicNum(currentPage + 1)}
                </span>
                <span className="font-arabic text-[11px] text-[#5C4A2A] dark:text-[#C4A96A] font-bold">
                  {surah?.name} {toArabicNum(selectedSurah)}
                </span>
              </div>

              {/* === ORNAMENTAL FRAME === */}
              <div className="relative">
                {/* Outer decorative border */}
                <div className="rounded-sm border-[4px] border-[#8B7355]/60 dark:border-[#C4A96A]/50 bg-[#FFFDF7] dark:bg-[#1e1708] shadow-[0_6px_30px_rgba(92,74,42,0.2)] dark:shadow-[0_6px_30px_rgba(0,0,0,0.5)]">
                  {/* Inner decorative border */}
                  <div className="m-[5px] border-[2.5px] border-[#8B7355]/40 dark:border-[#C4A96A]/35 rounded-sm relative">
                    
                    {/* Corner ornaments */}
                    <span className="absolute -top-2 -left-2 text-[#8B7355]/70 dark:text-[#C4A96A]/60 text-[18px] leading-none select-none z-10">❁</span>
                    <span className="absolute -top-2 -right-2 text-[#8B7355]/70 dark:text-[#C4A96A]/60 text-[18px] leading-none select-none z-10">❁</span>
                    <span className="absolute -bottom-2 -left-2 text-[#8B7355]/70 dark:text-[#C4A96A]/60 text-[18px] leading-none select-none z-10">❁</span>
                    <span className="absolute -bottom-2 -right-2 text-[#8B7355]/70 dark:text-[#C4A96A]/60 text-[18px] leading-none select-none z-10">❁</span>

                    {/* Top ornamental bar */}
                    <div className="h-[2.5px] bg-gradient-to-r from-[#8B7355]/10 via-[#8B7355]/60 to-[#8B7355]/10 dark:from-[#C4A96A]/10 dark:via-[#C4A96A]/60 dark:to-[#C4A96A]/10" />

                    {/* Bismillah for first page of surah */}
                    {currentPage === 0 && selectedSurah !== 9 && (
                      <>
                        {/* Surah title header */}
                        <div className="py-3 text-center border-b-2 border-[#8B7355]/20 dark:border-[#C4A96A]/20 bg-gradient-to-b from-[#F5EFE0]/60 to-transparent dark:from-[#2a1f0e]/40">
                          <p className="font-arabic text-[15px] md:text-[17px] text-[#5C4A2A] dark:text-[#C4A96A] font-bold">
                            سُورَةُ {surah?.name}
                          </p>
                        </div>
                        {/* Bismillah — premium centered style */}
                        <div className="py-5 text-center">
                          <div className="inline-block">
                            <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-[#8B7355]/50 to-transparent dark:via-[#C4A96A]/50 mb-3" />
                            <p className="font-arabic text-[24px] md:text-[28px] text-[#2D5016] dark:text-[#7BAF4C] leading-relaxed tracking-wide font-bold">
                              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                            </p>
                            <div className="h-[1.5px] w-full bg-gradient-to-r from-transparent via-[#8B7355]/50 to-transparent dark:via-[#C4A96A]/50 mt-3" />
                          </div>
                        </div>
                      </>
                    )}

                    {/* === FLOWING AYAH TEXT === */}
                    <div className="px-4 py-4 md:px-6 md:py-5" dir="rtl">
                      <p className="font-arabic text-[26px] md:text-[30px] font-bold leading-[2.8] md:leading-[3] text-[#1a1008] dark:text-[#E8DCC8] text-justify w-full"
                         style={{ wordSpacing: '0.08em', letterSpacing: '0.01em', textAlignLast: 'center' }}>
                        {pages[currentPage]?.map((ayah, idx) => {
                          // Strip bismillah from first ayah to avoid duplicate
                          let displayText = ayah.text;
                          if (currentPage === 0 && idx === 0 && selectedSurah !== 9) {
                            displayText = displayText.replace(/بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ/, '').trim();
                          }
                          if (!displayText && currentPage === 0 && idx === 0) return null;
                          return (
                            <span key={ayah.number}>
                              {tajweedEnabled ? (
                                <TajweedText
                                  text={displayText}
                                  enabled={true}
                                  className="inline"
                                />
                              ) : (
                                <span>{displayText}</span>
                              )}
                              <span className="inline-flex items-center justify-center mx-1 text-[#2D5016] dark:text-[#7BAF4C] text-[14px] md:text-[16px] font-bold select-none align-middle"
                                    style={{ fontFamily: 'serif' }}>
                                ﴿{toArabicNum(ayah.numberInSurah)}﴾
                              </span>
                            </span>
                          );
                        })}
                      </p>
                    </div>

                    {/* Bottom ornamental bar */}
                    <div className="h-[2.5px] bg-gradient-to-r from-[#8B7355]/10 via-[#8B7355]/60 to-[#8B7355]/10 dark:from-[#C4A96A]/10 dark:via-[#C4A96A]/60 dark:to-[#C4A96A]/10" />
                  </div>
                </div>
              </div>

              {/* === FOOTER (below frame) === */}
              <div className="text-center pt-1.5">
                <span className="font-arabic text-[11px] text-[#8B7355] dark:text-[#9B8365]">
                  مَنْزِل {toArabicNum(currentManzil)}
                </span>
              </div>
            </div>

            {/* Swipe hint overlay */}
            {Math.abs(swipeOffset) > 30 && !isAnimating && (
              <div className={`absolute top-1/2 -translate-y-1/2 ${swipeOffset > 0 ? "left-1" : "right-1"} bg-[#2D5016]/80 text-white rounded-full p-2 shadow-lg`}>
                {swipeOffset > 0 ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
            )}
          </div>
        ) : null}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-3 gap-2">
          <button onClick={goToPrev} disabled={!canGoPrev}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-[#2D5016]/10 dark:bg-[#7BAF4C]/10 text-[#2D5016] dark:text-[#7BAF4C] hover:bg-[#2D5016]/20 transition-colors disabled:opacity-30 text-xs font-medium">
            <ChevronLeft className="w-4 h-4" />{t("আগের", "Prev", "السابق")}
          </button>
          <div className="flex items-center gap-1">
            {totalPages > 0 && Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageIdx = totalPages <= 7 ? i :
                currentPage <= 3 ? i :
                currentPage >= totalPages - 4 ? totalPages - 7 + i :
                currentPage - 3 + i;
              return (
                <button key={pageIdx} onClick={() => setCurrentPage(pageIdx)}
                  className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
                    pageIdx === currentPage
                      ? "bg-[#2D5016] dark:bg-[#7BAF4C] text-white dark:text-[#1a1510] shadow-md scale-110"
                      : "bg-[#E8DCC8] dark:bg-[#2a1f0e] text-[#5C4A2A] dark:text-[#9B8365] hover:bg-[#DDD0B8]"
                  }`}>
                  {toArabicNum(pageIdx + 1)}
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
