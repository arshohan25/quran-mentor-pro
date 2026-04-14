import { useState, useEffect, useRef } from "react";
import { ArrowLeft, Settings, Play } from "lucide-react";
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
  const juzPages = [1,22,42,62,82,102,121,142,162,182,201,222,242,262,282,302,322,342,362,382,402,422,442,462,482,502,522,542,562,582,591,604];
  for (let i = juzPages.length - 1; i >= 0; i--) {
    if (page >= juzPages[i]) return i + 1;
  }
  return 1;
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

// quran.com exact colors
const TEAL = "#2CA4AB";
const DARK_BG = "#1B2B34";
const DARK_HEADER = "#243B4A";
const DARK_CONTENT = "#1B2B34";
const DARK_BORDER = "#2D4A5A";
const TEXT_LIGHT = "#E8E8E8";
const TEXT_DIM = "#8BA4B5";
const TEXT_MUTED = "#5C7A8A";

export default function ReadingView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t } = useLanguage();

  const [mushafPage, setMushafPage] = useState(() => SURAH_START_PAGES[selectedSurah] || 1);
  const [fontSize, setFontSize] = useState(() => {
    const saved = localStorage.getItem("mushaf-font-size");
    return saved ? Number(saved) : 26;
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: DARK_BG }}>
        <div className="text-center space-y-3">
          <p className="text-lg" style={{ color: "#E85D5D" }}>⚠️ {t("লোড করা যায়নি", "Failed to load", "فشل التحميل")}</p>
          <button onClick={onBack} className="text-sm underline" style={{ color: TEXT_DIM }}>
            {t("ফিরে যান", "Go back", "عودة")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: DARK_BG }}>

      {/* ===== HEADER — quran.com exact ===== */}
      <header className="sticky top-0 z-50" style={{ background: DARK_HEADER }}>

        {/* Row 1: Surah name + settings */}
        <div className="flex items-center justify-between px-4 py-2.5" style={{ borderBottom: `1px solid ${DARK_BORDER}` }}>
          <div className="flex items-center gap-2.5">
            <button onClick={onBack} className="p-1 rounded-md" style={{ color: TEXT_DIM }}>
              <ArrowLeft className="w-5 h-5" />
            </button>
            <button className="flex items-center gap-1 text-sm font-medium" style={{ color: TEXT_LIGHT }}>
              {currentSurahInfo
                ? `${currentSurahInfo.number}. ${currentSurahInfo.englishName}`
                : ""
              }
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5L6 7.5L9 4.5" stroke={TEXT_DIM} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <ReadingSettings fontSize={fontSize} setFontSize={setFontSize} />
        </div>

        {/* Row 2: Reading tab indicator — teal underline */}
        <div className="flex items-center px-4" style={{ borderBottom: `1px solid ${DARK_BORDER}` }}>
          <button
            className="px-4 py-2.5 text-xs font-medium relative"
            style={{ color: TEXT_DIM }}
            onClick={onBack}
          >
            Verse by Verse
          </button>
          <button
            className="px-4 py-2.5 text-xs font-medium relative"
            style={{ color: TEAL }}
          >
            Reading
            <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: TEAL }} />
          </button>
        </div>

        {/* Row 3: Sub-controls — Listen | Arabic | Translation */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{
          background: DARK_CONTENT,
          borderBottom: `1px solid ${DARK_BORDER}`
        }}>
          <button
            className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ color: TEAL, border: `1px solid ${DARK_BORDER}` }}
          >
            <Play className="w-3 h-3" fill={TEAL} />
            Listen
          </button>
          <button
            className="text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ color: TEXT_LIGHT, border: `1.5px solid ${TEXT_LIGHT}`, background: "transparent" }}
          >
            Arabic
          </button>
          <button
            className="text-xs font-medium px-3 py-1.5 rounded-full"
            style={{ color: TEXT_DIM, border: `1px solid ${DARK_BORDER}` }}
          >
            Translation
          </button>
        </div>
      </header>

      {/* ===== CONTENT ===== */}
      <div ref={contentRef} className="flex-1 overflow-y-auto" style={{ background: DARK_CONTENT }}>
        {isLoading ? (
          <div className="max-w-2xl mx-auto p-6 space-y-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-full" style={{ background: DARK_BORDER }} />
            ))}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto px-5 py-4">
            {groups.map((group, gi) => {
              const surahInfo = surahList.find((s) => s.number === group.surahNumber);
              const isFirstAyah = group.verses[0]?.verse_number === 1;

              return (
                <div key={gi}>
                  {/* ===== SURAH HEADER — quran.com exact ===== */}
                  {isFirstAyah && surahInfo && (
                    <div className="text-center my-4">
                      {/* Surah name row */}
                      <div className="flex items-center justify-center gap-3 mb-1">
                        {/* Decorative large Arabic name */}
                        <span
                          className="font-arabic text-3xl md:text-4xl"
                          dir="rtl"
                          style={{
                            color: TEXT_LIGHT,
                            fontWeight: 700,
                            letterSpacing: "1px"
                          }}
                        >
                          {surahInfo.name}
                        </span>
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <span className="text-sm font-semibold" style={{ color: TEXT_LIGHT }}>
                              {surahInfo.number}. {surahInfo.englishName}
                            </span>
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold"
                              style={{ background: TEAL, color: "#fff" }}
                            >
                              info
                            </span>
                          </div>
                          <p className="text-xs" style={{ color: TEXT_DIM }}>
                            {surahInfo.englishNameTranslation}
                          </p>
                        </div>
                      </div>

                      {/* Bismillah — not for Surah 9 & already included in Surah 1 text */}
                      {group.surahNumber !== 9 && group.surahNumber !== 1 && (
                        <div className="mt-3 mb-2">
                          <p
                            className="font-arabic text-lg"
                            dir="rtl"
                            style={{ color: TEXT_DIM, fontStyle: "italic" }}
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

                  {/* ===== FLOWING ARABIC TEXT ===== */}
                  <div
                    className="font-arabic text-center"
                    dir="rtl"
                    style={{
                      fontSize: `${fontSize}px`,
                      color: TEXT_LIGHT,
                      wordSpacing: "5px",
                      lineHeight: "2.5",
                    }}
                  >
                    {group.verses.map((verse) => (
                      <span key={verse.verse_key} className="inline">
                        {verse.text_uthmani}{" "}
                        {/* Verse end marker — thin circle like quran.com */}
                        <span
                          className="inline-flex items-center justify-center select-none align-middle"
                          style={{
                            width: `${Math.max(20, fontSize * 0.7)}px`,
                            height: `${Math.max(20, fontSize * 0.7)}px`,
                            borderRadius: "50%",
                            border: `1.2px solid ${TEXT_DIM}`,
                            color: TEXT_DIM,
                            fontSize: `${Math.max(9, fontSize * 0.35)}px`,
                            fontFamily: "sans-serif",
                            fontWeight: 500,
                            lineHeight: 1,
                            margin: "0 1px",
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

            {/* Page number — centered simple like quran.com */}
            <div className="text-center mt-6 mb-2">
              <span className="text-sm" style={{ color: TEXT_MUTED }}>
                {mushafPage}
              </span>
            </div>

            {/* End of page / Continue reading links like quran.com */}
            <div className="flex items-center justify-center gap-8 py-4" style={{
              borderTop: `1px solid ${DARK_BORDER}`
            }}>
              {mushafPage > 1 && (
                <button
                  onClick={goPrev}
                  className="text-xs font-medium"
                  style={{ color: TEXT_DIM }}
                >
                  {t("আগের পৃষ্ঠা", "Previous Page", "الصفحة السابقة")}
                </button>
              )}
              {mushafPage < 604 && (
                <button
                  onClick={goNext}
                  className="text-xs font-medium"
                  style={{ color: TEAL }}
                >
                  {t("পরবর্তী পৃষ্ঠা", "Continue Reading", "متابعة القراءة")}
                </button>
              )}
            </div>

            {/* Page jump */}
            <div className="flex items-center justify-center py-3">
              {showPageInput ? (
                <form
                  onSubmit={(e) => { e.preventDefault(); handlePageJump(); }}
                  className="flex items-center gap-2"
                >
                  <Input
                    type="number"
                    min={1}
                    max={604}
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    placeholder="1-604"
                    className="w-20 h-8 text-xs text-center border-none"
                    style={{ background: DARK_HEADER, color: TEXT_LIGHT }}
                    autoFocus
                    onBlur={() => { if (!pageInput) setShowPageInput(false); }}
                  />
                  <button
                    type="submit"
                    className="text-xs px-3 py-1.5 rounded-md font-medium"
                    style={{ background: TEAL, color: "#fff" }}
                  >
                    Go
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setShowPageInput(true)}
                  className="text-[11px] px-4 py-1.5 rounded-full"
                  style={{ color: TEXT_MUTED, border: `1px solid ${DARK_BORDER}` }}
                >
                  {t(
                    `পৃষ্ঠা ${mushafPage} / ৬০৪`,
                    `Page ${mushafPage} of 604`,
                    `صفحة ${toArabicNum(mushafPage)} من ٦٠٤`
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
