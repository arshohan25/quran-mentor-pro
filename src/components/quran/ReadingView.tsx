import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, X, Loader2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuranPage, type MushafLine } from "@/hooks/useQuranPage";
import { surahList } from "@/data/surahList";
import { SURAH_START_PAGES, surahForPage } from "@/data/mushafPages";
import ReadingSettings from "@/components/quran/ReadingSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import type { QuranSectionProps } from "@/components/quran/types";
import { AnimatePresence, motion } from "framer-motion";

function toArabicNum(n: number): string {
  return n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d, 10)]);
}

function getJuzForPage(page: number): number {
  const juzPages = [1, 22, 42, 62, 82, 102, 121, 142, 162, 182, 201, 222, 242, 262, 282, 302, 322, 342, 362, 382, 402, 422, 442, 462, 482, 502, 522, 542, 562, 582, 591, 604];
  for (let i = juzPages.length - 1; i >= 0; i--) {
    if (page >= juzPages[i]) return i + 1;
  }
  return 1;
}

interface MushafDisplayLine {
  lineNumber: number;
  surahNumber?: number;
  words: MushafLine["words"];
}

function buildMushafDisplayLines(lines: MushafLine[]): MushafDisplayLine[] {
  const startedSurahs = new Set<number>();

  return lines.map((line) => {
    const surahStartWord = line.words.find(
      (word) => word.verse_number === 1 && !startedSurahs.has(word.chapter_id)
    );

    if (surahStartWord) startedSurahs.add(surahStartWord.chapter_id);

    return {
      lineNumber: line.line_number,
      surahNumber: surahStartWord?.chapter_id,
      words: line.words,
    };
  });
}

const TEAL = "#2CA4AB";
const DARK_BG = "#1B1F27";
const DARK_HEADER = "#1F2937";
const DARK_CONTENT = "#1B1F27";
const DARK_BORDER = "#2D3748";
const TEXT_WHITE = "#FFFFFF";
const TEXT_DIM = "#8B9DB5";
const TEXT_MUTED = "#5C7080";
const QURAN_COM_FONT_SIZE = 22;
const QURAN_COM_LINE_HEIGHT = 2.05;

export default function ReadingView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t, language } = useLanguage();

  const [mushafPage, setMushafPage] = useState(() => SURAH_START_PAGES[selectedSurah] || 1);
  const [pageInput, setPageInput] = useState("");
  const [showPageInput, setShowPageInput] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [selectedVerse, setSelectedVerse] = useState<{ surah: number; ayah: number; text: string } | null>(null);
  const [translation, setTranslation] = useState<{ bn?: string; en?: string } | null>(null);
  const [translationLoading, setTranslationLoading] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Swipe gesture handling
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;

    // Only trigger if horizontal swipe is dominant and > 60px
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
      if (dx > 0 && mushafPage < 604) {
        // Swipe right → next page (RTL: right = forward in Mushaf)
        setMushafPage((p) => p + 1);
      } else if (dx < 0 && mushafPage > 1) {
        // Swipe left → previous page
        setMushafPage((p) => p - 1);
      }
    }
  }, [mushafPage]);

  const handleVerseClick = useCallback(async (surah: number, ayah: number, arabicText: string) => {
    if (selectedVerse?.surah === surah && selectedVerse?.ayah === ayah) {
      setSelectedVerse(null);
      return;
    }
    setSelectedVerse({ surah, ayah, text: arabicText });
    setTranslation(null);
    setTranslationLoading(true);
    try {
      const [bnRes, enRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/bn.bengali`).then(r => r.json()),
        fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/en.asad`).then(r => r.json()),
      ]);
      setTranslation({
        bn: bnRes?.data?.text,
        en: enRes?.data?.text,
      });
    } catch {
      setTranslation({ en: "Translation unavailable" });
    } finally {
      setTranslationLoading(false);
    }
  }, [selectedVerse]);

  const { data, isLoading, error } = useQuranPage(mushafPage);

  useEffect(() => {
    const surah = surahForPage(mushafPage);
    if (surah !== selectedSurah) setSelectedSurah(surah);
  }, [mushafPage, selectedSurah, setSelectedSurah]);

  const prevSurahRef = useRef(selectedSurah);
  useEffect(() => {
    if (selectedSurah !== prevSurahRef.current) {
      prevSurahRef.current = selectedSurah;
      setMushafPage(SURAH_START_PAGES[selectedSurah] || 1);
    }
  }, [selectedSurah]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
    setScrolled(false);
  }, [mushafPage]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const onScroll = () => setScrolled(el.scrollTop > 80);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const currentJuz = getJuzForPage(mushafPage);
  const currentHizb = Math.ceil(currentJuz * 2 - 1);
  const currentSurahNum = surahForPage(mushafPage);
  const currentSurahInfo = surahList.find((surah) => surah.number === currentSurahNum);

  const goNext = () => {
    if (mushafPage < 604) setMushafPage((page) => page + 1);
  };

  const goPrev = () => {
    if (mushafPage > 1) setMushafPage((page) => page - 1);
  };

  const handlePageJump = () => {
    const nextPage = parseInt(pageInput, 10);
    if (nextPage >= 1 && nextPage <= 604) {
      setMushafPage(nextPage);
      setShowPageInput(false);
      setPageInput("");
    }
  };

  const mushafDisplayLines = useMemo(
    () => buildMushafDisplayLines(data?.lines ?? []),
    [data?.lines]
  );

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: DARK_BG }}>
        <div className="text-center space-y-3">
          <p className="text-lg" style={{ color: "#E85D5D" }}>
            ⚠️ {t("লোড করা যায়নি", "Failed to load", "فشل التحميل")}
          </p>
          <button onClick={onBack} className="text-sm underline" style={{ color: TEXT_DIM }}>
            {t("ফিরে যান", "Go back", "عودة")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: DARK_BG }}>
      <header className="sticky top-0 z-50" style={{ background: DARK_HEADER }}>
        <div className="flex items-center justify-between px-2 sm:px-3 py-2" style={{ borderBottom: `1px solid ${DARK_BORDER}` }}>
          <div className="flex items-center gap-1.5 min-w-0">
            <button onClick={onBack} className="p-1 shrink-0" style={{ color: TEXT_DIM }}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-1 text-sm font-medium truncate min-w-0" style={{ color: TEXT_WHITE }}>
              {currentSurahInfo ? `${currentSurahInfo.number}. ${currentSurahInfo.englishName}` : ""}
              <ChevronDown className="w-3 h-3 shrink-0" style={{ color: TEXT_DIM }} />
            </button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {scrolled && (
              <span className="text-[10px] sm:text-xs hidden xs:inline" style={{ color: TEXT_DIM }}>
                Juz {currentJuz}
              </span>
            )}
            <ReadingSettings fontSize={QURAN_COM_FONT_SIZE} hideFontSize />
          </div>
        </div>

        {!scrolled && (
          <>
            <div className="flex items-center justify-between px-2 sm:px-4" style={{ borderBottom: `1px solid ${DARK_BORDER}` }}>
              <div className="flex items-center">
                <button className="px-2.5 sm:px-3 py-2.5 text-xs font-medium" style={{ color: TEXT_DIM }} onClick={onBack}>
                  Verse by Verse
                </button>
                <button className="px-2.5 sm:px-3 py-2.5 text-xs font-medium relative" style={{ color: TEAL }}>
                  Reading
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: TEAL }} />
                </button>
              </div>
              <span className="font-arabic text-sm sm:text-base truncate max-w-[40%]" dir="rtl" style={{ color: TEXT_WHITE, fontFamily: "'UthmanicHafs', 'Amiri', serif" }}>
                {currentSurahInfo?.name}
              </span>
            </div>

            <div
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-2"
              style={{ background: DARK_CONTENT, borderBottom: `1px solid ${DARK_BORDER}` }}
            >
              <button
                className="flex items-center gap-1 text-[11px] sm:text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full"
                style={{ color: TEAL, border: `1px solid ${DARK_BORDER}` }}
              >
                ▶ Listen
              </button>
              <button
                className="text-[11px] sm:text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full"
                style={{ color: TEXT_WHITE, border: `1.5px solid ${TEXT_WHITE}`, background: "transparent" }}
              >
                Arabic
              </button>
              <button
                className="text-[11px] sm:text-xs font-medium px-2.5 sm:px-3 py-1.5 rounded-full"
                style={{ color: TEXT_DIM, border: `1px solid ${DARK_BORDER}` }}
              >
                Translation
              </button>
            </div>
          </>
        )}

        {scrolled && (
          <div
            className="flex items-center justify-between px-2 sm:px-3 py-1.5"
            style={{ background: DARK_CONTENT, borderBottom: `1px solid ${DARK_BORDER}` }}
          >
            <button className="flex items-center gap-1 text-xs font-medium truncate" style={{ color: TEXT_WHITE }}>
              {currentSurahInfo?.number}. {currentSurahInfo?.englishName}
              <ChevronDown className="w-3 h-3 shrink-0" style={{ color: TEXT_DIM }} />
            </button>
            <span className="text-[10px] shrink-0" style={{ color: TEXT_DIM }}>
              Page {mushafPage} · Juz {currentJuz}
            </span>
          </div>
        )}
      </header>

      <div
        ref={contentRef}
        className="flex-1 overflow-y-auto"
        style={{ background: DARK_CONTENT }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {isLoading ? (
          <div className="max-w-2xl mx-auto p-6 space-y-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" style={{ background: DARK_BORDER }} />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-1.5 sm:px-2.5 pt-2 pb-3">
            <div className="space-y-0.5">
              {mushafDisplayLines.map((line) => {
                const surahInfo = line.surahNumber
                  ? surahList.find((surah) => surah.number === line.surahNumber)
                  : undefined;

                return (
                  <div key={`line-${line.lineNumber}`}>
                    {surahInfo && (
                      <div className="text-center my-5">
                        <div className="flex items-center justify-center gap-4 mb-2">
                          <span
                            dir="rtl"
                            style={{
                              fontFamily: "'UthmanicHafs', 'Amiri', serif",
                              fontSize: "36px",
                              color: TEXT_WHITE,
                              fontWeight: 400,
                            }}
                          >
                            {surahInfo.name}
                          </span>
                          <div className="text-left">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold" style={{ color: TEXT_WHITE }}>
                                {surahInfo.number}. {surahInfo.englishName}
                              </span>
                              <span
                                className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide"
                                style={{ background: TEAL, color: "#fff" }}
                              >
                                info
                              </span>
                            </div>
                            <p className="text-xs mt-0.5" style={{ color: TEXT_DIM }}>
                              {surahInfo.englishNameTranslation}
                            </p>
                          </div>
                        </div>

                        {line.surahNumber !== 9 && line.surahNumber !== 1 && (
                          <div className="mt-4 mb-3">
                            <p
                              dir="rtl"
                              style={{
                                fontFamily: "'UthmanicHafs', 'Amiri', serif",
                                fontSize: "22px",
                                color: TEXT_DIM,
                                lineHeight: "2",
                              }}
                            >
                              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                            </p>
                            <p className="text-[11px] mt-1" style={{ color: TEXT_MUTED }}>
                              In the Name of Allah—the Most Compassionate, Most Merciful
                            </p>
                          </div>
                        )}
                      </div>
                    )}

                    <div
                      className="w-full flex items-center justify-between"
                      dir="rtl"
                      style={{
                        fontFamily: "'UthmanicHafs', 'Amiri', serif",
                        fontSize: `${QURAN_COM_FONT_SIZE}px`,
                        color: TEXT_WHITE,
                        lineHeight: QURAN_COM_LINE_HEIGHT,
                        letterSpacing: "0px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {line.words.map((word, wordIndex) => (
                        <span
                          key={`${word.verse_key}-${word.position}-${wordIndex}`}
                          className="inline-flex items-center shrink-0"
                          style={{
                            cursor: word.isEndOfVerse ? "pointer" : undefined,
                            background: selectedVerse?.surah === word.chapter_id && selectedVerse?.ayah === word.verse_number
                              ? `${TEAL}22` : undefined,
                            borderRadius: "4px",
                          }}
                          onClick={word.isEndOfVerse ? () => handleVerseClick(word.chapter_id, word.verse_number, word.text_uthmani) : undefined}
                        >
                          <span>{word.text_uthmani}</span>
                          {word.isEndOfVerse && (
                            <span
                              className="inline-flex items-center justify-center select-none align-middle mx-0.5"
                              style={{
                                width: `${Math.max(18, QURAN_COM_FONT_SIZE * 0.9)}px`,
                                height: `${Math.max(18, QURAN_COM_FONT_SIZE * 0.9)}px`,
                                borderRadius: "50%",
                                border: `1.25px solid ${TEAL}`,
                                color: TEAL,
                                fontSize: `${Math.max(9, QURAN_COM_FONT_SIZE * 0.42)}px`,
                                fontFamily: "sans-serif",
                                fontWeight: 600,
                                lineHeight: 1,
                              }}
                            >
                              {toArabicNum(word.verse_number)}
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="text-center mt-8 mb-3">
              <span className="text-sm font-medium" style={{ color: TEXT_MUTED }}>
                {mushafPage}
              </span>
            </div>

            <div className="flex items-center justify-center gap-8 py-4" style={{ borderTop: `1px solid ${DARK_BORDER}` }}>
              {mushafPage > 1 && (
                <button onClick={goPrev} className="text-xs font-medium" style={{ color: TEXT_DIM }}>
                  {t("আগের পৃষ্ঠা", "Previous Page", "الصفحة السابقة")}
                </button>
              )}
              {mushafPage < 604 && (
                <button onClick={goNext} className="text-xs font-medium" style={{ color: TEAL }}>
                  {t("পরবর্তী পৃষ্ঠা", "Continue Reading", "متابعة القراءة")}
                </button>
              )}
            </div>

            <div className="flex items-center justify-center py-3">
              {showPageInput ? (
                <form onSubmit={(e) => { e.preventDefault(); handlePageJump(); }} className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={604}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    placeholder="1-604"
                    className="w-20 h-8 text-xs text-center border-none"
                    style={{ background: DARK_HEADER, color: TEXT_WHITE }}
                    autoFocus
                    onBlur={() => {
                      if (!pageInput) setShowPageInput(false);
                    }}
                  />
                  <button type="submit" className="text-xs px-3 py-1.5 rounded-md font-medium" style={{ background: TEAL, color: "#fff" }}>
                    Go
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowPageInput(true)}
                  className="text-[11px] px-4 py-1.5 rounded-full"
                  style={{ color: TEXT_MUTED, border: `1px solid ${DARK_BORDER}` }}
                >
                  {t(`পৃষ্ঠা ${mushafPage} / ৬০৪`, `Page ${mushafPage} of 604`, `صفحة ${toArabicNum(mushafPage)} من ٦٠٤`)}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
