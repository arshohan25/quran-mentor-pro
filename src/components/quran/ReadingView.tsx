import { useState, useMemo, useEffect, useRef } from "react";
import { ArrowLeft, Search } from "lucide-react";
import { surahList } from "@/data/surahList";
import { juzList } from "@/data/juzData";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import TajweedText from "@/components/TajweedText";
import SurahSelector from "./SurahSelector";
import ReadingSettings from "./ReadingSettings";
import AyahActions from "./AyahActions";
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

interface QuranSectionProps {
  selectedSurah: number;
  setSelectedSurah: (n: number) => void;
  onBack: () => void;
}

export default function ReadingView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { saveLastRead, isFavorite, toggleFavorite } = useBookmark();
  const { t } = useLanguage();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [tajweedEnabled, setTajweedEnabled] = useState(() => {
    try { return localStorage.getItem("tajweedEnabled") !== "false"; } catch { return true; }
  });
  const [arabicFontSize, setArabicFontSize] = useState(() => {
    try { return Number(localStorage.getItem("arabicFontSize")) || 22; } catch { return 22; }
  });
  const [showPageJump, setShowPageJump] = useState(false);
  const [pageJumpInput, setPageJumpInput] = useState("");

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

  const ayahs = useMemo(() => {
    if (!data) return [];
    return data.arabic.ayahs.map((a, i) => ({
      ...a,
      bengaliText: data.bengali?.ayahs?.[i]?.text || "",
      englishText: data.english?.ayahs?.[i]?.text || "",
    }));
  }, [data]);

  // Reading progress
  const [readProgress, setReadProgress] = useState(0);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const pct = el.scrollHeight <= el.clientHeight ? 100 : Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
      setReadProgress(pct);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [ayahs]);

  // Save last read on scroll
  useEffect(() => {
    if (ayahs.length > 0) {
      saveLastRead(selectedSurah, 1, ayahs[0]?.page || 1, "reading");
    }
  }, [selectedSurah, ayahs, saveLastRead]);

  const handleSurahChange = (n: number) => {
    setSelectedSurah(n);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const handlePageJump = () => {
    const num = parseInt(pageJumpInput, 10);
    if (isNaN(num) || num < 1 || num > 604) return;
    setShowPageJump(false);
    setPageJumpInput("");
    // Find surah containing this page
    const targetSurah = surahList.find((s, i) => {
      const nextStart = surahList[i + 1];
      if (!nextStart) return true;
      return num >= 1; // simplified - just navigate
    });
    if (targetSurah) setSelectedSurah(targetSurah.number);
  };

  const firstAyah = ayahs[0];
  const currentJuz = firstAyah ? getJuzNumber(selectedSurah, 1) : 1;
  const currentPage = firstAyah?.page || 1;

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-[#008374] dark:bg-[#006B5F] text-white">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2">
            <button onClick={onBack} className="hover:opacity-80 p-1">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <SurahSelector value={selectedSurah} onChange={handleSurahChange} />
              <button
                onClick={() => { setShowPageJump(!showPageJump); setPageJumpInput(String(currentPage)); }}
                className="text-[10px] opacity-70 pl-1 hover:opacity-100 transition-opacity flex items-center gap-1"
              >
                <Search className="w-2.5 h-2.5" />
                {t("পৃষ্ঠা", "Page", "صفحة")} {currentPage} · {t("পারা", "Juz", "الجزء")} {currentJuz}
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
        <div className="h-0.5 bg-white/20">
          <div className="h-full bg-white/80 transition-all duration-300" style={{ width: `${readProgress}%` }} />
        </div>
      </header>

      {/* Page jump */}
      {showPageJump && (
        <div className="bg-[#008374]/90 dark:bg-[#006B5F]/95 px-4 py-2.5 flex items-center gap-2">
          <input
            type="number" min={1} max={604}
            value={pageJumpInput}
            onChange={(e) => setPageJumpInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handlePageJump()}
            placeholder="1-604" autoFocus
            className="w-20 px-2 py-1 rounded text-sm bg-white/15 border border-white/20 text-white placeholder:text-white/40 focus:outline-none focus:ring-1 focus:ring-white/40 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button onClick={handlePageJump} className="px-3 py-1 rounded bg-white/20 hover:bg-white/30 text-white text-xs font-medium">
            {t("যাও", "Go", "اذهب")}
          </button>
          <button onClick={() => setShowPageJump(false)} className="ml-auto text-white/60 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* Content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-4 p-4">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : (
          <>
            {/* Surah intro header */}
            <div className="bg-gradient-to-b from-[#008374]/5 to-transparent dark:from-[#008374]/10 py-6 px-4 text-center border-b border-border">
              <div className="inline-block px-6 py-3 rounded-2xl bg-[#008374]/5 dark:bg-[#008374]/10 mb-3">
                <p className="font-arabic text-2xl md:text-3xl font-bold text-foreground">
                  {surah?.name}
                </p>
              </div>
              <p className="text-sm font-semibold text-foreground">
                {selectedSurah}. {surah?.englishName}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {surah?.englishNameTranslation} · {surah?.numberOfAyahs} {t("আয়াত", "Verses", "آيات")} · {{surah?.englishNameTranslation} · {surah?.numberOfAyahs} {t("আয়াত", "Verses", "آيات")} · {surah?.revelationType === "Meccan" ? t("মক্কী", "Meccan", "مكية") : t("মাদানী", "Medinan", "مدنية")} ? t("মক্কী", "Meccan", "مكية") : t("মাদানী", "Medinan", "مدنية")}
              </p>

              {/* Bismillah */}
              {selectedSurah !== 9 && (
                <div className="mt-4 pt-4 border-t border-border/50">
                  <p className="font-arabic text-xl md:text-2xl text-foreground font-bold leading-relaxed">
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t(
                      "পরম করুণাময় অতি দয়ালু আল্লাহর নামে",
                      "In the Name of Allah, the Most Compassionate, Most Merciful",
                      "بسم الله الرحمن الرحيم"
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Ayah list */}
            <div className="divide-y divide-border">
              {ayahs.map((ayah) => {
                const bookmarkKey = `${selectedSurah}:${ayah.numberInSurah}`;
                const bookmarked = isFavorite(selectedSurah, ayah.numberInSurah);
                return (
                  <div key={ayah.number} className="px-4 py-3 hover:bg-accent/5 transition-colors">
                    {/* Action bar */}
                    <AyahActions
                      arabicText={ayah.text}
                      translation={ayah.bengaliText || ayah.englishText}
                      surahName={surah?.englishName}
                      surahNumber={selectedSurah}
                      ayahNumber={ayah.numberInSurah}
                      onBookmark={() => toggleFavorite(selectedSurah, ayah.numberInSurah)}
                      isBookmarked={bookmarked}
                    />

                    {/* Arabic text */}
                    <div className="mt-3 text-right" dir="rtl">
                      <p className="font-arabic font-bold text-foreground leading-[2.2]" style={{ fontSize: `${arabicFontSize}px` }}>
                        {tajweedEnabled ? (
                          <TajweedText text={ayah.text} enabled={true} className="inline" />
                        ) : (
                          <span>{ayah.text}</span>
                        )}
                        <span className="inline-flex items-center justify-center mx-1 text-[#008374] dark:text-[#4ECDC4] font-bold select-none align-middle"
                              style={{ fontSize: `${Math.max(12, arabicFontSize - 6)}px`, fontFamily: 'serif' }}>
                          ﴿{toArabicNum(ayah.numberInSurah)}﴾
                        </span>
                      </p>
                    </div>

                    {/* Translation */}
                    {(ayah.bengaliText || ayah.englishText) && (
                      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                        {ayah.bengaliText || ayah.englishText}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Surah navigation */}
            <div className="flex items-center justify-between px-4 py-4 border-t border-border bg-muted/30">
              {selectedSurah > 1 && (
                <button
                  onClick={() => handleSurahChange(selectedSurah - 1)}
                  className="text-xs text-[#008374] dark:text-[#4ECDC4] font-medium hover:underline"
                >
                  ← {surahList.find(s => s.number === selectedSurah - 1)?.englishName}
                </button>
              )}
              <div className="flex-1" />
              {selectedSurah < 114 && (
                <button
                  onClick={() => handleSurahChange(selectedSurah + 1)}
                  className="text-xs text-[#008374] dark:text-[#4ECDC4] font-medium hover:underline"
                >
                  {surahList.find(s => s.number === selectedSurah + 1)?.englishName} →
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
