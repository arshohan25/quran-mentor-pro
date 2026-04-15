import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mic, MicOff, ChevronLeft, ChevronRight, AlertCircle, CheckCircle2, Sparkles } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useArabicRecitationEngine } from "@/hooks/useArabicRecitationEngine";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { surahList } from "@/data/surahList";
import type { MatchMode } from "@/utils/arabicUtils";

export default function SabinaPage() {
  const { t, language } = useLanguage();
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [currentAyah, setCurrentAyah] = useState(1);
  const [sensitivityMode, setSensitivityMode] = useState<MatchMode>("balanced");
  const [completedCount, setCompletedCount] = useState(0);

  const { data, isLoading } = useSurahWithTranslations(selectedSurah);
  const surahData = data?.arabic;
  const totalAyahs = surahData?.ayahs?.length ?? 0;
  const ayahText = surahData?.ayahs?.[currentAyah - 1]?.text ?? "";

  const handleComplete = () => {
    setCompletedCount((c) => c + 1);
    // Auto-advance to next ayah
    if (currentAyah < totalAyahs) {
      setTimeout(() => setCurrentAyah((a) => a + 1), 800);
    }
  };

  const { state, toggleListening, stopListening } = useArabicRecitationEngine(
    ayahText,
    sensitivityMode,
    handleComplete
  );

  const { words, revealedIndex, errorIndex, isListening, lastSpoken, speechError, totalWords } = state;
  const progressPercent = totalWords > 0 ? (revealedIndex / totalWords) * 100 : 0;

  // Reset completed count when surah changes
  useEffect(() => {
    setCurrentAyah(1);
    setCompletedCount(0);
    stopListening();
  }, [selectedSurah, stopListening]);

  const surahInfo = surahList.find((s) => s.number === selectedSurah);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/20 to-background px-4 pt-4 pb-6">
        <div className="flex items-center justify-between mb-4">
          <Link to="/" className="p-2 rounded-full hover:bg-primary/10 transition">
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <h1 className="text-xl font-bold text-foreground font-arabic">
              {t("সবিনা", "Sabina", "سبينا")}
            </h1>
          </div>
          <div className="w-9" />
        </div>
        <p className="text-center text-sm text-muted-foreground">
          {t(
            "তেলাওয়াত করুন, সবিনা শুনবে ও সংশোধন করবে",
            "Recite and Sabina will listen & correct you",
            "اقرأ وسبينا ستستمع وتصحح لك"
          )}
        </p>
      </div>

      {/* Controls */}
      <div className="px-4 space-y-3">
        {/* Surah + Sensitivity Row */}
        <div className="flex gap-2">
          <Select value={String(selectedSurah)} onValueChange={(v) => setSelectedSurah(Number(v))}>
            <SelectTrigger className="flex-1 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-60">
              {surahList.map((s) => (
                <SelectItem key={s.number} value={String(s.number)} className="text-xs">
                  {s.number}. {language === "bn" ? s.bengaliName : language === "ar" ? s.name : s.englishName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sensitivityMode} onValueChange={(v) => setSensitivityMode(v as MatchMode)}>
            <SelectTrigger className="w-28 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="strict" className="text-xs">{t("কঠিন", "Strict", "صارم")}</SelectItem>
              <SelectItem value="balanced" className="text-xs">{t("মাঝারি", "Balanced", "متوازن")}</SelectItem>
              <SelectItem value="assist" className="text-xs">{t("সহজ", "Assist", "مساعد")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Ayah Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={currentAyah <= 1}
            onClick={() => setCurrentAyah((a) => a - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">
            {t("আয়াত", "Ayah", "آية")} {currentAyah} / {totalAyahs || "..."}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={currentAyah >= totalAyahs}
            onClick={() => setCurrentAyah((a) => a + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Main Recitation Area */}
      <div className="flex-1 px-4 py-6 flex flex-col items-center justify-center">
        {isLoading ? (
          <div className="text-muted-foreground text-sm animate-pulse">
            {t("লোড হচ্ছে...", "Loading...", "جاري التحميل...")}
          </div>
        ) : (
          <div className="w-full max-w-lg space-y-6">
            {/* Arabic Words Display */}
            <div className="flex flex-wrap gap-x-3 gap-y-2 justify-center p-4 rounded-2xl bg-card border border-border min-h-[120px] items-center" dir="rtl">
              {words.map((word, i) => {
                const isRevealed = i < revealedIndex;
                const isCurrent = i === revealedIndex;
                const isError = errorIndex === i;

                return (
                  <span
                    key={`${currentAyah}-${i}`}
                    className={`font-arabic text-2xl md:text-3xl transition-all duration-300 px-1 py-0.5 rounded ${
                      isRevealed
                        ? "text-primary"
                        : isError
                        ? "text-destructive bg-destructive/15 animate-pulse"
                        : isCurrent
                        ? "text-foreground font-bold border-b-2 border-primary"
                        : "text-muted-foreground/15 select-none"
                    }`}
                    style={
                      !isRevealed && !isError && !isCurrent
                        ? { filter: "blur(6px)", userSelect: "none" }
                        : undefined
                    }
                  >
                    {word}
                  </span>
                );
              })}
              {words.length === 0 && (
                <span className="text-muted-foreground text-sm">
                  {t("আয়াত লোড হচ্ছে...", "Loading ayah...", "جاري تحميل الآية...")}
                </span>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <Progress value={progressPercent} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{revealedIndex}/{totalWords} {t("শব্দ", "words", "كلمات")}</span>
                <span>{completedCount} {t("আয়াত সম্পন্ন", "ayahs done", "آيات مكتملة")}</span>
              </div>
            </div>

            {/* Error / Status Feedback */}
            {errorIndex !== null && (
              <div className="flex items-center gap-2 justify-center text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium">
                  {t("ভুল হয়েছে! সঠিকভাবে পড়ুন", "Wrong! Read correctly", "خطأ! اقرأ بشكل صحيح")}
                </p>
              </div>
            )}

            {revealedIndex > 0 && revealedIndex === totalWords && (
              <div className="flex items-center gap-2 justify-center text-primary bg-primary/10 rounded-lg px-3 py-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <p className="text-sm font-medium">
                  {t("সঠিক! পরবর্তী আয়াতে যাচ্ছে...", "Correct! Moving to next...", "صحيح! الانتقال إلى التالي...")}
                </p>
              </div>
            )}

            {speechError && (
              <p className="text-center text-xs text-muted-foreground">{speechError}</p>
            )}

            {lastSpoken && isListening && (
              <p className="text-center text-xs text-muted-foreground/60 truncate" dir="rtl">🎤 {lastSpoken}</p>
            )}
          </div>
        )}
      </div>

      {/* Mic Button */}
      <div className="px-4 pb-20 flex justify-center">
        <button
          onClick={toggleListening}
          disabled={isLoading || !ayahText}
          className={`w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg ${
            isListening
              ? "bg-destructive text-destructive-foreground animate-pulse scale-110"
              : "bg-primary text-primary-foreground hover:scale-105"
          } disabled:opacity-40 disabled:scale-100`}
        >
          {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
        </button>
      </div>
    </div>
  );
}
