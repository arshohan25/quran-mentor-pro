import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mic, MicOff, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Sparkles, Eye, Volume2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuranPage } from "@/hooks/useQuranPage";
import { useArabicRecitationEngine } from "@/hooks/useArabicRecitationEngine";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { surahList } from "@/data/surahList";
import { SURAH_START_PAGES, surahForPage } from "@/data/mushafPages";
import type { MatchMode } from "@/utils/arabicUtils";

// Play word audio from quran.com CDN
function usePageWordAudio(flatWords: any[], errorIndex: number | null) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());
  const lastPlayedRef = useRef<string>("");

  const playErrorWord = useCallback(() => {
    if (errorIndex === null || !flatWords[errorIndex]) return;
    const word = flatWords[errorIndex];
    const verseKey = word.verse_key;
    const position = word.position;
    const cacheKey = `${verseKey}:${position}`;

    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }

    const doPlay = (url: string) => {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.play().catch(() => {});
    };

    if (cacheRef.current.has(cacheKey)) {
      doPlay(cacheRef.current.get(cacheKey)!);
      return;
    }

    fetch(`https://api.quran.com/api/v4/verses/by_key/${verseKey}?language=ar&words=true&word_fields=audio_url`)
      .then(r => r.json())
      .then(data => {
        const words = data?.verse?.words || [];
        words.filter((w: any) => w.char_type_name === "word").forEach((w: any) => {
          const url = w.audio_url?.startsWith("http") ? w.audio_url : w.audio_url ? `https://audio.qurancdn.com/${w.audio_url}` : null;
          if (url) cacheRef.current.set(`${verseKey}:${w.position}`, url);
        });
        const audioUrl = cacheRef.current.get(cacheKey);
        if (audioUrl) doPlay(audioUrl);
      })
      .catch(() => {});
  }, [flatWords, errorIndex]);

  // Auto-play on error
  useEffect(() => {
    if (errorIndex === null) return;
    const key = `${errorIndex}`;
    if (lastPlayedRef.current === key) return;
    lastPlayedRef.current = key;
    const t = setTimeout(playErrorWord, 350);
    return () => clearTimeout(t);
  }, [errorIndex, playErrorWord]);

  // Cleanup
  useEffect(() => () => { if (audioRef.current) audioRef.current.pause(); }, []);

  return { playErrorWord };
}

function toArabicNum(n: number): string {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
}

export default function SabinaPage() {
  const { t, language } = useLanguage();
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [sensitivityMode, setSensitivityMode] = useState<MatchMode>("balanced");
  const [showHint, setShowHint] = useState(false);
  const [completedPages, setCompletedPages] = useState(0);
  const activeLineRef = useRef<HTMLDivElement>(null);

  const { data: pageData, isLoading } = useQuranPage(currentPage);

  // Build flat word list from page lines
  const flatWords = useMemo(() => {
    if (!pageData?.lines) return [];
    return pageData.lines.flatMap((line) => line.words);
  }, [pageData]);

  const pageText = useMemo(() => {
    return flatWords.map((w) => w.text_uthmani).join(" ");
  }, [flatWords]);

  // Word index boundaries per line for rendering
  const lineWordRanges = useMemo(() => {
    if (!pageData?.lines) return [];
    let offset = 0;
    return pageData.lines.map((line) => {
      const start = offset;
      offset += line.words.length;
      return { line_number: line.line_number, start, end: offset, words: line.words };
    });
  }, [pageData]);

  const handlePageComplete = useCallback(() => {
    setCompletedPages((c) => c + 1);
    setShowHint(false);
    // Auto-advance to next page, mic stays alive via keepAliveRef
    if (currentPage < 604) {
      setTimeout(() => setCurrentPage((p) => p + 1), 600);
    }
  }, [currentPage]);

  const { state, toggleListening, stopListening } = useArabicRecitationEngine(
    pageText,
    sensitivityMode,
    handlePageComplete
  );

  const { words, revealedIndex, errorIndex, isListening, lastSpoken, speechError, totalWords } = state;
  const progressPercent = totalWords > 0 ? (revealedIndex / totalWords) * 100 : 0;

  // When surah changes, jump to its start page
  useEffect(() => {
    const startPage = SURAH_START_PAGES[selectedSurah] ?? 1;
    setCurrentPage(startPage);
    setCompletedPages(0);
  }, [selectedSurah]);

  // Sync selectedSurah display when page changes
  useEffect(() => {
    const surah = surahForPage(currentPage);
    if (surah !== selectedSurah) {
      setSelectedSurah(surah);
    }
  }, [currentPage]);

  // Auto-scroll to current word's line
  useEffect(() => {
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [revealedIndex]);

  const handleHint = () => {
    setShowHint(true);
    setTimeout(() => setShowHint(false), 2500);
  };

  const goNext = () => { if (currentPage < 604) setCurrentPage((p) => p + 1); };
  const goPrev = () => { if (currentPage > 1) setCurrentPage((p) => p - 1); };

  // Find which line the current word is on
  const currentLineNumber = useMemo(() => {
    for (const range of lineWordRanges) {
      if (revealedIndex >= range.start && revealedIndex < range.end) {
        return range.line_number;
      }
    }
    return lineWordRanges[lineWordRanges.length - 1]?.line_number ?? 1;
  }, [revealedIndex, lineWordRanges]);

  const currentSurahInfo = surahList.find((s) => s.number === selectedSurah);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/20 to-background px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-2">
          <Link to="/" className="p-2 rounded-full hover:bg-primary/10 transition">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-bold text-foreground font-arabic">
              {t("সবিনা", "Sabina", "سبينا")}
            </h1>
          </div>
          <div className="w-9" />
        </div>

        {/* Controls Row */}
        <div className="flex gap-2 mb-2">
          <Select value={String(selectedSurah)} onValueChange={(v) => setSelectedSurah(Number(v))}>
            <SelectTrigger className="flex-1 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {surahList.map((s) => (
                <SelectItem key={s.number} value={String(s.number)} className="text-xs">
                  {s.number}. {language === "bn" ? s.bengaliName : language === "ar" ? s.name : s.englishName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sensitivityMode} onValueChange={(v) => setSensitivityMode(v as MatchMode)}>
            <SelectTrigger className="w-24 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strict" className="text-xs">{t("কঠিন", "Strict", "صارم")}</SelectItem>
              <SelectItem value="balanced" className="text-xs">{t("মাঝারি", "Balanced", "متوازن")}</SelectItem>
              <SelectItem value="assist" className="text-xs">{t("সহজ", "Assist", "مساعد")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page Nav */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentPage <= 1} onClick={goPrev}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-xs text-muted-foreground">
            {t("পৃষ্ঠা", "Page", "صفحة")} {toArabicNum(currentPage)} / ٦٠٤
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" disabled={currentPage >= 604} onClick={goNext}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Mushaf Page Area */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {isLoading ? (
          <div className="space-y-3 p-4">
            {Array.from({ length: 15 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" />
            ))}
          </div>
        ) : (
          <div className="bg-card border border-border rounded-xl p-3 min-h-[400px]">
            {/* Surah header if page starts a surah */}
            {pageData?.verses?.[0]?.verse_number === 1 && currentSurahInfo && (
              <div className="text-center mb-3 pb-2 border-b border-border">
                <h2 className="font-arabic text-xl text-primary">{currentSurahInfo.name}</h2>
                {selectedSurah !== 1 && selectedSurah !== 9 && (
                  <p className="font-arabic text-sm text-muted-foreground mt-1">بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ</p>
                )}
              </div>
            )}

            {/* 15 Lines */}
            <div className="space-y-1" dir="rtl">
              {lineWordRanges.map((range) => {
                const isActiveLine = currentLineNumber === range.line_number;
                return (
                  <div
                    key={range.line_number}
                    ref={isActiveLine ? activeLineRef : undefined}
                    className={`flex flex-wrap justify-center gap-x-1.5 gap-y-0.5 py-1 rounded-lg transition-colors ${
                      isActiveLine ? "bg-primary/5" : ""
                    }`}
                  >
                    {range.words.map((word, wi) => {
                      const globalIndex = range.start + wi;
                      const isRevealed = globalIndex < revealedIndex;
                      const isCurrent = globalIndex === revealedIndex;
                      const isError = errorIndex === globalIndex;
                      const isHinted = isCurrent && showHint;

                      if (isRevealed) {
                        return (
                          <span
                            key={`${range.line_number}-${wi}`}
                            className="font-arabic text-lg sm:text-xl text-primary transition-all duration-300"
                          >
                            {word.text_uthmani}
                            {word.isEndOfVerse && (
                              <span className="text-muted-foreground/50 text-sm mx-0.5">
                                ﴿{toArabicNum(word.verse_number)}﴾
                              </span>
                            )}
                          </span>
                        );
                      }

                      if (isError) {
                        return (
                          <span
                            key={`${range.line_number}-${wi}`}
                            className="font-arabic text-lg sm:text-xl text-destructive bg-destructive/15 animate-pulse rounded px-0.5"
                          >
                            {word.text_uthmani}
                          </span>
                        );
                      }

                      if (isHinted) {
                        return (
                          <span
                            key={`${range.line_number}-${wi}`}
                            className="font-arabic text-lg sm:text-xl text-accent-foreground bg-accent/30 rounded border border-accent/50"
                          >
                            {word.text_uthmani}
                          </span>
                        );
                      }

                      if (isCurrent) {
                        return (
                          <span
                            key={`${range.line_number}-${wi}`}
                            className="font-arabic text-lg sm:text-xl text-muted-foreground/40 border-b-2 border-primary/50"
                          >
                            ﴿؟﴾
                          </span>
                        );
                      }

                      // Hidden — dot placeholder
                      return (
                        <span
                          key={`${range.line_number}-${wi}`}
                          className="text-muted-foreground/20 text-sm select-none"
                        >
                          •
                        </span>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="mt-3 px-2 space-y-1">
          <Progress value={progressPercent} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{revealedIndex}/{totalWords} {t("শব্দ", "words", "كلمات")}</span>
            <span>{completedPages} {t("পৃষ্ঠা সম্পন্ন", "pages done", "صفحات مكتملة")}</span>
          </div>
        </div>

        {/* Error / Status */}
        <div className="px-2 mt-2 space-y-2">
          {errorIndex !== null && (
            <div className="flex items-center gap-2 justify-center text-destructive bg-destructive/10 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <p className="text-xs font-medium">
                {t("ভুল হয়েছে!", "Wrong word!", "خطأ!")}
              </p>
              <Volume2 className="w-4 h-4 cursor-pointer hover:opacity-70" />
            </div>
          )}

          {revealedIndex > 0 && revealedIndex === totalWords && totalWords > 0 && (
            <div className="flex items-center gap-2 justify-center text-primary bg-primary/10 rounded-lg px-3 py-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <p className="text-xs font-medium">
                {t("পৃষ্ঠা সম্পন্ন! পরবর্তী পৃষ্ঠায় যাচ্ছে...", "Page complete! Moving to next...", "اكتملت الصفحة!")}
              </p>
            </div>
          )}

          {speechError && (
            <p className="text-center text-xs text-muted-foreground">{speechError}</p>
          )}

          {lastSpoken && isListening && (
            <p className="text-center text-xs text-muted-foreground/60 truncate" dir="rtl">🎤 {lastSpoken}</p>
          )}
        </div>
      </div>

      {/* Bottom Controls — Hint + Mic */}
      <div className="sticky bottom-0 bg-background/95 backdrop-blur border-t border-border px-4 py-3 pb-20 flex items-center justify-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={handleHint}
          disabled={revealedIndex >= totalWords || showHint || isLoading}
          className="gap-1.5"
        >
          <Eye className="w-4 h-4" />
          {t("হিন্ট", "Hint", "تلميح")}
        </Button>

        <button
          onClick={toggleListening}
          disabled={isLoading || !pageText}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isListening
              ? "bg-destructive text-destructive-foreground animate-pulse scale-110"
              : "bg-primary text-primary-foreground hover:scale-105"
          } disabled:opacity-40 disabled:scale-100`}
        >
          {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
        </button>
      </div>
    </div>
  );
}
