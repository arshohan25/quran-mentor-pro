import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { surahList } from "@/data/surahList";
import { juzList } from "@/data/juzData";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import TajweedText, { TajweedLegend } from "@/components/TajweedText";
import SurahSelector from "./SurahSelector";
import SurahNav from "./SurahNav";
import ReadingSettings from "./ReadingSettings";
import { useBookmark } from "@/hooks/useBookmark";
import { LINES_PER_PAGE, CHARS_PER_LINE } from "./types";

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

function getManzil(surahNumber: number, ayahNumber: number): number {
  const juz = getJuzNumber(surahNumber, ayahNumber);
  if (juz <= 4) return 1; if (juz <= 8) return 2; if (juz <= 13) return 3;
  if (juz <= 17) return 4; if (juz <= 21) return 5; if (juz <= 26) return 6; return 7;
}

const SURAH_RUKU_COUNT: Record<number, number> = {
  1:1,2:40,3:20,4:24,5:16,6:20,7:24,8:10,9:16,10:11,11:10,12:12,13:6,14:7,15:6,16:16,17:12,18:12,19:6,20:8,
  21:7,22:10,23:6,24:9,25:6,26:11,27:7,28:9,29:7,30:6,31:4,32:3,33:9,34:6,35:5,36:5,37:5,38:5,39:8,40:9,
  41:6,42:5,43:7,44:3,45:4,46:4,47:4,48:4,49:2,50:3,51:3,52:2,53:3,54:3,55:3,56:3,57:4,58:3,59:3,60:2,
  61:2,62:2,63:2,64:2,65:2,66:2,67:2,68:2,69:2,70:2,71:2,72:2,73:2,74:2,75:1,76:2,77:2,78:2,79:2,80:1,
  81:1,82:1,83:1,84:1,85:1,86:1,87:1,88:1,89:1,90:1,91:1,92:1,93:1,94:1,95:1,96:1,97:1,98:1,99:1,100:1,
  101:1,102:1,103:1,104:1,105:1,106:1,107:1,108:1,109:1,110:1,111:1,112:1,113:1,114:1,
};

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
  const [currentPage, setCurrentPage] = useState(0);
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

  const pages = useMemo(() => {
    if (!data) return [];
    const ayahs = data.arabic.ayahs;
    const result: typeof ayahs[] = [];
    let currentPageAyahs: typeof ayahs = [];
    let currentLineCount = 0;
    const hasBismillah = selectedSurah !== 9;
    const firstPageLines = hasBismillah ? LINES_PER_PAGE - 4 : LINES_PER_PAGE - 3;
    let maxLinesForCurrentPage = firstPageLines;

    for (const ayah of ayahs) {
      let textForCounting = ayah.text;
      if (result.length === 0 && currentPageAyahs.length === 0 && hasBismillah) {
        textForCounting = stripBismillah(textForCounting);
        if (!textForCounting) textForCounting = ayah.text;
      }
      const ayahLines = Math.max(1, Math.ceil(textForCounting.length / CHARS_PER_LINE));
      if (currentLineCount + ayahLines > maxLinesForCurrentPage && currentPageAyahs.length > 0) {
        result.push(currentPageAyahs);
        currentPageAyahs = [ayah];
        currentLineCount = ayahLines;
        maxLinesForCurrentPage = LINES_PER_PAGE;
      } else {
        currentPageAyahs.push(ayah);
        currentLineCount += ayahLines;
      }
    }
    if (currentPageAyahs.length) result.push(currentPageAyahs);
    return result;
  }, [data, selectedSurah]);

  // Auto-save reading position
  useEffect(() => {
    const firstAyah = pages[currentPage]?.[0];
    if (firstAyah) {
      saveLastRead(selectedSurah, firstAyah.numberInSurah, currentPage, "reading");
    }
  }, [selectedSurah, currentPage, pages, saveLastRead]);

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

  const currentJuz = pages[currentPage]?.[0] ? getJuzNumber(selectedSurah, pages[currentPage][0].numberInSurah) : 1;
  const currentManzil = pages[currentPage]?.[0] ? getManzil(selectedSurah, pages[currentPage][0].numberInSurah) : 1;
  const realPage = pages[currentPage]?.[0]?.page;

  return (
    <div className="min-h-screen bg-[#F5EFE0] dark:bg-[#1a1510] flex flex-col">
      {/* Header bar */}
      <header className="bg-[#2D5016] dark:bg-[#1a3009] text-white py-2">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <SurahSelector value={selectedSurah} onChange={handleSurahChange} />
              <p className="text-[10px] opacity-70 pl-1">{t("পৃষ্ঠা", "Page", "صفحة")} {realPage ? realPage : currentPage + 1}</p>
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
            {[...Array(LINES_PER_PAGE)].map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}
          </div>
        ) : pages.length > 0 ? (
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
              {/* Mushaf page frame */}
              <div className="relative bg-[#FFFDF7] dark:bg-[#1e1708] rounded border-2 border-[#8B7355]/40 dark:border-[#C4A96A]/40 shadow-[0_4px_20px_rgba(92,74,42,0.15)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.4)] min-h-[70vh]">
                {/* Top info bar inside frame */}
                <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#8B7355]/20 dark:border-[#C4A96A]/20 text-[11px]" dir="rtl">
                  <span className="font-arabic text-[#5C4A2A] dark:text-[#C4A96A] font-semibold">{getJuzName(currentJuz)}</span>
                  <span className="text-[#8B7355] dark:text-[#9B8365] tabular-nums">{realPage ? toArabicNum(realPage) : toArabicNum(currentPage + 1)}</span>
                  <span className="font-arabic text-[#5C4A2A] dark:text-[#C4A96A] font-semibold">{surah?.name}</span>
                </div>


                    {/* Surah header banner */}
                    {currentPage === 0 && (
                      <div className="mx-2 mt-2 mb-1 border-2 border-[#4A90A4]/50 dark:border-[#C4A96A]/40 rounded-lg bg-gradient-to-r from-[#E8F4F8]/80 via-[#D4EBF2]/60 to-[#E8F4F8]/80 dark:from-[#1a2a30]/60 dark:via-[#1e1708]/40 dark:to-[#1a2a30]/60 py-2.5 px-4 text-center relative overflow-hidden">
                        <div className="absolute inset-0 opacity-[0.08]">
                          <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#4A90A4] rounded-tl-lg" />
                          <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#4A90A4] rounded-tr-lg" />
                          <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#4A90A4] rounded-bl-lg" />
                          <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#4A90A4] rounded-br-lg" />
                        </div>
                        <p className="font-arabic text-[18px] md:text-[22px] font-bold text-[#2D5016] dark:text-[#C4A96A] relative z-10">
                          سُورَةُ {surah?.name}
                        </p>
                      </div>
                    )}

                    {/* Bismillah */}
                    {currentPage === 0 && selectedSurah !== 9 && (
                      <div className="py-2 text-center">
                        <p className="font-arabic font-bold text-[#1a1008] dark:text-[#E8DCC8]"
                           style={{ fontSize: `${Math.max(arabicFontSize - 2, 18)}px` }}>
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                        </p>
                      </div>
                    )}

                    {/* Flowing paragraph — all ayahs as one continuous block */}
                    <div className="px-4 md:px-6 py-2" dir="rtl">
                      <p className="font-arabic font-bold text-[#1a1008] dark:text-[#E8DCC8] text-justify leading-[2.2] sm:leading-[2.4] md:leading-[2.6]"
                         style={{ fontSize: `${arabicFontSize}px`, wordSpacing: '0.12em', letterSpacing: '0.01em' }}>
                        {pages[currentPage]?.map((ayah, idx) => {
                          let displayText = ayah.text;
                          if (currentPage === 0 && idx === 0 && selectedSurah !== 9) {
                            displayText = stripBismillah(displayText);
                          }
                          if (!displayText && currentPage === 0 && idx === 0) return null;
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

                    <div className="h-[3px] bg-gradient-to-r from-[#8B7355]/10 via-[#8B7355]/60 to-[#8B7355]/10 dark:from-[#C4A96A]/10 dark:via-[#C4A96A]/60 dark:to-[#C4A96A]/10" />
                  </div>
                </div>
              </div>

              <div className="text-center pt-1.5">
                <span className="font-arabic text-[11px] text-[#8B7355] dark:text-[#9B8365]">
                  مَنْزِل {toArabicNum(currentManzil)}
                </span>
              </div>
            </div>

            {Math.abs(swipeOffset) > 30 && !isAnimating && (
              <div className={`absolute top-1/2 -translate-y-1/2 ${swipeOffset > 0 ? "left-1" : "right-1"} bg-[#2D5016]/80 text-white rounded-full p-2 shadow-lg`}>
                {swipeOffset > 0 ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
            )}
          </div>
        ) : null}

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
