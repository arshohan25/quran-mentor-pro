import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { useWordByWord } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { surahList } from "@/data/surahList";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import SurahSelector from "./SurahSelector";
import SurahNav from "./SurahNav";
import PageNav from "./PageNav";
import { type QuranSectionProps } from "./types";

const VERSES_PER_PAGE = 5;

export default function WordMeaningView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t, language } = useLanguage();
  const [page, setPage] = useState(0);
  const { data: wordData, isLoading } = useWordByWord(selectedSurah, language === "bn" ? "bn" : "en");

  useEffect(() => { setPage(0); }, [selectedSurah]);

  const totalPages = wordData ? Math.ceil(wordData.length / VERSES_PER_PAGE) : 0;
  const clampedPage = Math.min(page, Math.max(0, totalPages - 1));
  const currentVerses = wordData?.slice(clampedPage * VERSES_PER_PAGE, (clampedPage + 1) * VERSES_PER_PAGE) || [];
  const currentSurah = surahList.find((s) => s.number === selectedSurah);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-3">
        <div className="container">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button onClick={onBack} className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></button>
              <h1 className="text-base md:text-lg font-bold">{t("শব্দার্থ", "Word Meaning", "معاني الكلمات")}</h1>
            </div>
            <SurahSelector value={selectedSurah} onChange={setSelectedSurah} />
          </div>
        </div>
      </header>

      <div className="container py-4 max-w-2xl mx-auto">
        {currentSurah && clampedPage === 0 && (
          <div className="bg-primary/5 rounded-xl p-4 mb-4 text-center space-y-1">
            <h2 className="font-arabic text-2xl text-primary">{currentSurah.name}</h2>
            <p className="text-foreground font-semibold text-sm">{language === "bn" ? currentSurah.bengaliName : currentSurah.englishName}</p>
            <div className="flex items-center justify-center gap-2 text-xs">
              <span className="text-muted-foreground">{currentSurah.numberOfAyahs} {t("আয়াত", "Ayahs", "آيات")}</span>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>
        ) : currentVerses.length > 0 ? (
          <div className="space-y-4">
            {currentVerses.map((verse) => (
              <Card key={verse.verse_key} className="p-4 space-y-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-primary/10 text-primary text-xs font-bold px-2.5 py-1 rounded-full">
                    {t(`আয়াত ${verse.verse_number}`, `Ayah ${verse.verse_number}`, `آية ${verse.verse_number}`)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 justify-end" dir="rtl">
                  {verse.words.map((word) => (
                    <div key={word.id} className="flex flex-col items-center bg-primary/5 rounded-lg px-3 py-2 min-w-[70px] hover:bg-primary/10 transition-colors">
                      <span className="font-arabic text-lg md:text-xl text-foreground leading-relaxed">{word.text_uthmani}</span>
                      {word.transliteration?.text && <span className="text-[10px] text-muted-foreground italic mt-0.5">{word.transliteration.text}</span>}
                      <span className="text-xs text-primary font-medium mt-1 text-center leading-tight">{word.translation?.text || ""}</span>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        ) : null}

        <PageNav
          currentPage={clampedPage} totalPages={totalPages}
          onPrev={() => clampedPage > 0 ? setPage(clampedPage - 1) : selectedSurah > 1 && (setSelectedSurah(selectedSurah - 1), setPage(999))}
          onNext={() => clampedPage < totalPages - 1 ? setPage(clampedPage + 1) : selectedSurah < 114 && (setSelectedSurah(selectedSurah + 1), setPage(0))}
          disablePrev={clampedPage === 0 && selectedSurah <= 1}
          disableNext={clampedPage >= totalPages - 1 && selectedSurah >= 114}
        />
        <SurahNav selectedSurah={selectedSurah} setSelectedSurah={setSelectedSurah} />
      </div>
    </div>
  );
}
