import { useLanguage } from "@/contexts/LanguageContext";
import { surahList } from "@/data/surahList";
import { juzList } from "@/data/juzData";

interface Props {
  surahNumber: number;
}

export default function SurahInfoCard({ surahNumber }: Props) {
  const { t } = useLanguage();
  const surah = surahList.find((s) => s.number === surahNumber);
  if (!surah) return null;

  const juzRange = juzList.filter(
    (j) => (j.startSurah <= surahNumber && j.endSurah >= surahNumber)
  );
  const juzStr = juzRange.map((j) => j.number).join(", ");

  return (
    <div className="flex items-center gap-3 px-3 py-2 mb-3 rounded-lg bg-muted/50 text-sm">
      <div className="flex-1 space-y-0.5">
        <p className="font-semibold text-foreground">
          {surah.englishName} — {surah.englishNameTranslation}
        </p>
        <p className="text-xs text-muted-foreground">
          {surah.revelationType === "Meccan"
            ? t("মক্কায় অবতীর্ণ", "Revealed in Mecca", "مكية")
            : t("মদিনায় অবতীর্ণ", "Revealed in Medina", "مدنية")}
          {" • "}{surah.numberOfAyahs} {t("আয়াত", "Ayahs", "آيات")}
          {juzStr && ` • ${t("জুয", "Juz", "الجزء")} ${juzStr}`}
        </p>
      </div>
      <span className="text-2xl">{surah.revelationType === "Meccan" ? "🕋" : "🕌"}</span>
    </div>
  );
}
