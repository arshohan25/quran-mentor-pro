import { useState, useMemo, useEffect } from "react";
import { ArrowLeft, Star, BookText, Layers } from "lucide-react";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBookmark } from "@/hooks/useBookmark";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SurahSelector from "./SurahSelector";
import SurahHeader from "./SurahHeader";
import SurahNav from "./SurahNav";
import PageNav from "./PageNav";
import SurahInfoCard from "./SurahInfoCard";
import ReadingSettings from "./ReadingSettings";
import AyahActions from "./AyahActions";
import TafsirAccordion from "./TafsirAccordion";
import TafsirCompareSheet from "./TafsirCompareSheet";
import { TAFSIR_EDITIONS } from "@/hooks/useTafsir";
import { LINES_PER_PAGE, type QuranSectionProps } from "./types";

const TAFSIR_KEY = "preferred_tafsir_id";

export default function TranslationView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t, language } = useLanguage();
  const { toggleFavorite, isFavorite, saveLastRead } = useBookmark();
  const [page, setPage] = useState(0);
  const [arabicFontSize, setArabicFontSize] = useState(() => {
    try { return Number(localStorage.getItem("arabicFontSize")) || 20; } catch { return 20; }
  });
  const [tafsirId, setTafsirId] = useState<number>(() => {
    try { return Number(localStorage.getItem(TAFSIR_KEY)) || TAFSIR_EDITIONS[0].id; } catch { return TAFSIR_EDITIONS[0].id; }
  });
  const [compareAyah, setCompareAyah] = useState<number | null>(null);

  const handleFontSizeChange = (n: number) => {
    setArabicFontSize(n);
    try { localStorage.setItem("arabicFontSize", String(n)); } catch {}
  };

  const handleTafsirChange = (v: string) => {
    const n = Number(v);
    setTafsirId(n);
    try { localStorage.setItem(TAFSIR_KEY, String(n)); } catch {}
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

  // Auto-save reading position
  useEffect(() => {
    const firstIdx = pages[page]?.[0];
    const firstAyah = data?.arabic.ayahs[firstIdx];
    if (firstAyah) {
      saveLastRead(selectedSurah, firstAyah.numberInSurah, page, "translation");
    }
  }, [selectedSurah, page, pages, data, saveLastRead]);

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
        {/* Tafsir edition selector */}
        <div className="flex items-center gap-2 mb-3">
          <BookText className="w-3.5 h-3.5 text-primary/70" />
          <span className="text-[11px] text-muted-foreground">{t("তাফসির:", "Tafsir:")}</span>
          <Select value={String(tafsirId)} onValueChange={handleTafsirChange}>
            <SelectTrigger className="h-8 text-xs flex-1 max-w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TAFSIR_EDITIONS.map((e) => (
                <SelectItem key={e.id} value={String(e.id)} className="text-xs">
                  {language === "bn" ? e.bnLabel : e.enLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

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
                  <TafsirAccordion surah={selectedSurah} ayah={arabicAyah.numberInSurah} tafsirId={tafsirId} />
                  <button
                    type="button"
                    onClick={() => setCompareAyah(arabicAyah.numberInSurah)}
                    className="mt-1 flex items-center gap-1.5 text-[11px] font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    <Layers className="w-3 h-3" />
                    {t("সব তাফসির তুলনা করুন", "Compare all tafsirs", "قارن جميع التفاسير")}
                  </button>
                </Card>
              );
            })}
          </div>
        ) : null}

        {compareAyah !== null && (
          <TafsirCompareSheet
            open={true}
            onOpenChange={(o) => { if (!o) setCompareAyah(null); }}
            surah={selectedSurah}
            ayah={compareAyah}
          />
        )}

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
