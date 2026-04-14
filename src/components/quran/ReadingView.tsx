import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuranPage } from "@/hooks/useQuranPage";
import { surahList } from "@/data/surahList";
import { SURAH_START_PAGES, surahForPage } from "@/data/mushafPages";
import ReadingSettings from "@/components/quran/ReadingSettings";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import type { QuranSectionProps } from "@/components/quran/types";

function toArabicNum(n: number): string {
  return n.toString().replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[parseInt(d)]);
}

function getJuzForPage(page: number): number {
  const juzPages = [1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582,591,604];
  for (let i = juzPages.length - 1; i >= 0; i--) {
    if (page >= juzPages[i]) return i + 1;
  }
  return 1;
}

function getHizbForPage(page: number): number {
  return Math.ceil(page / 10.07);
}

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

// Teal accent matching quran.com
const TEAL = "#2CA4AB";
const TEAL_LIGHT = "#E8F5F6";

export default function ReadingView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t } = useLanguage();

  const [mushafPage, setMushafPage] = useState(() => SURAH_START_PAGES[selectedSurah] || 1);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("mushaf-font-size");
    return saved ? Number(saved) : 28;
  });
  const [pageInput, setPageInput] = useState("");
  const [showPageInput, setShowPageInput] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const { data, isLoading, error } = useQuranPage(mushafPage);

  useEffect(() => {
    const s = surahForPage(mushafPage);
    if (s !== selectedSurah) setSelectedSurah(s);
  }, [mushafPage]);

  const prevSurahRef = useRef(selectedSurah);
  useEffect(() => {
    if (selectedSurah !== prevSurahRef.current) {
      prevSurahRef.current = selectedSurah;
      setMushafPage(SURAH_START_PAGES[selectedSurah] || 1);
    }
  }, [selectedSurah]);

  useEffect(() => {
    localStorage.setItem("mushaf-font-size", String(fontSize));
  }, [fontSize]);

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0 });
  }, [mushafPage]);

  const currentJuz = getJuzForPage(mushafPage);
  const currentHizb = getHizbForPage(mushafPage);
  const currentSurahNum = surahForPage(mushafPage);
  const currentSurahInfo = surahList.find((s) => s.number === currentSurahNum);

  const goNext = () => { if (mushafPage < 604) setMushafPage(mushafPage + 1); };
  const goPrev = () => { if (mushafPage > 1) setMushafPage(mushafPage - 1); };

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
      <div className="min-h-screen bg-white flex items-center justify-center">
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
    <div className="min-h-screen flex flex-col bg-white">
      {/* Top bar — quran.com style */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
        {/* Surah name bar */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <span className="font-arabic text-base font-semibold text-gray-800" dir="rtl">
                {currentSurahInfo?.name}
              </span>
              <span className="text-xs text-gray-400 ml-2">
                {currentSurahInfo?.englishName}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ReadingSettings fontSize={fontSize} setFontSize={setFontSize} />
          </div>
        </div>

        {/* Page / Juz / Hizb info bar */}
        <div className="flex items-center justify-center gap-4 px-4 pb-2 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            Page {mushafPage}
          </span>
          <span>Juz {currentJuz} / Hizb {currentHizb}</span>
        </div>
      </header>

      {/* Content */}
      <div ref={contentRef} className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="max-w-2xl mx-auto p-6 space-y-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full bg-gray-100" />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-4 py-4">
            {groups.map((group, gi) => {
              const surahInfo = surahList.find((s) => s.number === group.surahNumber);
              const isFirstAyah = group.verses[0]?.verse_number === 1;

              return (
                <div key={gi}>
                  {/* Surah header — quran.com style */}
                  {isFirstAyah && surahInfo && (
                    <div className="text-center my-5">
                      {/* Decorative surah banner */}
                      <div className="relative py-4 px-6 mx-auto max-w-sm">
                        {/* Ornamental frame */}
                        <div
                          className="absolute inset-0 rounded-xl"
                          style={{
                            background: "linear-gradient(135deg, #F7F8FA 0%, #EEF5F0 100%)",
                            border: "1.5px solid #D4E4D9",
                          }}
                        />
                        <div className="relative">
                          <h2
                            className="font-arabic text-2xl md:text-3xl font-bold"
                            dir="rtl"
                            style={{ color: "#1A1A1A" }}
                          >
                            {surahInfo.name}
                          </h2>
                          <div className="flex items-center justify-center gap-2 mt-1">
                            <span className="text-sm font-medium text-gray-700">
                              {surahInfo.number}. {surahInfo.englishName}
                            </span>
                            <span
                              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                              style={{ background: TEAL_LIGHT, color: TEAL }}
                            >
                              info
                            </span>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {surahInfo.englishNameTranslation}
                          </p>
                        </div>
                      </div>

                      {/* Bismillah */}
                      {group.surahNumber !== 9 && group.surahNumber !== 1 && (
                        <div className="mt-4 mb-2">
                          <p
                            className="font-arabic text-xl md:text-2xl"
                            dir="rtl"
                            style={{ color: "#333" }}
                          >
                            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            In the Name of Allah—the Most Compassionate, Most Merciful
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Flowing Arabic text — paragraph style */}
                  <div
                    className="font-arabic text-right leading-loose"
                    dir="rtl"
                    style={{
                      fontSize: `${fontSize}px`,
                      color: "#1A1A1A",
                      wordSpacing: "6px",
                      lineHeight: "2.6",
                    }}
                  >
                    {group.verses.map((verse) => (
                      <span key={verse.verse_key} className="inline">
                        {verse.text_uthmani}{" "}
                        {/* Verse end marker — teal circular style like quran.com */}
                        <span
                          className="inline-flex items-center justify-center select-none align-middle"
                          style={{
                            width: `${Math.max(22, fontSize * 0.75)}px`,
                            height: `${Math.max(22, fontSize * 0.75)}px`,
                            borderRadius: "50%",
                            border: `1.5px solid ${TEAL}`,
                            color: TEAL,
                            fontSize: `${Math.max(10, fontSize * 0.38)}px`,
                            fontFamily: "sans-serif",
                            fontWeight: 600,
                            lineHeight: 1,
                            margin: "0 2px",
                          }}
                        >
                          {toArabicNum(verse.verse_number)}
                        </span>{" "}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Page number at bottom */}
            <div className="text-center mt-8 mb-4">
              <span className="text-gray-300 text-xs tracking-widest">
                — {mushafPage} —
              </span>
            </div>
          </div>
        )}

        {/* Bottom navigation — clean white */}
        <div
          className="sticky bottom-0 px-4 py-3 flex items-center justify-between bg-white/95 backdrop-blur-sm"
          style={{ borderTop: "1px solid #f0f0f0" }}
        >
          <button
            onClick={goPrev}
            disabled={mushafPage <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-20 hover:bg-gray-50"
            style={{ color: TEAL }}
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
                className="text-xs px-2 py-1 rounded text-white"
                style={{ background: TEAL }}
              >
                {t("যাও", "Go", "اذهب")}
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowPageInput(true)}
              className="text-xs px-3 py-1 rounded-full transition-colors hover:bg-gray-50"
              style={{ color: "#999" }}
            >
              {t(`পৃষ্ঠা ${mushafPage} / ৬০৪`, `Page ${mushafPage} / 604`, `صفحة ${toArabicNum(mushafPage)} / ٦٠٤`)}
            </button>
          )}

          <button
            onClick={goNext}
            disabled={mushafPage >= 604}
            className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-20 hover:bg-gray-50"
            style={{ color: TEAL }}
          >
            {t("পরে", "Next", "التالي")}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
