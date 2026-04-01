import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { ArrowLeft, Play, Pause, Bookmark, BookmarkCheck, ChevronLeft, ChevronRight, BookOpen, AlignJustify } from "lucide-react";
import { surahList } from "@/data/surahList";
import { juzList } from "@/data/juzData";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import TajweedText from "@/components/TajweedText";
import SurahSelector from "./SurahSelector";
import ReadingSettings from "./ReadingSettings";
import AyahActions from "./AyahActions";
import MushafFrame, { SurahBanner } from "./MushafFrame";
import { useBookmark } from "@/hooks/useBookmark";

type ReadingMode = "verse" | "mushaf";

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
  const { saveLastRead, toggleFavorite, isFavorite } = useBookmark();
  const { t, language } = useLanguage();
  const [readingMode, setReadingMode] = useState<ReadingMode>(() => {
    try { return (localStorage.getItem("readingMode") as ReadingMode) || "verse"; } catch { return "verse"; }
  });
  const [tajweedEnabled, setTajweedEnabled] = useState(() => {
    try { return localStorage.getItem("tajweedEnabled") !== "false"; } catch { return true; }
  });
  const [arabicFontSize, setArabicFontSize] = useState(() => {
    try { return Number(localStorage.getItem("arabicFontSize")) || 22; } catch { return 22; }
  });
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Mushaf mode state
  const [pageIndex, setPageIndex] = useState(0);
  const [goToLastPage, setGoToLastPage] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const toggleReadingMode = () => {
    const next: ReadingMode = readingMode === "verse" ? "mushaf" : "verse";
    setReadingMode(next);
    try { localStorage.setItem("readingMode", next); } catch {}
  };

  const handleFontSizeChange = (n: number) => {
    setArabicFontSize(n);
    try { localStorage.setItem("arabicFontSize", String(n)); } catch {}
  };

  const handleTajweedToggle = () => {
    const next = !tajweedEnabled;
    setTajweedEnabled(next);
    try { localStorage.setItem("tajweedEnabled", String(next)); } catch {}
  };

  const { data, isLoading } = useSurahWithTranslations(selectedSurah);
  const surah = surahList.find(s => s.number === selectedSurah);

  // Mushaf pages grouping
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
    if (readingMode !== "mushaf" || totalPages === 0) return;
    if (goToLastPage) {
      setPageIndex(totalPages - 1);
      setGoToLastPage(false);
    } else {
      setPageIndex(prev => Math.min(prev, totalPages - 1));
    }
  }, [totalPages, goToLastPage, readingMode]);

  // Auto-save reading position
  useEffect(() => {
    if (data?.arabic.ayahs[0]) {
      saveLastRead(selectedSurah, 1, data.arabic.ayahs[0].page, "reading");
    }
  }, [selectedSurah, data, saveLastRead]);

  const handleSurahChange = (n: number) => {
    setSelectedSurah(n);
    setPageIndex(0);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const handlePlayAyah = useCallback((ayahNumber: number) => {
    if (playingAyah === ayahNumber) {
      audioRef.current?.pause();
      setPlayingAyah(null);
      return;
    }
    const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${data?.arabic.ayahs.find(a => a.numberInSurah === ayahNumber)?.number}.mp3`;
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.play();
    setPlayingAyah(ayahNumber);
    audio.onended = () => setPlayingAyah(null);
  }, [playingAyah, data]);

  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  // Mushaf swipe handlers
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

  const totalAyahs = data?.arabic.ayahs.length || 0;
  const currentJuz = data?.arabic.ayahs[0] ? getJuzNumber(selectedSurah, 1) : 1;

  // Mushaf current page data
  const currentPageData = pages[pageIndex];
  const realPageNum = currentPageData?.pageNum;
  const isFirstPageOfSurah = currentPageData?.ayahs.some(a => a.numberInSurah === 1);
  const mushafProgress = currentPageData
    ? Math.round((currentPageData.ayahs[currentPageData.ayahs.length - 1].numberInSurah / totalAyahs) * 100)
    : 0;

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className={`${readingMode === "mushaf" ? "bg-[#2D5016] dark:bg-[#1a3009]" : "bg-primary"} text-primary-foreground py-2.5 px-4 flex items-center justify-between shadow-md z-10`}>
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <SurahSelector value={selectedSurah} onChange={handleSurahChange} />
            <div className="flex items-center gap-2 text-[10px] opacity-70">
              <span>{t("পৃষ্ঠা", "Page", "صفحة")} {realPageNum || data?.arabic.ayahs[0]?.page || "—"}</span>
              <span>•</span>
              <span>{t("পারা", "Juz", "الجزء")} {currentJuz}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Mode toggle */}
          <button
            onClick={toggleReadingMode}
            className="p-2 rounded-lg hover:bg-white/15 transition-colors"
            title={readingMode === "verse"
              ? t("মুসহাফ মোড", "Mushaf Mode", "وضع المصحف")
              : t("আয়াত মোড", "Verse Mode", "وضع الآيات")
            }
          >
            {readingMode === "verse"
              ? <BookOpen className="w-4.5 h-4.5" />
              : <AlignJustify className="w-4.5 h-4.5" />
            }
          </button>
          <ReadingSettings
            fontSize={arabicFontSize}
            setFontSize={handleFontSizeChange}
            tajweedEnabled={tajweedEnabled}
            onTajweedToggle={handleTajweedToggle}
          />
        </div>
      </header>

      {/* Mushaf progress bar */}
      {readingMode === "mushaf" && (
        <div className="h-1 bg-[#1a3009]/50 dark:bg-[#0d1a05]">
          <div className="h-full bg-gradient-to-r from-[#7BAF4C] to-[#A3D977] transition-all duration-300 ease-out" style={{ width: `${mushafProgress}%` }} />
        </div>
      )}

      {/* Content */}
      {readingMode === "verse" ? (
        /* ===== VERSE-BY-VERSE MODE ===== */
        <div ref={scrollRef} className="flex-1 overflow-y-auto bg-background">
          {isLoading ? (
            <div className="space-y-4 p-6">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
            </div>
          ) : data && surah ? (
            <div className="max-w-3xl mx-auto">
              {/* Surah Header */}
              <div className="py-8 px-6 text-center space-y-3">
                <div className="inline-block bg-primary/5 dark:bg-primary/10 rounded-2xl px-8 py-6 w-full">
                  <h1 className="font-arabic text-3xl md:text-4xl text-primary font-bold leading-relaxed">
                    سُورَةُ {surah.name}
                  </h1>
                  <p className="text-foreground font-semibold text-base mt-2">
                    {surah.number}. {surah.englishName}
                  </p>
                  <p className="text-muted-foreground text-sm">
                    {language === "bn" ? surah.bengaliName : surah.englishNameTranslation}
                  </p>
                  <div className="flex items-center justify-center gap-3 mt-3 text-xs text-muted-foreground">
                    <span className={`px-2.5 py-1 rounded-full font-medium ${
                      surah.revelationType === "Meccan" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"
                    }`}>
                      {surah.revelationType === "Meccan" ? t("মক্কী", "Meccan", "مكية") : t("মাদানী", "Medinan", "مدنية")}
                    </span>
                    <span>{totalAyahs} {t("আয়াত", "Ayahs", "آيات")}</span>
                  </div>
                </div>

                {selectedSurah !== 9 && selectedSurah !== 1 && (
                  <div className="py-4">
                    <p className="font-arabic text-2xl md:text-3xl text-primary/80 leading-relaxed font-bold">
                      بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      {t("পরম করুণাময়, অতি দয়ালু আল্লাহর নামে", "In the name of Allah, the Most Gracious, the Most Merciful", "بسم الله الرحمن الرحيم")}
                    </p>
                  </div>
                )}
              </div>

              {/* Ayah list */}
              <div className="divide-y divide-border">
                {data.arabic.ayahs.map((ayah, idx) => {
                  const bengaliAyah = data.bengali.ayahs[idx];
                  const isPlaying = playingAyah === ayah.numberInSurah;
                  const favorited = isFavorite(selectedSurah, ayah.numberInSurah);
                  return (
                    <div key={ayah.number} className="group hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between px-4 md:px-6 pt-3 pb-1">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {selectedSurah}:{ayah.numberInSurah}
                          </span>
                          <button onClick={() => handlePlayAyah(ayah.numberInSurah)} className="p-1.5 rounded-full hover:bg-primary/10 transition-colors">
                            {isPlaying ? <Pause className="w-4 h-4 text-primary" /> : <Play className="w-4 h-4 text-muted-foreground" />}
                          </button>
                          <button onClick={() => toggleFavorite(selectedSurah, ayah.numberInSurah)} className="p-1.5 rounded-full hover:bg-primary/10 transition-colors">
                            {favorited ? <BookmarkCheck className="w-4 h-4 text-accent" /> : <Bookmark className="w-4 h-4 text-muted-foreground" />}
                          </button>
                        </div>
                        <AyahActions arabicText={ayah.text} translation={bengaliAyah?.text} surahName={surah.name} surahNumber={selectedSurah} ayahNumber={ayah.numberInSurah} />
                      </div>
                      <div className="px-4 md:px-6 py-3" dir="rtl">
                        <p className="font-arabic text-foreground leading-[2.4] text-right" style={{ fontSize: `${arabicFontSize}px` }}>
                          {tajweedEnabled ? <TajweedText text={ayah.text} enabled={true} className="inline" /> : <span>{ayah.text}</span>}
                          <span className="inline-flex items-center justify-center mx-1 text-primary font-bold align-middle" style={{ fontSize: `${Math.max(12, arabicFontSize - 6)}px`, fontFamily: 'serif' }}>
                            ﴿{toArabicNum(ayah.numberInSurah)}﴾
                          </span>
                        </p>
                      </div>
                      {bengaliAyah && (
                        <div className="px-4 md:px-6 pb-4">
                          <p className="text-muted-foreground text-sm leading-relaxed">{bengaliAyah.text}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Surah navigation */}
              <div className="flex items-center justify-between px-4 py-6">
                {selectedSurah > 1 ? (
                  <button onClick={() => handleSurahChange(selectedSurah - 1)} className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                    ← {surahList.find(s => s.number === selectedSurah - 1)?.englishName}
                  </button>
                ) : <div />}
                {selectedSurah < 114 ? (
                  <button onClick={() => handleSurahChange(selectedSurah + 1)} className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors">
                    {surahList.find(s => s.number === selectedSurah + 1)?.englishName} →
                  </button>
                ) : <div />}
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        /* ===== MUSHAF (FLOWING TEXT) MODE ===== */
        <div className="flex-1 overflow-hidden flex flex-col px-1 py-1 bg-[#F5EFE0] dark:bg-[#1a1510]">
          {isLoading ? (
            <div className="space-y-3 p-4 flex-1">
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
                <MushafFrame className="flex-1">
                  {/* Top info bar */}
                  <div className="flex items-center justify-between px-4 py-1.5 text-[11px]" dir="rtl">
                    <span className="font-arabic text-[#5C4A2A] dark:text-[#C4A96A] font-semibold">{getJuzName(currentJuz)}</span>
                    <span className="text-[#8B7355] dark:text-[#9B8365] tabular-nums">{realPageNum ? toArabicNum(realPageNum) : toArabicNum(pageIndex + 1)}</span>
                    <span className="font-arabic text-[#5C4A2A] dark:text-[#C4A96A] font-semibold">{surah?.name}</span>
                  </div>

                  <div className="mx-3 border-b border-[#8B7355]/15 dark:border-[#C4A96A]/15" />

                  {isFirstPageOfSurah && (
                    <SurahBanner>
                      <p className="font-arabic text-[18px] md:text-[22px] font-bold text-[#2D5016] dark:text-[#C4A96A]">
                        سُورَةُ {surah?.name}
                      </p>
                    </SurahBanner>
                  )}

                  {isFirstPageOfSurah && selectedSurah !== 9 && (
                    <div className="py-1 text-center">
                      <p className="font-arabic font-bold text-[#1a1008] dark:text-[#E8DCC8]" style={{ fontSize: `${Math.max(arabicFontSize - 2, 18)}px` }}>
                        بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                      </p>
                      <div className="flex items-center justify-center gap-2 mt-0.5 px-8">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8B7355]/25 to-transparent dark:via-[#C4A96A]/20" />
                        <svg viewBox="0 0 12 12" className="w-2 h-2 text-[#8B7355]/30 dark:text-[#C4A96A]/25" fill="currentColor">
                          <rect x="3" y="3" width="6" height="6" transform="rotate(45, 6, 6)" />
                        </svg>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-[#8B7355]/25 to-transparent dark:via-[#C4A96A]/20" />
                      </div>
                    </div>
                  )}

                  <div className="px-5 md:px-7 py-1 flex-1 overflow-hidden" dir="rtl">
                    <p className="font-arabic font-bold text-[#1a1008] dark:text-[#E8DCC8] text-justify leading-[2.2] sm:leading-[2.4] md:leading-[2.6]"
                       style={{ fontSize: `${arabicFontSize}px`, wordSpacing: '0.12em', letterSpacing: '0.01em' }}>
                      {currentPageData.ayahs.map((ayah) => {
                        let displayText = ayah.text;
                        if (isFirstPageOfSurah && ayah.numberInSurah === 1 && selectedSurah !== 9) {
                          displayText = stripBismillah(displayText);
                        }
                        if (!displayText && ayah.numberInSurah === 1) return null;
                        return (
                          <span key={ayah.number}>
                            {tajweedEnabled ? <TajweedText text={displayText} enabled={true} className="inline" /> : <span>{displayText}</span>}
                            <span className="inline-flex items-center justify-center mx-0.5 text-[#2D5016] dark:text-[#7BAF4C] font-bold select-none align-middle"
                                  style={{ fontSize: `${Math.max(11, arabicFontSize - 7)}px`, fontFamily: 'serif' }}>
                              ﴿{toArabicNum(ayah.numberInSurah)}﴾
                            </span>{' '}
                          </span>
                        );
                      })}
                    </p>
                  </div>

                  <div className="mt-auto">
                    <div className="mx-3 border-t border-[#8B7355]/15 dark:border-[#C4A96A]/15" />
                    <div className="text-center py-1 flex items-center justify-center gap-2">
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
        </div>
      )}
    </div>
  );
}
