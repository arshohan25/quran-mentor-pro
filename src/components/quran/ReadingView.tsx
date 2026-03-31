import { useState, useMemo, useCallback, useRef } from "react";
import { ArrowLeft, Palette, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { surahList } from "@/data/surahList";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBookmark } from "@/hooks/useBookmark";
import { Skeleton } from "@/components/ui/skeleton";
import TajweedText, { TajweedLegend } from "@/components/TajweedText";
import SurahSelector from "./SurahSelector";
import SurahNav from "./SurahNav";
import { LINES_PER_PAGE, type QuranSectionProps } from "./types";

export default function ReadingView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t } = useLanguage();
  const { toggleFavorite, isFavorite } = useBookmark();
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
    for (let i = 0; i < ayahs.length; i += LINES_PER_PAGE) {
      result.push(ayahs.slice(i, i + LINES_PER_PAGE));
    }
    return result;
  }, [data]);

  const totalPages = pages.length;

  const canGoPrev = currentPage > 0 || selectedSurah > 1;
  const canGoNext = currentPage < totalPages - 1 || selectedSurah < 114;

  const goToPrev = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (selectedSurah > 1) {
      setSelectedSurah(selectedSurah - 1);
      setCurrentPage(999);
    }
  }, [currentPage, selectedSurah, setSelectedSurah]);

  const goToNext = useCallback(() => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    } else if (selectedSurah < 114) {
      setSelectedSurah(selectedSurah + 1);
      setCurrentPage(0);
    }
  }, [currentPage, totalPages, selectedSurah, setSelectedSurah]);

  const handleSurahChange = (n: number) => {
    setSelectedSurah(n);
    setCurrentPage(0);
  };

  // Touch handlers for swipe
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
    // Only horizontal swipe
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
      setSwipeOffset(dx);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || isAnimating) return;
    const threshold = 80;
    if (swipeOffset > threshold && canGoPrev) {
      // Swipe right → previous (RTL: next page visually)
      setIsAnimating(true);
      setSwipeOffset(300);
      setTimeout(() => {
        goToPrev();
        setSwipeOffset(0);
        setIsAnimating(false);
      }, 200);
    } else if (swipeOffset < -threshold && canGoNext) {
      // Swipe left → next
      setIsAnimating(true);
      setSwipeOffset(-300);
      setTimeout(() => {
        goToNext();
        setSwipeOffset(0);
        setIsAnimating(false);
      }, 200);
    } else {
      setSwipeOffset(0);
    }
    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Compact header */}
      <header className="bg-primary text-primary-foreground py-2.5 shadow-lg">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="hover:opacity-80 transition-opacity">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-sm font-bold">{t("কুরআন তেলাওয়াত", "Quran Reading", "تلاوة القرآن")}</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => { setTajweedEnabled(!tajweedEnabled); localStorage.setItem("tajweedEnabled", String(!tajweedEnabled)); }}
                className={`p-1.5 rounded-lg transition-colors ${tajweedEnabled ? "bg-primary-foreground/20" : "text-primary-foreground/60 hover:text-primary-foreground"}`}
                title={t("তাজবীদ কালার", "Tajweed Colors", "ألوان التجويد")}
              >
                <Palette className="w-4 h-4" />
              </button>
              <SurahSelector value={selectedSurah} onChange={handleSurahChange} />
            </div>
          </div>
        </div>
      </header>

      <div className="container py-3 max-w-2xl mx-auto px-2">
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
              <div className="rounded-2xl border-2 border-primary/20 bg-card shadow-xl overflow-hidden">
                {/* Page top ornament */}
                <div className="h-1.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

                {/* Surah header bar */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-primary/10 bg-primary/5">
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {t(`পৃষ্ঠা ${currentPage + 1}/${totalPages}`, `Page ${currentPage + 1}/${totalPages}`, `${currentPage + 1}/${totalPages}`)}
                  </span>
                  <span className="font-arabic text-sm text-primary font-bold">{surah?.name}</span>
                  <span className="text-[10px] text-muted-foreground font-medium">
                    {surah?.bengaliName}
                  </span>
                </div>

                {/* Bismillah on first page */}
                {currentPage === 0 && selectedSurah !== 9 && (
                  <div className="py-3 text-center border-b border-primary/10 bg-gradient-to-r from-transparent via-primary/5 to-transparent">
                    <p className="font-arabic text-xl md:text-2xl text-primary/80 leading-relaxed">
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                    </p>
                  </div>
                )}

                {/* Ayah content area */}
                <div className="px-3 py-2 md:px-5 md:py-3 min-h-[420px] flex flex-col justify-between" dir="rtl">
                  <div className="space-y-0">
                    {pages[currentPage]?.map((ayah, idx) => (
                      <div
                        key={ayah.number}
                        className={`flex items-start gap-1.5 py-[6px] ${
                          idx < (pages[currentPage]?.length || 0) - 1 ? "border-b border-border/20" : ""
                        }`}
                      >
                        {/* Ayah number badge */}
                        <div className="shrink-0 mt-1" dir="ltr">
                          <div className="w-6 h-6 rounded-full border border-primary/30 bg-primary/5 flex items-center justify-center">
                            <span className="text-[9px] text-primary font-bold font-sans">{ayah.numberInSurah}</span>
                          </div>
                        </div>

                        {/* Arabic text */}
                        <TajweedText
                          text={ayah.text}
                          enabled={tajweedEnabled}
                          className="font-arabic text-[17px] md:text-xl lg:text-2xl leading-[2.4] text-foreground flex-1"
                        />

                        {/* Bookmark */}
                        <button
                          onClick={() => toggleFavorite(selectedSurah, ayah.numberInSurah, ayah.text)}
                          className="p-0.5 shrink-0 mt-1"
                          dir="ltr"
                        >
                          <Star className={`w-3 h-3 ${isFavorite(selectedSurah, ayah.numberInSurah) ? "fill-accent text-accent" : "text-muted-foreground/20 hover:text-muted-foreground/50"} transition-colors`} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Page bottom ornament */}
                <div className="h-1.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent" />
              </div>
            </div>

            {/* Swipe hint overlay */}
            {Math.abs(swipeOffset) > 30 && !isAnimating && (
              <div className={`absolute top-1/2 -translate-y-1/2 ${swipeOffset > 0 ? "left-2" : "right-2"} bg-primary/80 text-primary-foreground rounded-full p-2 shadow-lg`}>
                {swipeOffset > 0 ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
              </div>
            )}
          </div>
        ) : null}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-3 gap-2">
          <button
            onClick={goToPrev}
            disabled={!canGoPrev}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 text-xs font-medium"
          >
            <ChevronLeft className="w-4 h-4" />
            {t("আগের", "Prev", "السابق")}
          </button>
          <div className="flex items-center gap-1.5">
            {totalPages > 0 && Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              const pageIdx = totalPages <= 7 ? i : 
                currentPage <= 3 ? i :
                currentPage >= totalPages - 4 ? totalPages - 7 + i :
                currentPage - 3 + i;
              return (
                <button
                  key={pageIdx}
                  onClick={() => setCurrentPage(pageIdx)}
                  className={`w-6 h-6 rounded-full text-[10px] font-bold transition-all ${
                    pageIdx === currentPage
                      ? "bg-primary text-primary-foreground shadow-md scale-110"
                      : "bg-muted text-muted-foreground hover:bg-primary/10"
                  }`}
                >
                  {pageIdx + 1}
                </button>
              );
            })}
          </div>
          <button
            onClick={goToNext}
            disabled={!canGoNext}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors disabled:opacity-30 text-xs font-medium"
          >
            {t("পরের", "Next", "التالي")}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <SurahNav selectedSurah={selectedSurah} setSelectedSurah={handleSurahChange} />
      </div>
    </div>
  );
}
