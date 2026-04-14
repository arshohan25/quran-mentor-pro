import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ChevronDown } from "lucide-react";
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
  return Math.ceil(getJuzForPage(page) * 2 - 1);
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
const DARK_BG = "#1B1F27";
const DARK_HEADER = "#1F2937";
const DARK_CONTENT = "#1B1F27";
const DARK_BORDER = "#2D3748";
const TEXT_WHITE = "#FFFFFF";
const TEXT_DIM = "#8B9DB5";
const TEXT_MUTED = "#5C7080";

export default function ReadingView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t } = useLanguage();
  const quranComReadingFontSize = 22;

  const [mushafPage, setMushafPage] = useState(() => SURAH_START_PAGES[selectedSurah] || 1);
  const fontSize = quranComReadingFontSize;
  const [pageInput, setPageInput] = useState("");
  const [showPageInput, setShowPageInput] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
    contentRef.current?.scrollTo({ top: 0 });
    setScrolled(false);
  }, [mushafPage]);
...
            {scrolled && (
              <span className="text-xs" style={{ color: TEXT_DIM }}>
                Juz {currentJuz} / Hizb {currentHizb}
              </span>
            )}
            <ReadingSettings fontSize={fontSize} hideFontSize />
          </div>
        </div>

        {/* Row 2: Tab bar — Verse by Verse | Reading */}
        {!scrolled && (
          <div className="flex items-center px-4" style={{ borderBottom: `1px solid ${DARK_BORDER}` }}>
            <button
              className="px-3 py-2.5 text-xs font-medium"
              style={{ color: TEXT_DIM }}
              onClick={onBack}
            >
              Verse by Verse
            </button>
            <button
              className="px-3 py-2.5 text-xs font-medium relative"
              style={{ color: TEAL }}
            >
              Reading
              <span className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full" style={{ background: TEAL }} />
            </button>
          </div>
        )}

        {/* Row 3: Sub-controls — Listen | Arabic | Translation (only when scrolled show compact icons) */}
        {!scrolled && (
          <div className="flex items-center gap-2 px-4 py-2" style={{
            background: DARK_CONTENT,
            borderBottom: `1px solid ${DARK_BORDER}`
          }}>
            <button
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ color: TEAL, border: `1px solid ${DARK_BORDER}` }}
            >
              ▶ Listen
            </button>
            <button
              className="text-xs font-medium px-3 py-1.5 rounded-full"
              style={{ color: TEXT_WHITE, border: `1.5px solid ${TEXT_WHITE}`, background: "transparent" }}
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
        )}

        {/* Scrolled: compact surah + icons row */}
        {scrolled && (
          <div className="flex items-center justify-between px-3 py-1.5" style={{
            background: DARK_CONTENT,
            borderBottom: `1px solid ${DARK_BORDER}`
          }}>
            <button className="flex items-center gap-1 text-xs font-medium" style={{ color: TEXT_WHITE }}>
              {currentSurahInfo?.number}. {currentSurahInfo?.englishName}
              <ChevronDown className="w-3 h-3" style={{ color: TEXT_DIM }} />
            </button>
            <div className="flex items-center gap-3">
              <span className="text-xs" style={{ color: TEXT_DIM }}>📖</span>
              <span className="text-xs" style={{ color: TEXT_DIM }}>🔤</span>
              <span className="text-xs" style={{ color: TEXT_DIM }}>🅰️</span>
            </div>
          </div>
        )}
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
          <div className="max-w-2xl mx-auto px-4 py-3">
            {groups.map((group, gi) => {
              const surahInfo = surahList.find((s) => s.number === group.surahNumber);
              const isFirstAyah = group.verses[0]?.verse_number === 1;

              return (
                <div key={gi}>
                  {/* ===== SURAH HEADER — quran.com style ===== */}
                  {isFirstAyah && surahInfo && (
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

                      {/* Bismillah */}
                      {group.surahNumber !== 9 && group.surahNumber !== 1 && (
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

                  {/* ===== FLOWING ARABIC TEXT — quran.com exact ===== */}
                  <div
                    className="text-center"
                    dir="rtl"
                    style={{
                      fontFamily: "'UthmanicHafs', 'Amiri', serif",
                      fontSize: `${fontSize}px`,
                      color: TEXT_WHITE,
                      wordSpacing: "2px",
                      lineHeight: "1.82",
                      letterSpacing: "0px",
                    }}
                  >
                    {group.verses.map((verse) => (
                      <span key={verse.verse_key} className="inline">
                        {verse.text_uthmani}{" "}
                        {/* Verse end marker — quran.com circle style */}
                        <span
                          className="inline-flex items-center justify-center select-none align-middle"
                          style={{
                            width: `${Math.max(22, fontSize * 0.75)}px`,
                            height: `${Math.max(22, fontSize * 0.75)}px`,
                            borderRadius: "50%",
                            border: `1.5px solid ${TEAL}`,
                            color: TEAL,
                            fontSize: `${Math.max(10, fontSize * 0.36)}px`,
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

            {/* Page number — centered like quran.com */}
            <div className="text-center mt-8 mb-3">
              <span className="text-sm font-medium" style={{ color: TEXT_MUTED }}>
                {mushafPage}
              </span>
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-center gap-8 py-4" style={{
              borderTop: `1px solid ${DARK_BORDER}`
            }}>
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
                    style={{ background: DARK_HEADER, color: TEXT_WHITE }}
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
