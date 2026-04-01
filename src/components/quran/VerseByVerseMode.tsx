import { useRef, useEffect, useState } from "react";
import { surahList } from "@/data/surahList";
import { useLanguage } from "@/contexts/LanguageContext";
import TajweedText from "@/components/TajweedText";
import AyahActions from "./AyahActions";
import { useBookmark } from "@/hooks/useBookmark";

function toArabicNum(n: number): string {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).replace(/\d/g, (d) => arabicDigits[parseInt(d)]);
}

interface AyahData {
  number: number;
  numberInSurah: number;
  text: string;
  page: number;
  juz: number;
  bengaliText: string;
  englishText: string;
}

interface Props {
  selectedSurah: number;
  setSelectedSurah: (n: number) => void;
  ayahs: AyahData[];
  tajweedEnabled: boolean;
  arabicFontSize: number;
  onProgressChange: (pct: number) => void;
}

export default function VerseByVerseMode({ selectedSurah, setSelectedSurah, ayahs, tajweedEnabled, arabicFontSize, onProgressChange }: Props) {
  const { t } = useLanguage();
  const { isFavorite, toggleFavorite } = useBookmark();
  const scrollRef = useRef<HTMLDivElement>(null);
  const surah = surahList.find(s => s.number === selectedSurah);

  // Scroll progress
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handleScroll = () => {
      const pct = el.scrollHeight <= el.clientHeight ? 100 : Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
      onProgressChange(pct);
    };
    el.addEventListener("scroll", handleScroll, { passive: true });
    return () => el.removeEventListener("scroll", handleScroll);
  }, [ayahs, onProgressChange]);

  const handleSurahChange = (n: number) => {
    setSelectedSurah(n);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto">
      {/* Surah intro header */}
      <div className="bg-gradient-to-b from-[#008374]/5 to-transparent dark:from-[#008374]/10 py-6 px-4 text-center border-b border-border">
        <div className="inline-block px-6 py-3 rounded-2xl bg-[#008374]/5 dark:bg-[#008374]/10 mb-3">
          <p className="font-arabic text-2xl md:text-3xl font-bold text-foreground">{surah?.name}</p>
        </div>
        <p className="text-sm font-semibold text-foreground">{selectedSurah}. {surah?.englishName}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {surah?.englishNameTranslation} · {surah?.numberOfAyahs} {t("আয়াত", "Verses", "آيات")} · {surah?.revelationType === "Meccan" ? t("মক্কী", "Meccan", "مكية") : t("মাদানী", "Medinan", "مدنية")}
        </p>

        {selectedSurah !== 9 && (
          <div className="mt-4 pt-4 border-t border-border/50">
            <p className="font-arabic text-xl md:text-2xl text-foreground font-bold leading-relaxed">
              بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {t("পরম করুণাময় অতি দয়ালু আল্লাহর নামে", "In the Name of Allah, the Most Compassionate, Most Merciful", "بسم الله الرحمن الرحيم")}
            </p>
          </div>
        )}
      </div>

      {/* Ayah list */}
      <div className="divide-y divide-border">
        {ayahs.map((ayah) => {
          const bookmarked = isFavorite(selectedSurah, ayah.numberInSurah);
          return (
            <div key={ayah.number} className="px-4 py-3 hover:bg-accent/5 transition-colors">
              <AyahActions
                arabicText={ayah.text}
                translation={ayah.bengaliText || ayah.englishText}
                surahName={surah?.englishName}
                surahNumber={selectedSurah}
                ayahNumber={ayah.numberInSurah}
                onBookmark={() => toggleFavorite(selectedSurah, ayah.numberInSurah)}
                isBookmarked={bookmarked}
              />
              <div className="mt-3 text-right" dir="rtl">
                <p className="font-arabic font-bold text-foreground leading-[2.2]" style={{ fontSize: `${arabicFontSize}px` }}>
                  {tajweedEnabled ? (
                    <TajweedText text={ayah.text} enabled={true} className="inline" />
                  ) : (
                    <span>{ayah.text}</span>
                  )}
                  <span className="inline-flex items-center justify-center mx-1 text-[#008374] dark:text-[#4ECDC4] font-bold select-none align-middle"
                        style={{ fontSize: `${Math.max(12, arabicFontSize - 6)}px`, fontFamily: 'serif' }}>
                    ﴿{toArabicNum(ayah.numberInSurah)}﴾
                  </span>
                </p>
              </div>
              {(ayah.bengaliText || ayah.englishText) && (
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {ayah.bengaliText || ayah.englishText}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Surah navigation */}
      <div className="flex items-center justify-between px-4 py-4 border-t border-border bg-muted/30">
        {selectedSurah > 1 && (
          <button onClick={() => handleSurahChange(selectedSurah - 1)} className="text-xs text-[#008374] dark:text-[#4ECDC4] font-medium hover:underline">
            ← {surahList.find(s => s.number === selectedSurah - 1)?.englishName}
          </button>
        )}
        <div className="flex-1" />
        {selectedSurah < 114 && (
          <button onClick={() => handleSurahChange(selectedSurah + 1)} className="text-xs text-[#008374] dark:text-[#4ECDC4] font-medium hover:underline">
            {surahList.find(s => s.number === selectedSurah + 1)?.englishName} →
          </button>
        )}
      </div>
    </div>
  );
}
