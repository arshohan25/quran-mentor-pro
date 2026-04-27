import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { surahList } from "@/data/surahList";
import { qariList } from "@/data/prayerData";
import { useSurahWithTranslations, useSurahAudio } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { useBookmark } from "@/hooks/useBookmark";
import { useSelectedReciter } from "@/hooks/useSelectedReciter";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import SurahSelector from "./SurahSelector";
import SurahNav from "./SurahNav";
import { type QuranSectionProps } from "./types";

export default function AudioView({ selectedSurah, setSelectedSurah, onBack }: QuranSectionProps) {
  const { t, language } = useLanguage();
  const { saveLastAudio } = useBookmark();
  const { reciterId: selectedQari, setReciterId: setSelectedQari } = useSelectedReciter();
  const [currentAyah, setCurrentAyah] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data, isLoading } = useSurahWithTranslations(selectedSurah);
  const { data: audioData, isLoading: loadingAudio } = useSurahAudio(selectedSurah, selectedQari);
  const currentSurah = surahList.find((s) => s.number === selectedSurah);

  const playAyah = (index: number) => {
    if (!audioData || !audioData[index]) return;
    const audioUrl = (audioData[index] as any).audio;
    if (!audioUrl) return;
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setCurrentAyah(index);
    setIsPlaying(true);
    saveLastAudio(selectedSurah, index + 1, selectedQari);
    audio.play();
    audio.onended = () => {
      if (index < (audioData?.length || 0) - 1) playAyah(index + 1);
      else setIsPlaying(false);
    };
  };

  const togglePlay = () => {
    if (isPlaying && audioRef.current) { audioRef.current.pause(); setIsPlaying(false); }
    else playAyah(currentAyah);
  };

  const handleBack = () => {
    if (audioRef.current) audioRef.current.pause();
    setIsPlaying(false);
    onBack();
  };

  useEffect(() => { return () => { if (audioRef.current) audioRef.current.pause(); }; }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-3">
        <div className="container">
          <div className="flex items-center gap-2">
            <button onClick={handleBack} className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-base md:text-lg font-bold">{t("অডিও তেলাওয়াত", "Audio Recitation", "التلاوة الصوتية")}</h1>
          </div>
        </div>
      </header>

      <div className="container py-4 max-w-2xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <SurahSelector value={selectedSurah} onChange={(n) => { setSelectedSurah(n); setCurrentAyah(0); setIsPlaying(false); if (audioRef.current) audioRef.current.pause(); }} variant="default" />
          <Select value={selectedQari} onValueChange={(v) => { setSelectedQari(v); setIsPlaying(false); if (audioRef.current) audioRef.current.pause(); }}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {qariList.map((q) => (
                <SelectItem key={q.id} value={q.id} className="text-xs">{language === "bn" ? q.nameBn : q.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="bg-primary/5 rounded-xl p-5 mb-4 text-center">
          {currentSurah && (
            <div className="mb-3">
              <h2 className="font-arabic text-2xl text-primary">{currentSurah.name}</h2>
              <p className="text-sm text-muted-foreground">{t("আয়াত", "Ayah", "آية")} {currentAyah + 1} / {currentSurah.numberOfAyahs}</p>
            </div>
          )}
          <div className="flex items-center justify-center gap-4">
            <Button variant="outline" size="icon" disabled={currentAyah === 0} onClick={() => { const p = currentAyah - 1; setCurrentAyah(p); if (isPlaying) playAyah(p); }}>
              <SkipBack className="w-4 h-4" />
            </Button>
            <Button size="lg" className="w-14 h-14 rounded-full" onClick={togglePlay} disabled={loadingAudio}>
              {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </Button>
            <Button variant="outline" size="icon" disabled={currentAyah >= (data?.arabic.ayahs.length || 1) - 1} onClick={() => { const n = currentAyah + 1; setCurrentAyah(n); if (isPlaying) playAyah(n); }}>
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
        ) : data ? (
          <ScrollArea className="h-[calc(100vh-380px)]">
            <div className="space-y-2">
              {data.arabic.ayahs.map((ayah, idx) => (
                <button key={ayah.number} onClick={() => playAyah(idx)}
                  className={`w-full text-left rounded-lg border p-3 transition-all ${currentAyah === idx ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:bg-muted"}`}
                >
                  <div className="flex items-start gap-2">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-1 ${currentAyah === idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{ayah.numberInSurah}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-arabic text-base md:text-lg leading-relaxed text-right text-foreground break-words" dir="rtl">{ayah.text}</p>
                      <p className="text-xs text-muted-foreground mt-1 break-words">{data.bengali?.ayahs[idx]?.text}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        ) : null}

        <SurahNav selectedSurah={selectedSurah} setSelectedSurah={(n) => { setSelectedSurah(n); setCurrentAyah(0); setIsPlaying(false); if (audioRef.current) audioRef.current.pause(); }} />
      </div>
    </div>
  );
}
