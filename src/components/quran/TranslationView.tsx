import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Star } from "lucide-react";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBookmark } from "@/hooks/useBookmark";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import SurahSelector from "./SurahSelector";
import SurahHeader from "./SurahHeader";
import SurahNav from "./SurahNav";
import PageNav from "./PageNav";
import SurahInfoCard from "./SurahInfoCard";
import ReadingSettings from "./ReadingSettings";
import AyahActions from "./AyahActions";
import { LINES_PER_PAGE, type QuranSectionProps } from "./types";

export default function TranslationView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t } = useLanguage();
  const { toggleFavorite, isFavorite, saveLastRead } = useBookmark();
  const [page, setPage] = useState(0);
  const [arabicFontSize, setArabicFontSize] = useState(() => {
    try { return Number(localStorage.getItem("arabicFontSize")) || 20; } catch { return 20; }
  });

  const handleFontSizeChange = (n: number) => {
    setArabicFontSize(n);
    try { localStorage.setItem("arabicFontSize", String(n)); } catch {}
  };

  const { data, isLoading } = useSurahWithTranslations(selectedSurah);

  useEffect(() => { setPage(0); }, [selectedSurah]);

  const pages = useMemo(() => {
    if (!data) return [];
    const ayahs = data.arabic.ayahs;
    const result: number[][] = [];
    for (let i = 0; i < ayahs.length; i += LINES_PER_PAGE) {
      result.push(ayahs.slice(i, i + LINES_PER_PAGE).map((_, idx) => i + idx));
    }
    return result;
  }, [data]);

  const totalPages = pages.length;
  const currentIndices = pages[page] || [];

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-3">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-base md:text-lg font-bold">{t("তরজমা ও তাফসির", "Translation & Tafsir", "الترجمة والتفسير")}</h1>
            </div>
            <div className="flex items-center gap-2">
              <ReadingSettings fontSize={arabicFontSize} setFontSize={handleFontSizeChange} />
              <SurahSelector value={selectedSurah} onChange={setSelectedSurah} />
            </div>
          </div>
        </div>
      </header>

      <div className="container py-4 max-w-2xl mx-auto">
        {page === 0 && (
          <>
            <SurahInfoCard surahNumber={selectedSurah} />
            <SurahHeader surahNumber={selectedSurah} showBismillah={false} />
          </>
        )}

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : data ? (
          <div className="space-y-3">
            {currentIndices.map((idx) => {
              const arabicAyah = data.arabic.ayahs[idx];
              const bengaliAyah = data.bengali?.ayahs[idx];
              const englishAyah = data.english?.ayahs[idx];
              if (!arabicAyah) return null;
              return (
                <Card key={arabicAyah.number} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">{arabicAyah.numberInSurah}</span>
                    <div className="flex items-center gap-1">
                      <AyahActions
                        arabicText={arabicAyah.text}
                        translation={bengaliAyah?.text || englishAyah?.text}
                        surahName={data.arabic.edition?.englishName || ""}
                        surahNumber={selectedSurah}
                        ayahNumber={arabicAyah.numberInSurah}
                      />
                      <button onClick={() => toggleFavorite(selectedSurah, arabicAyah.numberInSurah, arabicAyah.text)} className="p-1 rounded-full hover:bg-accent/10 transition-colors">
                        <Star className={`w-4 h-4 ${isFavorite(selectedSurah, arabicAyah.numberInSurah) ? "fill-accent text-accent" : "text-muted-foreground"}`} />
                      </button>
                    </div>
                  </div>
                  <p className="font-arabic leading-[2.2] text-foreground" dir="rtl" style={{ fontSize: `${arabicFontSize}px` }}>{arabicAyah.text}</p>
                  {bengaliAyah && (
                    <p className="text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-2">
                      <span className="text-xs font-semibold text-primary/70 block mb-1">{t("বাংলা", "Bengali", "بنغالي")}</span>
                      {bengaliAyah.text}
                    </p>
                  )}
                  {englishAyah && (
                    <p className="text-sm leading-relaxed text-muted-foreground border-t border-border/40 pt-2">
                      <span className="text-xs font-semibold text-primary/70 block mb-1">{t("ইংরেজি", "English", "إنجليزي")}</span>
                      {englishAyah.text}
                    </p>
                  )}
                </Card>
              );
            })}
          </div>
        ) : null}

        <PageNav
          currentPage={page} totalPages={totalPages}
          onPrev={() => page > 0 ? setPage(page - 1) : selectedSurah > 1 && (setSelectedSurah(selectedSurah - 1), setPage(999))}
          onNext={() => page < totalPages - 1 ? setPage(page + 1) : selectedSurah < 114 && (setSelectedSurah(selectedSurah + 1), setPage(0))}
          disablePrev={page === 0 && selectedSurah <= 1}
          disableNext={page >= totalPages - 1 && selectedSurah >= 114}
        />
        <SurahNav selectedSurah={selectedSurah} setSelectedSurah={setSelectedSurah} />
      </div>
    </div>
  );
}
