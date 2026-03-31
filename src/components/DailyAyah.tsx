import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
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
  return (seed % 6236) + 1;
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
      <div className="islamic-card p-5 mb-6 animate-pulse">
        <div className="h-4 bg-muted rounded w-1/3 mb-3" />
        <div className="h-6 bg-muted rounded w-full mb-2" />
        <div className="h-4 bg-muted rounded w-2/3" />
      </div>
    );
  }

  if (error || !data) return null;

  return (
    <div className="islamic-card p-5 mb-6 relative overflow-hidden">
      {/* Corner ornaments */}
      <span className="corner-ornament top-0 right-0 border-t-2 border-r-2 rounded-tr-lg" />
      <span className="corner-ornament top-0 left-0 border-t-2 border-l-2 rounded-tl-lg" />
      <span className="corner-ornament bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg" />
      <span className="corner-ornament bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg" />

      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-accent" />
        <span className="text-sm font-semibold text-accent">
          {t("আজকের আয়াত", "Ayah of the Day", "آية اليوم")}
        </span>
      </div>

      <p className="font-arabic text-xl leading-loose text-foreground text-right mb-3" dir="rtl">
        {data.arabic.text}
      </p>

      <div className="gold-divider my-3">
        <span className="text-accent/40 text-xs">✦</span>
      </div>

      <p className="text-sm text-muted-foreground mb-1">
        {t(data.bengali, data.english, data.arabic.text)}
      </p>

      <p className="text-xs text-muted-foreground/70 mt-2 inline-flex items-center gap-1 bg-accent/10 px-2 py-1 rounded-md">
        — {data.arabic.surah.englishName} ({data.arabic.surah.name}), {t("আয়াত", "Ayah", "آية")} {data.arabic.numberInSurah}
      </p>
    </div>
  );
}
