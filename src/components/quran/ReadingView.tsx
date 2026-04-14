import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuranPage } from "@/hooks/useQuranPage";
import { surahList } from "@/data/surahList";
import { SURAH_START_PAGES, surahForPage } from "@/data/mushafPages";
import { juzList } from "@/data/juzData";
import ReadingSettings from "@/components/quran/ReadingSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import type { QuranSectionProps } from "@/components/quran/types";

function toArabicNum(n: number): string {
  return n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
}

function getJuzForPage(page: number): number {
  // Juz boundaries in terms of pages (standard Madinah Mushaf)
  const juzPages = [1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582,591,604];
  for (let i = juzPages.length - 1; i >= 0; i--) {
    if (page >= juzPages[i]) return i + 1;
  }
  return 1;
}

/** Group verses on a page by their surah (chapter_id) */
function groupBySurah(verses: { chapter_id: number; verse_number: number; text_uthmani: string; verse_key: string }[]) {
  const groups: { surahNumber: number; verses: typeof verses }[] = [];
  for (const v of verses) {
    const last = groups[groups.length - 1];
    if (last && last.surahNumber === v.chapter_id) {
      last.verses.push(v);
    } else {
      groups.push({ surahNumber: v.chapter_id, verses: [v] });
    }
  }
  return groups;
}

export default function ReadingView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t } = useLanguage();

  // Current Mushaf page (1-604)
  const [mushafPage, setMushafPage] = useState(() => {
    return SURAH_START_PAGES[selectedSurah] || 1;
  });

  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("mushaf-font-size");
    return saved ? Number(saved) : 28;
  });
  const [pageInput, setPageInput] = useState("");
  const [showPageInput, setShowPageInput] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuranPage(mushafPage);

  // Sync selectedSurah when page changes
  useEffect(() => {
    const s = surahForPage(mushafPage);
    if (s !== selectedSurah) setSelectedSurah(s);
  }, [mushafPage]);

  // When selectedSurah changes externally, jump to that surah's start page
  const prevSurahRef = useRef(selectedSurah);
  useEffect(() => {
    if (selectedSurah !== prevSurahRef.current) {
      prevSurahRef.current = selectedSurah;
      const startPage = SURAH_START_PAGES[selectedSurah] || 1;
      setMushafPage(startPage);
    }
  }, [selectedSurah]);

  useEffect(() => {
    localStorage.setItem("mushaf-font-size", String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [mushafPage]);

  const currentJuz = getJuzForPage(mushafPage);
  const currentSurahNum = surahForPage(mushafPage);
  const currentSurahInfo = surahList.find((s) => s.number === currentSurahNum);

  const goNext = () => {
    if (mushafPage < 604) setMushafPage(mushafPage + 1);
  };
  const goPrev = () => {
    if (mushafPage > 1) setMushafPage(mushafPage - 1);
  };

  const handlePageJump = () => {
    const p = parseInt(pageInput);
    if (p >= 1 && p <= 604) {
      setMushafPage(p);
      setShowPageInput(false);
      setPageInput("");
    }
  };

  const groups = data ? groupBySurah(data.verses) : [];

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "hsl(39 30% 95%)" }}>
        <div className="text-center space-y-3">
          <p className="text-destructive text-lg">⚠️ {t("লোড করা যায়নি", "Failed to load", "فشل التحميل")}</p>
          <button onClick={onBack} className="text-sm text-muted-foreground underline">
            {t("ফিরে যান", "Go back", "عودة")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "hsl(39 30% 95%)" }}>
      {/* Top bar — quran.com inspired */}
      <header className="sticky top-0 z-50 border-b" style={{
        background: "hsl(39 25% 97%)",
        borderColor: "hsl(35 20% 85%)"
      }}>
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
              <ArrowLeft className="w-5 h-5" style={{ color: "hsl(35 30% 35%)" }} />
            </button>
            <div className="flex flex-col">
              <span className="font-arabic text-sm font-bold" dir="rtl" style={{ color: "hsl(35 40% 30%)" }}>
                {currentSurahInfo?.name}
              </span>
              <span className="text-[10px]" style={{ color: "hsl(35 20% 55%)" }}>
                {currentSurahInfo?.englishName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] font-medium" style={{ color: "hsl(35 20% 50%)" }}>
              {t(`জুয ${currentJuz}`, `Juz ${currentJuz}`, `الجزء ${toArabicNum(currentJuz)}`)}
            </span>
            <ReadingSettings fontSize={fontSize} setFontSize={setFontSize} />
          </div>
        </div>
      </header>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="max-w-2xl mx-auto p-6 space-y-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" style={{ background: "hsl(35 20% 88%)" }} />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-5">
            {/* Mushaf page frame */}
            <div
              className="relative rounded-lg px-4 py-6 md:px-8 md:py-8 min-h-[70vh]"
              style={{
                background: "hsl(40 40% 97%)",
                border: "2px solid hsl(35 30% 82%)",
                boxShadow: "0 4px 20px hsl(35 20% 70% / 0.2), inset 0 0 60px hsl(40 30% 92% / 0.5)"
              }}
            >
              {/* Decorative corner ornaments */}
              <span className="absolute top-2 left-2 w-5 h-5 border-t-2 border-l-2 rounded-tl-sm" style={{ borderColor: "hsl(35 40% 70%)" }} />
              <span className="absolute top-2 right-2 w-5 h-5 border-t-2 border-r-2 rounded-tr-sm" style={{ borderColor: "hsl(35 40% 70%)" }} />
              <span className="absolute bottom-2 left-2 w-5 h-5 border-b-2 border-l-2 rounded-bl-sm" style={{ borderColor: "hsl(35 40% 70%)" }} />
              <span className="absolute bottom-2 right-2 w-5 h-5 border-b-2 border-r-2 rounded-br-sm" style={{ borderColor: "hsl(35 40% 70%)" }} />

              {groups.map((group, gi) => {
                const surahInfo = surahList.find((s) => s.number === group.surahNumber);
                const isFirstAyah = group.verses[0]?.verse_number === 1;

                return (
                  <div key={gi}>
                    {/* Surah header — if this group starts with ayah 1 */}
                    {isFirstAyah && surahInfo && (
                      <div className="text-center mb-4 mt-2">
                        <div
                          className="relative py-3 px-6 rounded-lg mx-auto max-w-xs"
                          style={{
                            background: "linear-gradient(135deg, hsl(35 40% 88%), hsl(40 35% 92%))",
                            border: "1.5px solid hsl(35 35% 75%)",
                            boxShadow: "0 2px 8px hsl(35 30% 70% / 0.15)"
                          }}
                        >
                          <h2
                            className="font-arabic text-xl md:text-2xl font-bold"
                            dir="rtl"
                            style={{ color: "hsl(35 50% 25%)" }}
                          >
                            {surahInfo.name}
                          </h2>
                          <p className="text-[10px] mt-0.5" style={{ color: "hsl(35 25% 50%)" }}>
                            {surahInfo.englishName} • {surahInfo.numberOfAyahs} {t("আয়াত", "Ayahs", "آيات")}
                          </p>
                        </div>

                        {/* Bismillah — not for Surah 1 (Al-Fatiha already has it) and Surah 9 */}
                        {group.surahNumber !== 9 && group.surahNumber !== 1 && (
                          <p
                            className="font-arabic text-lg md:text-xl py-2"
                            dir="rtl"
                            style={{ color: "hsl(35 45% 35%)" }}
                          >
                            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                          </p>
                        )}

                        <div className="h-px mx-auto w-32 mt-1" style={{ background: "hsl(35 30% 80%)" }} />
                      </div>
                    )}

                    {/* Flowing Arabic text */}
                    <div
                      className="font-arabic leading-[2.4] text-center"
                      dir="rtl"
                      style={{
                        fontSize: `${fontSize}px`,
                        color: "hsl(30 20% 15%)",
                        wordSpacing: "4px",
                        lineHeight: "2.6"
                      }}
                    >
                      {group.verses.map((verse) => (
                        <span key={verse.verse_key}>
                          {verse.text_uthmani}{" "}
                          <span
                            className="inline-block mx-0.5 align-middle select-none"
                            style={{
                              color: "hsl(35 60% 40%)",
                              fontSize: `${Math.max(14, fontSize * 0.55)}px`,
                              fontFamily: "serif"
                            }}
                          >
                            ﴿{toArabicNum(verse.verse_number)}﴾
                          </span>{" "}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Page number at bottom */}
              <div className="text-center mt-6">
                <span className="text-xs tracking-wider" style={{ color: "hsl(35 20% 60%)" }}>
                  — {mushafPage} —
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Page navigation */}
        <div className="sticky bottom-0 px-4 py-3 flex items-center justify-between" style={{
          background: "hsl(39 25% 95% / 0.95)",
          backdropFilter: "blur(8px)",
          borderTop: "1px solid hsl(35 20% 85%)"
        }}>
          <button
            onClick={goPrev}
            disabled={mushafPage <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-20"
            style={{ color: "hsl(35 50% 30%)" }}
          >
            <ChevronLeft className="w-4 h-4" />
            {t("আগে", "Prev", "السابق")}
          </button>

          {showPageInput ? (
            <form
              onSubmit={(e) => { e.preventDefault(); handlePageJump(); }}
              className="flex items-center gap-1"
            >
              <Input
                type="number"
                min={1}
                max={604}
                value={pageInput}
                onChange={(e) => setPageInput(e.target.value)}
                placeholder="1-604"
                className="w-20 h-7 text-xs text-center"
                autoFocus
                onBlur={() => { if (!pageInput) setShowPageInput(false); }}
              />
              <button
                type="submit"
                className="text-xs px-2 py-1 rounded"
                style={{ color: "hsl(35 50% 30%)", background: "hsl(35 30% 88%)" }}
              >
                {t("যাও", "Go", "اذهب")}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowPageInput(true)}
              className="text-xs px-3 py-1 rounded-md transition-colors hover:bg-black/5"
              style={{ color: "hsl(35 20% 45%)" }}
            >
              {t(`পৃষ্ঠা ${mushafPage} / ৬০৪`, `Page ${mushafPage} / 604`, `صفحة ${toArabicNum(mushafPage)} / ٦٠٤`)}
            </button>
          )}

          <button
            onClick={goNext}
            disabled={mushafPage >= 604}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-20"
            style={{ color: "hsl(35 50% 30%)" }}
          >
            {t("পরে", "Next", "التالي")}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
