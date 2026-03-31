import { surahList } from "@/data/surahList";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  surahNumber: number;
  showBismillah?: boolean;
}

export default function SurahHeader({ surahNumber, showBismillah = true }: Props) {
  const { t, language } = useLanguage();
  const surah = surahList.find((s) => s.number === surahNumber);
  if (!surah) return null;

  return (
    <div className="bg-primary/5 rounded-xl p-4 md:p-5 mb-4 text-center space-y-2">
      <h2 className="font-arabic text-2xl md:text-3xl text-primary">{surah.name}</h2>
      <p className="text-foreground font-semibold text-sm">
        {language === "bn" ? surah.bengaliName : surah.englishName}
      </p>
      <div className="flex items-center justify-center gap-2 text-xs flex-wrap">
        <span className={`px-2.5 py-1 rounded-full font-medium ${
          surah.revelationType === "Meccan" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"
        }`}>
          {surah.revelationType === "Meccan" ? t("মক্কী", "Meccan", "مكية") : t("মাদানী", "Medinan", "مدنية")}
        </span>
        <span className="text-muted-foreground">
          {surah.numberOfAyahs} {t("আয়াত", "Ayahs", "آيات")}
        </span>
      </div>
      {showBismillah && surah.number !== 9 && (
        <div className="pt-2">
          <p className="font-arabic text-xl md:text-2xl text-primary/80 leading-relaxed">
            بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
          </p>
        </div>
      )}
    </div>
  );
}
