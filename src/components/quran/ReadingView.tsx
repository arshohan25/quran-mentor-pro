import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { surahList } from "@/data/surahList";
import { juzList } from "@/data/juzData";
import { surahForPage } from "@/data/mushafPages";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import TajweedText from "@/components/TajweedText";
import SurahSelector from "./SurahSelector";
import ReadingSettings from "./ReadingSettings";
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
  const [targetMushafPage, setTargetMushafPage] = useState<number | null>(null);
  const [showPageJump, setShowPageJump] = useState(false);
  const [pageJumpInput, setPageJumpInput] = useState("");
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
    const pageMap = new Map<number, typeof ayahs>();
    for (const ayah of ayahs) {
      const pg = ayah.page;
      if (!pageMap.has(pg)) pageMap.set(pg, []);
      pageMap.get(pg)!.push(ayah);
    }
    return Array.from(pageMap.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([pageNum, ayas]) => ({ pageNum, ayahs: ayas }));
  }, [data]);

  const totalPages = pages.length;

  useEffect(() => {
    if (totalPages === 0) return;
    if (targetMushafPage !== null) {
      const idx = pages.findIndex(p => p.pageNum === targetMushafPage);
      setPageIndex(idx >= 0 ? idx : 0);
      setTargetMushafPage(null);
    } else if (goToLastPage) {
      setPageIndex(totalPages - 1);
      setGoToLastPage(false);
    } else {
      setPageIndex(prev => Math.min(prev, totalPages - 1));
    }
  }, [totalPages, goToLastPage, targetMushafPage, pages]);

  const handlePageJump = () => {
    const num = parseInt(pageJumpInput, 10);
    if (isNaN(num) || num < 1 || num > 604) return;
    setShowPageJump(false);
    setPageJumpInput("");
    const idx = pages.findIndex(p => p.pageNum === num);
    if (idx >= 0) {
      setPageIndex(idx);
    } else {
      const targetSurah = surahForPage(num);
      setTargetMushafPage(num);
      setSelectedSurah(targetSurah);
    }
  };

  useEffect(() => {
    const currentPageData = pages[pageIndex];
    if (currentPageData && currentPageData.ayahs[0]) {
      saveLastRead(selectedSurah, currentPageData.ayahs[0].numberInSurah, currentPageData.pageNum, "reading");
    }
  }, [selectedSurah, pageIndex, pages, saveLastRead]);

  const canGoPrev = pageIndex > 0 || selectedSurah > 1;
  const canGoNext = pageIndex < totalPages - 1 || selectedSurah < 114;

  const goToPrev = useCallback(() => {
    if (pageIndex > 0) setPageIndex(pageIndex - 1);
    else if (selectedSurah > 1) { setGoToLastPage(true); setSelectedSurah(selectedSurah - 1); }
  }, [pageIndex, selectedSurah, setSelectedSurah]);

  const goToNext = useCallback(() => {
    if (pageIndex < totalPages - 1) setPageIndex(pageIndex + 1);
    else if (selectedSurah < 114) { setSelectedSurah(selectedSurah + 1); setPageIndex(0); }
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

  const surahTotalAyahs = data?.arabic.ayahs.length || 1;
  const lastAyahOnPage = currentPageData?.ayahs[currentPageData.ayahs.length - 1];
  const readProgress = lastAyahOnPage ? Math.round((lastAyahOnPage.numberInSurah / surahTotalAyahs) * 100) : 0;

  return (
    <div className="h-screen bg-white dark:bg-gray-950 flex flex-col overflow-hidden">
      {/* Teal header */}
      <header className="bg-[#008374] text-white py-2">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <SurahSelector value={selectedSurah} onChange={handleSurahChange} />
              <button
                onClick={() => { setShowPageJump(!showPageJump); setPageJumpInput(String(realPageNum || "")); }}
                className="text-[10px] opacity-70 pl-1 hover:opacity-100 transition-opacity flex items-center gap-1"
              >
                <Search className="w-2.5 h-2.5" />
                {t("পৃষ্ঠা", "Page", "صفحة")} {realPageNum || pageIndex + 1} · {getJuzName(currentJuz)}
              </button>
            </div>
          </div>
          <ReadingSettings
            fontSize={arabicFontSize}
            setFontSize={handleFontSizeChange}
            tajweedEnabled={tajweedEnabled}
            onTajweedToggle={handleTajweedToggle}
          />
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-[#006b5f]">
          <div
            className="h-full bg-gradient-to-r from-[#00b8a3] to-[#4dd9c0] transition-all duration-300 ease-out"
            style={{ width: `${readProgress}%` }}
          />
        </div>
      </header>

      {/* Page jump */}
      {showPageJump && (
        <div className="bg-[#008374]/90 px-4 py-2.5 flex items-center gap-2">
          <input
            type="number" min={1} max={604}
            value={pageJumpInput}
            onChange={(e) => setPageJumpInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePageJump()}
            placeholder="1-604" autoFocus
            className="w-20 px-2 py-1 rounded text-sm bg-white/15 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button onClick={handlePageJump} className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors">
            {t("যাও", "Go", "اذهب")}
          </button>
          <button onClick={() => setShowPageJump(false)} className="ml-auto text-white/60 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {isLoading ? (
          <div className="space-y-3 p-6 flex-1">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}
          </div>
        ) : currentPageData ? (
          <div
            className="relative select-none flex-1 flex flex-col"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="transition-transform duration-200 ease-out flex-1 flex flex-col"
              style={{ transform: `translateX(${swipeOffset}px)`, opacity: isAnimating ? 0.6 : 1 }}
            >
              {/* Clean reading container */}
              <div className="flex-1 flex flex-col bg-white dark:bg-gray-950 border-x border-gray-100 dark:border-gray-800 max-w-2xl mx-auto w-full">
                {/* Top info bar */}
                <div className="flex items-center justify-between px-5 py-2 text-[11px] border-b border-gray-100 dark:border-gray-800" dir="rtl">
                  <span className="font-arabic text-[#008374] dark:text-[#4dd9c0] font-semibold">{getJuzName(currentJuz)}</span>
                  <span className="text-gray-400 dark:text-gray-500 tabular-nums">{realPageNum ? toArabicNum(realPageNum) : toArabicNum(pageIndex + 1)}</span>
                  <span className="font-arabic text-[#008374] dark:text-[#4dd9c0] font-semibold">{surah?.name}</span>
                </div>

                {/* Surah intro */}
                {isFirstPageOfSurah && (
                  <div className="text-center py-4 px-6">
                    <div className="inline-block px-8 py-3 rounded-2xl bg-[#008374]/5 dark:bg-[#008374]/10 border border-[#008374]/10 dark:border-[#008374]/20">
                      <p className="font-arabic text-[24px] md:text-[28px] font-bold text-[#008374] dark:text-[#4dd9c0]">
                        سُورَةُ {surah?.name}
                      </p>
                      <p className="text-[12px] text-gray-500 dark:text-gray-400 mt-1">
                        {surah?.englishNameTranslation} · {surah?.numberOfAyahs} {t("আয়াত", "Verses", "آيات")}
                      </p>
                    </div>

                    {/* Bismillah */}
                    {selectedSurah !== 9 && (
                      <div className="mt-3">
                        <p className="font-arabic font-bold text-gray-800 dark:text-gray-200"
                           style={{ fontSize: `${Math.max(arabicFontSize - 2, 18)}px` }}>
                          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                        </p>
                        <div className="flex items-center justify-center gap-3 mt-2 px-12">
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#008374]/30 dark:bg-[#4dd9c0]/30" />
                          <div className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Flowing Arabic text */}
                <div className="px-5 md:px-8 py-2 flex-1 overflow-hidden" dir="rtl">
                  <p className="font-arabic font-bold text-gray-900 dark:text-gray-100 text-justify leading-[2.2] sm:leading-[2.4] md:leading-[2.6]"
                     style={{ fontSize: `${arabicFontSize}px`, wordSpacing: '0.12em', letterSpacing: '0.01em' }}>
                    {currentPageData.ayahs.map((ayah) => {
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
                          <span className="inline-flex items-center justify-center mx-0.5 text-[#008374] dark:text-[#4dd9c0] font-bold select-none align-middle"
                                style={{ fontSize: `${Math.max(11, arabicFontSize - 7)}px`, fontFamily: 'serif' }}>
                            ﴿{toArabicNum(ayah.numberInSurah)}﴾
                          </span>
                          {' '}
                        </span>
                      );
                    })}
                  </p>
                </div>

                {/* Bottom page number */}
                <div className="mt-auto border-t border-gray-100 dark:border-gray-800">
                  <div className="text-center py-1.5 flex items-center justify-center gap-2">
                    <div className="h-px w-8 bg-gradient-to-r from-transparent to-gray-200 dark:to-gray-700" />
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 tabular-nums font-medium">
                      {realPageNum && toArabicNum(realPageNum)}
                    </span>
                    <div className="h-px w-8 bg-gradient-to-l from-transparent to-gray-200 dark:to-gray-700" />
                  </div>
                </div>
              </div>
            </div>

            {/* Swipe indicator */}
            {Math.abs(swipeOffset) > 30 && !isAnimating && (
              <div className={`absolute top-1/2 -translate-y-1/2 ${swipeOffset > 0 ? "left-1" : "right-1"} bg-[#008374]/80 text-white rounded-full p-2 shadow-lg`}>
                {swipeOffset > 0 ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
