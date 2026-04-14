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
    <div className="mb-2 text-center">
      {/* Ornamental frame */}
      <div className="relative border-2 rounded-lg px-3 py-2 mx-auto max-w-[90%]"
        style={{
          borderColor: 'hsl(var(--gold) / 0.4)',
          background: 'hsl(var(--primary) / 0.04)',
        }}
      >
        {/* Corner ornaments */}
        <span className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 rounded-tl-sm" style={{ borderColor: 'hsl(var(--gold) / 0.6)' }} />
        <span className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 rounded-tr-sm" style={{ borderColor: 'hsl(var(--gold) / 0.6)' }} />
        <span className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 rounded-bl-sm" style={{ borderColor: 'hsl(var(--gold) / 0.6)' }} />
        <span className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 rounded-br-sm" style={{ borderColor: 'hsl(var(--gold) / 0.6)' }} />

        <h2 className="font-arabic text-xl text-primary leading-tight">{surah.name}</h2>
        <p className="text-foreground font-semibold text-[11px] leading-tight mt-0.5">
          {language === "bn" ? surah.bengaliName : surah.englishName}
        </p>
        <div className="flex items-center justify-center gap-1.5 text-[10px] mt-0.5">
          <span className={`px-1.5 py-0.5 rounded-full font-medium ${
            surah.revelationType === "Meccan" ? "bg-accent/15 text-accent" : "bg-primary/15 text-primary"
          }`}>
            {surah.revelationType === "Meccan" ? t("মক্কী", "Meccan", "مكية") : t("মাদানী", "Medinan", "مدنية")}
          </span>
          <span className="text-muted-foreground">
            {surah.numberOfAyahs} {t("আয়াত", "Ayahs", "آيات")}
          </span>
        </div>
      </div>

      {showBismillah && surah.number !== 9 && (
        <p className="font-arabic text-lg text-primary/80 leading-tight mt-1.5">
          بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
        </p>
      )}
    </div>
  );
}
