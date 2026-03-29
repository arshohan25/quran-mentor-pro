import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface AyahData {
  number: number;
  text: string;
  surah: { number: number; name: string; englishName: string };
  numberInSurah: number;
}

function getDailyAyahNumber() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return (seed % 6236) + 1; // Total ayahs in Quran
}

export default function DailyAyah() {
  const { t } = useLanguage();
  const ayahNum = getDailyAyahNumber();

  const { data, isLoading, error } = useQuery<{
    arabic: AyahData;
    bengali: string;
    english: string;
  }>({
    queryKey: ["daily-ayah", ayahNum],
    queryFn: async () => {
      const [arRes, bnRes, enRes] = await Promise.all([
        fetch(`https://api.alquran.cloud/v1/ayah/${ayahNum}/quran-uthmani`),
        fetch(`https://api.alquran.cloud/v1/ayah/${ayahNum}/bn.bengali`),
        fetch(`https://api.alquran.cloud/v1/ayah/${ayahNum}/en.sahih`),
      ]);
      const [ar, bn, en] = await Promise.all([arRes.json(), bnRes.json(), enRes.json()]);
      return {
        arabic: ar.data,
        bengali: bn.data.text,
        english: en.data.text,
      };
    },
    staleTime: 1000 * 60 * 60 * 24,
  });

  if (isLoading) {
    return (
      <div className="rounded-xl border border-accent/30 bg-accent/5 p-5 mb-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-3" />
        <div className="h-6 bg-muted rounded w-full mb-2" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    );
  }

  if (error || !data) return null;

  return (
    <div className="rounded-xl border border-accent/30 bg-gradient-to-br from-accent/10 to-primary/5 p-5 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold text-accent">
          {t("আজকের আয়াত", "Ayah of the Day", "آية اليوم")}
        </span>
      </div>

      <p className="font-arabic text-xl leading-loose text-foreground text-right mb-3" dir="rtl">
        {data.arabic.text}
      </p>

      <p className="text-sm text-muted-foreground mb-1">
        {t(data.bengali, data.english, data.arabic.text)}
      </p>

      <p className="text-xs text-muted-foreground/70 mt-2">
        — {data.arabic.surah.englishName} ({data.arabic.surah.name}), {t("আয়াত", "Ayah", "آية")} {data.arabic.numberInSurah}
      </p>
    </div>
  );
}
