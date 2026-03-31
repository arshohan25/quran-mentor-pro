import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { juzList } from "@/data/juzData";
import { surahList } from "@/data/surahList";
import { Card } from "@/components/ui/card";

interface Props {
  onBack: () => void;
  onNavigateToSurah: (surah: number) => void;
}

export default function JuzBrowser({ onBack, onNavigateToSurah }: Props) {
  const { t, language } = useLanguage();

  const getSurahName = (num: number) => {
    const s = surahList.find((s) => s.number === num);
    return language === "bn" ? s?.bengaliName : s?.englishName;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-3">
        <div className="container flex items-center gap-2">
          <button onClick={onBack} className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-base font-bold">{t("জুয ব্রাউজার", "Juz Browser", "تصفح الأجزاء")}</h1>
        </div>
      </header>
      <div className="container py-4 max-w-lg mx-auto space-y-2">
        {juzList.map((juz) => (
          <Card
            key={juz.number}
            onClick={() => onNavigateToSurah(juz.startSurah)}
            className="p-3 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
              {juz.number}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-arabic text-base text-foreground font-bold" dir="rtl">{juz.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {language === "bn" ? juz.nameBn : juz.nameEn} • {getSurahName(juz.startSurah)} → {getSurahName(juz.endSurah)}
              </p>
            </div>
            <span className="text-xs text-muted-foreground/60 shrink-0">
              {juz.startSurah}:{juz.startAyah}
            </span>
          </Card>
        ))}
      </div>
    </div>
  );
}
