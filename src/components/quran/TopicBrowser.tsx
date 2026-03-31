import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { quranTopics, type QuranTopic } from "@/data/quranTopics";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";

interface Props {
  onBack: () => void;
  onNavigateToSurah?: (surah: number) => void;
}

function useTopicAyahs(topic: QuranTopic | null) {
  return useQuery({
    queryKey: ["topicAyahs", topic?.id],
    enabled: !!topic,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      if (!topic) return [];
      const results = await Promise.all(
        topic.references.map(async (ref) => {
          const res = await fetch(`https://api.alquran.cloud/v1/ayah/${ref.surah}:${ref.ayah}/editions/quran-uthmani,bn.bengali,en.sahih`);
          const json = await res.json();
          if (json.code !== 200) return null;
          const [arabic, bengali, english] = json.data;
          return { surah: ref.surah, ayah: ref.ayah, arabic: arabic.text, bengali: bengali.text, english: english.text, surahName: arabic.surah.name, surahEnglishName: arabic.surah.englishName };
        })
      );
      return results.filter(Boolean);
    },
  });
}

export default function TopicBrowser({ onBack, onNavigateToSurah }: Props) {
  const { t, language } = useLanguage();
  const [selectedTopic, setSelectedTopic] = useState<QuranTopic | null>(null);
  const { data: ayahs, isLoading } = useTopicAyahs(selectedTopic);

  if (selectedTopic) {
    return (
      <div className="min-h-screen bg-background">
        <header className="bg-primary text-primary-foreground py-3">
          <div className="container flex items-center gap-2">
            <button onClick={() => setSelectedTopic(null)} className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-base font-bold">{selectedTopic.icon} {language === "bn" ? selectedTopic.nameBn : language === "ar" ? selectedTopic.nameAr : selectedTopic.nameEn}</h1>
              <p className="text-xs opacity-80">{selectedTopic.references.length} {t("আয়াত", "Ayahs", "آيات")}</p>
            </div>
          </div>
        </header>
        <div className="container py-4 max-w-2xl mx-auto space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          ) : ayahs?.map((a: any, i: number) => (
            <Card key={i} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-0.5 rounded-full">
                  {a.surahEnglishName} {a.surah}:{a.ayah}
                </span>
                {onNavigateToSurah && (
                  <button onClick={() => onNavigateToSurah(a.surah)} className="text-xs text-primary hover:underline">
                    {t("পড়ুন", "Read", "اقرأ")} →
                  </button>
                )}
              </div>
              <p className="font-arabic text-lg leading-[2] text-foreground" dir="rtl">{a.arabic}</p>
              <p className="text-sm text-muted-foreground border-t border-border/40 pt-2">{a.bengali}</p>
              <p className="text-sm text-muted-foreground/70">{a.english}</p>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-3">
        <div className="container flex items-center gap-2">
          <button onClick={onBack} className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></button>
          <h1 className="text-base font-bold">{t("বিষয় ভিত্তিক কুরআন", "Quran by Topic", "القرآن حسب الموضوع")}</h1>
        </div>
      </header>
      <div className="container py-4 max-w-lg mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {quranTopics.map((topic) => (
            <Card
              key={topic.id}
              onClick={() => setSelectedTopic(topic)}
              className="p-4 cursor-pointer hover:border-primary/50 hover:shadow-md transition-all text-center space-y-1"
            >
              <span className="text-2xl">{topic.icon}</span>
              <p className="font-semibold text-sm text-foreground">
                {language === "bn" ? topic.nameBn : language === "ar" ? topic.nameAr : topic.nameEn}
              </p>
              <p className="text-[10px] text-muted-foreground">{topic.references.length} {t("আয়াত", "ayahs", "آيات")}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
