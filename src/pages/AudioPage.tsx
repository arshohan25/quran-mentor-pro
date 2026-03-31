import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { surahList } from "@/data/surahList";
import { qariList } from "@/data/prayerData";
import { useSurahWithTranslations, useSurahAudio } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBookmark } from "@/hooks/useBookmark";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function AudioPage() {
  const { t, language } = useLanguage();
  const { saveLastAudio } = useBookmark();
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [selectedQari, setSelectedQari] = useState(qariList[0].id);
  const [currentAyah, setCurrentAyah] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: surahData, isLoading: loadingSurah } = useSurahWithTranslations(selectedSurah);
  const { data: audioData, isLoading: loadingAudio } = useSurahAudio(selectedSurah, selectedQari);

  const playAyah = (index: number) => {
    if (!audioData || !audioData[index]) return;
    const audioUrl = (audioData[index] as any).audio;
    if (!audioUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setCurrentAyah(index);
    setIsPlaying(true);
    saveLastAudio(selectedSurah, index + 1, selectedQari);

    audio.play();
    audio.onended = () => {
      if (index < (audioData?.length || 0) - 1) {
        playAyah(index + 1);
      } else {
        setIsPlaying(false);
      }
    };
  };

  const togglePlay = () => {
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      playAyah(currentAyah);
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const currentSurahInfo = surahList.find((s) => s.number === selectedSurah);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-xl font-bold">{t("অডিও তেলাওয়াত", "Audio Recitation", "الاستماع")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="container py-6 max-w-2xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <Select value={selectedSurah.toString()} onValueChange={(v) => { setSelectedSurah(Number(v)); setCurrentAyah(0); setIsPlaying(false); if (audioRef.current) audioRef.current.pause(); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {surahList.map((s) => (
                <SelectItem key={s.number} value={s.number.toString()}>
                  {s.number}. {language === "bn" ? s.bengaliName : s.englishName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedQari} onValueChange={(v) => { setSelectedQari(v); setIsPlaying(false); if (audioRef.current) audioRef.current.pause(); }}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {qariList.map((q) => (
                <SelectItem key={q.id} value={q.id}>
                  {language === "bn" ? q.nameBn : q.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Player controls */}
        <div className="bg-primary/5 rounded-xl p-4 sm:p-6 mb-6 text-center">
          {currentSurahInfo && (
            <div className="mb-4">
              <h2 className="font-arabic text-2xl text-primary">{currentSurahInfo.name}</h2>
              <p className="text-sm text-muted-foreground">
                {t("আয়াত", "Ayah", "آية")} {currentAyah + 1} / {currentSurahInfo.numberOfAyahs}
              </p>
            </div>
          )}
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" disabled={currentAyah === 0} onClick={() => { setCurrentAyah((p) => p - 1); if (isPlaying) playAyah(currentAyah - 1); }}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button
              size="lg"
              className="w-14 h-14 rounded-full"
              onClick={togglePlay}
              disabled={loadingAudio}
            >
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </Button>
            <Button variant="outline" size="icon" disabled={currentAyah >= (surahData?.arabic.ayahs.length || 1) - 1} onClick={() => { setCurrentAyah((p) => p + 1); if (isPlaying) playAyah(currentAyah + 1); }}>
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Ayah list */}
        {loadingSurah ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
        ) : surahData ? (
          <ScrollArea className="h-[calc(100vh-380px)] min-h-[200px]">
            <div className="space-y-3">
              {surahData.arabic.ayahs.map((ayah, idx) => (
                <button
                  key={ayah.number}
                  onClick={() => playAyah(idx)}
                  className={`w-full text-left rounded-lg border p-4 transition-all ${
                    currentAyah === idx
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border bg-card hover:bg-muted"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                      currentAyah === idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}>
                      {ayah.numberInSurah}
                    </span>
                    <div className="flex-1">
                      <p className="font-arabic text-lg leading-relaxed text-right text-foreground">{ayah.text}</p>
                      <p className="text-xs text-muted-foreground mt-1">{surahData.bengali.ayahs[idx]?.text}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        ) : null}
      </div>
    </div>
  );
}
