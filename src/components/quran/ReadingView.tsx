import { useState, useMemo } from "react";
import { ArrowLeft, Palette, Star } from "lucide-react";
import { surahList } from "@/data/surahList";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBookmark } from "@/hooks/useBookmark";
import { Skeleton } from "@/components/ui/skeleton";
import TajweedText, { TajweedLegend } from "@/components/TajweedText";
import SurahSelector from "./SurahSelector";
import SurahHeader from "./SurahHeader";
import SurahNav from "./SurahNav";
import PageNav from "./PageNav";
import { LINES_PER_PAGE, type QuranSectionProps } from "./types";

export default function ReadingView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t } = useLanguage();
  const { toggleFavorite, isFavorite } = useBookmark();
  const [currentPage, setCurrentPage] = useState(0);
  const [tajweedEnabled, setTajweedEnabled] = useState(() => {
    try { return localStorage.getItem("tajweedEnabled") !== "false"; } catch { return true; }
  });

  const { data, isLoading } = useSurahWithTranslations(selectedSurah);

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

  const handleSurahChange = (n: number) => {
    setSelectedSurah(n);
    setCurrentPage(0);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-3">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-base md:text-lg font-bold">{t("কুরআন তেলাওয়াত", "Quran Reading", "تلاوة القرآن")}</h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => { setTajweedEnabled(!tajweedEnabled); localStorage.setItem("tajweedEnabled", String(!tajweedEnabled)); }}
                className={`p-1.5 rounded-lg transition-colors ${tajweedEnabled ? "bg-primary-foreground/20 text-primary-foreground" : "text-primary-foreground/60 hover:text-primary-foreground"}`}
                title={t("তাজবীদ কালার", "Tajweed Colors", "ألوان التجويد")}
              >
                <Palette className="w-4 h-4" />
              </button>
              <SurahSelector value={selectedSurah} onChange={handleSurahChange} />
            </div>
          </div>
        </div>
      </header>

      <div className="container py-4 max-w-2xl mx-auto">
        {currentPage === 0 && <SurahHeader surahNumber={selectedSurah} />}
        {tajweedEnabled && <div className="mb-4"><TajweedLegend /></div>}

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(LINES_PER_PAGE)].map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}
          </div>
        ) : pages.length > 0 ? (
          <div className="rounded-xl border border-border bg-card p-4 md:p-6">
            <div className="space-y-1" dir="rtl">
              {pages[currentPage]?.map((ayah) => (
                <div key={ayah.number} className="flex items-center gap-1 py-1.5 border-b border-border/30 last:border-b-0">
                  <button onClick={() => toggleFavorite(selectedSurah, ayah.numberInSurah, ayah.text)} className="p-0.5 shrink-0" dir="ltr">
                    <Star className={`w-3.5 h-3.5 ${isFavorite(selectedSurah, ayah.numberInSurah) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                  </button>
                  <span className="text-[10px] text-muted-foreground font-bold min-w-[20px] text-center shrink-0 font-sans" dir="ltr">{ayah.numberInSurah}</span>
                  <TajweedText text={ayah.text} enabled={tajweedEnabled} className="font-arabic text-lg md:text-xl lg:text-2xl leading-[2.2] text-foreground flex-1" />
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <PageNav
          currentPage={currentPage}
          totalPages={totalPages}
          onPrev={() => { if (currentPage > 0) setCurrentPage(currentPage - 1); else if (selectedSurah > 1) { setSelectedSurah(selectedSurah - 1); setCurrentPage(999); } }}
          onNext={() => { if (currentPage < totalPages - 1) setCurrentPage(currentPage + 1); else if (selectedSurah < 114) { setSelectedSurah(selectedSurah + 1); setCurrentPage(0); } }}
          disablePrev={currentPage === 0 && selectedSurah <= 1}
          disableNext={currentPage >= totalPages - 1 && selectedSurah >= 114}
        />
        <SurahNav selectedSurah={selectedSurah} setSelectedSurah={(n) => handleSurahChange(n)} />
      </div>
    </div>
  );
}
