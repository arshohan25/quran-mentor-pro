import { useState, useCallback, useRef, useEffect } from "react";
import { ArrowLeft, Play, Pause, Bookmark, BookmarkCheck } from "lucide-react";
import { surahList } from "@/data/surahList";
import { juzList } from "@/data/juzData";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import TajweedText from "@/components/TajweedText";
import SurahSelector from "./SurahSelector";
import ReadingSettings from "./ReadingSettings";
import AyahActions from "./AyahActions";
import { useBookmark } from "@/hooks/useBookmark";

function toArabicNum(n: number): string {
  const arabicDigits = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
  return String(n).replace(/\d/g, (d) => arabicDigits[parseInt(d)]);
}

function getJuzNumber(surahNumber: number, ayahNumber: number): number {
  for (let i = juzList.length - 1; i >= 0; i--) {
    const j = juzList[i];
    if (surahNumber > j.startSurah || (surahNumber === j.startSurah && ayahNumber >= j.startAyah)) return j.number;
  }
  return 1;
}

interface QuranSectionProps {
  selectedSurah: number;
  setSelectedSurah: (n: number) => void;
  onBack: () => void;
}

export default function ReadingView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { saveLastRead, toggleFavorite, isFavorite } = useBookmark();
  const { t, language } = useLanguage();
  const [tajweedEnabled, setTajweedEnabled] = useState(() => {
    try { return localStorage.getItem("tajweedEnabled") !== "false"; } catch { return true; }
  });
  const [arabicFontSize, setArabicFontSize] = useState(() => {
    try { return Number(localStorage.getItem("arabicFontSize")) || 22; } catch { return 22; }
  });
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleFontSizeChange = (n: number) => {
    setArabicFontSize(n);
    try { localStorage.setItem("arabicFontSize", String(n)); } catch {}
  };

  const handleTajweedToggle = () => {
    const next = !tajweedEnabled;
    setTajweedEnabled(next);
    try { localStorage.setItem("tajweedEnabled", String(next)); } catch {}
  };

  const { data, isLoading } = useSurahWithTranslations(selectedSurah);
  const surah = surahList.find(s => s.number === selectedSurah);

  // Auto-save reading position on scroll
  useEffect(() => {
    if (data?.arabic.ayahs[0]) {
      saveLastRead(selectedSurah, 1, data.arabic.ayahs[0].page, "reading");
    }
  }, [selectedSurah, data, saveLastRead]);

  const handleSurahChange = (n: number) => {
    setSelectedSurah(n);
    scrollRef.current?.scrollTo({ top: 0 });
  };

  const handlePlayAyah = useCallback((ayahNumber: number) => {
    if (playingAyah === ayahNumber) {
      audioRef.current?.pause();
      setPlayingAyah(null);
      return;
    }
    const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${data?.arabic.ayahs.find(a => a.numberInSurah === ayahNumber)?.number}.mp3`;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.play();
    setPlayingAyah(ayahNumber);
    audio.onended = () => setPlayingAyah(null);
  }, [playingAyah, data]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  const totalAyahs = data?.arabic.ayahs.length || 0;
  const currentJuz = data?.arabic.ayahs[0] ? getJuzNumber(selectedSurah, 1) : 1;

  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="bg-primary text-primary-foreground py-2.5 px-4 flex items-center justify-between shadow-md z-10">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="hover:opacity-80 transition-opacity">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <SurahSelector value={selectedSurah} onChange={handleSurahChange} />
            <div className="flex items-center gap-2 text-[10px] opacity-70">
              <span>{t("পৃষ্ঠা", "Page", "صفحة")} {data?.arabic.ayahs[0]?.page || "—"}</span>
              <span>•</span>
              <span>{t("পারা", "Juz", "الجزء")} {currentJuz}</span>
            </div>
          </div>
        </div>
        <ReadingSettings
          fontSize={arabicFontSize}
          setFontSize={handleFontSizeChange}
          tajweedEnabled={tajweedEnabled}
          onTajweedToggle={handleTajweedToggle}
        />
      </header>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto bg-background">
        {isLoading ? (
          <div className="space-y-4 p-6">
            {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}
          </div>
        ) : data && surah ? (
          <div className="max-w-3xl mx-auto">
            {/* Surah Header */}
            <div className="py-8 px-6 text-center space-y-3">
              <div className="inline-block bg-primary/5 dark:bg-primary/10 rounded-2xl px-8 py-6 w-full">
                <h1 className="font-arabic text-3xl md:text-4xl text-primary font-bold leading-relaxed">
                  سُورَةُ {surah.name}
                </h1>
                <p className="text-foreground font-semibold text-base mt-2">
                  {surah.number}. {surah.englishName}
                </p>
                <p className="text-muted-foreground text-sm">
                  {language === "bn" ? surah.bengaliName : surah.englishNameTranslation}
                </p>
                <div className="flex items-center justify-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className={`px-2.5 py-1 rounded-full font-medium ${
                    surah.revelationType === "Meccan"
                      ? "bg-accent/15 text-accent"
                      : "bg-primary/15 text-primary"
                  }`}>
                    {surah.revelationType === "Meccan" ? t("মক্কী", "Meccan", "مكية") : t("মাদানী", "Medinan", "مدنية")}
                  </span>
                  <span>{totalAyahs} {t("আয়াত", "Ayahs", "آيات")}</span>
                </div>
              </div>

              {/* Bismillah */}
              {selectedSurah !== 9 && selectedSurah !== 1 && (
                <div className="py-4">
                  <p className="font-arabic text-2xl md:text-3xl text-primary/80 leading-relaxed font-bold">
                    بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    {t(
                      "পরম করুণাময়, অতি দয়ালু আল্লাহর নামে",
                      "In the name of Allah, the Most Gracious, the Most Merciful",
                      "بسم الله الرحمن الرحيم"
                    )}
                  </p>
                </div>
              )}
            </div>

            {/* Ayah list */}
            <div className="divide-y divide-border">
              {data.arabic.ayahs.map((ayah, idx) => {
                const bengaliAyah = data.bengali.ayahs[idx];
                const isPlaying = playingAyah === ayah.numberInSurah;
                const favorited = isFavorite(selectedSurah, ayah.numberInSurah);

                return (
                  <div key={ayah.number} className="group hover:bg-muted/30 transition-colors">
                    {/* Action bar */}
                    <div className="flex items-center justify-between px-4 md:px-6 pt-3 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary/10 text-primary text-xs font-bold">
                          {selectedSurah}:{ayah.numberInSurah}
                        </span>
                        <button
                          onClick={() => handlePlayAyah(ayah.numberInSurah)}
                          className="p-1.5 rounded-full hover:bg-primary/10 transition-colors"
                          title={t("চালান", "Play", "تشغيل")}
                        >
                          {isPlaying
                            ? <Pause className="w-4 h-4 text-primary" />
                            : <Play className="w-4 h-4 text-muted-foreground" />
                          }
                        </button>
                        <button
                          onClick={() => toggleFavorite(selectedSurah, ayah.numberInSurah)}
                          className="p-1.5 rounded-full hover:bg-primary/10 transition-colors"
                          title={t("বুকমার্ক", "Bookmark", "علامة")}
                        >
                          {favorited
                            ? <BookmarkCheck className="w-4 h-4 text-accent" />
                            : <Bookmark className="w-4 h-4 text-muted-foreground" />
                          }
                        </button>
                      </div>
                      <AyahActions
                        arabicText={ayah.text}
                        translation={bengaliAyah?.text}
                        surahName={surah.name}
                        surahNumber={selectedSurah}
                        ayahNumber={ayah.numberInSurah}
                      />
                    </div>

                    {/* Arabic text */}
                    <div className="px-4 md:px-6 py-3" dir="rtl">
                      <p className="font-arabic text-foreground leading-[2.4] text-right"
                         style={{ fontSize: `${arabicFontSize}px` }}>
                        {tajweedEnabled ? (
                          <TajweedText text={ayah.text} enabled={true} className="inline" />
                        ) : (
                          <span>{ayah.text}</span>
                        )}
                        <span className="inline-flex items-center justify-center mx-1 text-primary font-bold align-middle"
                              style={{ fontSize: `${Math.max(12, arabicFontSize - 6)}px`, fontFamily: 'serif' }}>
                          ﴿{toArabicNum(ayah.numberInSurah)}﴾
                        </span>
                      </p>
                    </div>

                    {/* Bengali translation */}
                    {bengaliAyah && (
                      <div className="px-4 md:px-6 pb-4">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {bengaliAyah.text}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Surah navigation */}
            <div className="flex items-center justify-between px-4 py-6">
              {selectedSurah > 1 ? (
                <button
                  onClick={() => handleSurahChange(selectedSurah - 1)}
                  className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  ← {surahList.find(s => s.number === selectedSurah - 1)?.englishName}
                </button>
              ) : <div />}
              {selectedSurah < 114 ? (
                <button
                  onClick={() => handleSurahChange(selectedSurah + 1)}
                  className="px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
                >
                  {surahList.find(s => s.number === selectedSurah + 1)?.englishName} →
                </button>
              ) : <div />}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
