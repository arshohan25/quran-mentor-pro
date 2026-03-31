import { useState, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Mic, MicOff, RotateCcw } from "lucide-react";
import { surahList } from "@/data/surahList";
import { useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface ComparisonResult {
  original: string;
  recognized: string;
  matches: { word: string; correct: boolean }[];
}

function compareTexts(original: string, recognized: string): ComparisonResult {
  const origWords = original.replace(/[^\u0600-\u06FF\s]/g, "").trim().split(/\s+/);
  const recWords = recognized.replace(/[^\u0600-\u06FF\s]/g, "").trim().split(/\s+/);

  const matches = origWords.map((word, i) => ({
    word,
    correct: recWords[i] ? normalizeArabic(word) === normalizeArabic(recWords[i]) : false,
  }));

  return { original, recognized, matches };
}

function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .trim();
}

export default function PracticePage() {
  const { t } = useLanguage();
  const [selectedSurah, setSelectedSurah] = useState(1);
  const [currentAyah, setCurrentAyah] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [recognizedText, setRecognizedText] = useState("");
  const recognitionRef = useRef<any>(null);

  const { data, isLoading } = useSurahWithTranslations(selectedSurah);

  const startRecording = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t("আপনার ব্রাউজার ভয়েস রিকগনিশন সাপোর্ট করে না।", "Your browser does not support speech recognition.", "متصفحك لا يدعم التعرف على الصوت."));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ar-SA";
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setRecognizedText(transcript);
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setResult(null);
    setRecognizedText("");
  }, [t]);

  const stopRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);

    if (data && recognizedText) {
      const ayahText = data.arabic.ayahs[currentAyah]?.text || "";
      setResult(compareTexts(ayahText, recognizedText));
    }
  }, [data, currentAyah, recognizedText]);

  const resetPractice = () => {
    setResult(null);
    setRecognizedText("");
  };

  const currentSurahInfo = surahList.find((s) => s.number === selectedSurah);
  const totalAyahs = data?.arabic.ayahs.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80"><ArrowLeft className="w-5 h-5" /></Link>
            <h1 className="text-xl font-bold">{t("প্র্যাকটিস", "Practice", "تدرب")}</h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="container py-6 max-w-2xl">
        {/* Surah & Ayah selection */}
        <div className="flex gap-3 mb-6">
          <Select value={selectedSurah.toString()} onValueChange={(v) => { setSelectedSurah(Number(v)); setCurrentAyah(0); resetPractice(); }}>
            <SelectTrigger className="flex-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {surahList.map((s) => (
                <SelectItem key={s.number} value={s.number.toString()}>
                  {s.number}. {s.bengaliName} - {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Ayah navigation */}
        {totalAyahs > 0 && (
          <div className="flex items-center justify-between mb-4">
            <Button size="sm" variant="outline" disabled={currentAyah === 0} onClick={() => { setCurrentAyah((p) => p - 1); resetPractice(); }}>
              {t("পূর্ববর্তী", "Previous", "السابق")}
            </Button>
            <span className="text-sm text-muted-foreground">
              {t("আয়াত", "Ayah", "آية")} {currentAyah + 1} / {totalAyahs}
            </span>
            <Button size="sm" variant="outline" disabled={currentAyah >= totalAyahs - 1} onClick={() => { setCurrentAyah((p) => p + 1); resetPractice(); }}>
              {t("পরবর্তী", "Next", "التالي")}
            </Button>
          </div>
        )}

        {/* Current Ayah */}
        {isLoading ? (
          <Skeleton className="h-32 rounded-xl" />
        ) : data ? (
          <div className="rounded-xl border border-border bg-card p-6 mb-6">
            <p className="font-arabic text-2xl md:text-3xl leading-loose text-foreground text-right mb-4">
              {result
                ? result.matches.map((m, i) => (
                    <span key={i} className={m.correct ? "text-success" : "text-destructive underline decoration-2"}>
                      {m.word}{" "}
                    </span>
                  ))
                : data.arabic.ayahs[currentAyah]?.text}
            </p>

            <div className="border-t border-border pt-3">
              <p className="text-sm text-muted-foreground">
                {data.bengali.ayahs[currentAyah]?.text}
              </p>
            </div>
          </div>
        ) : null}

        {/* Recording controls */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center transition-all ${
              isRecording
                ? "bg-destructive text-destructive-foreground animate-pulse-glow"
                : "bg-primary text-primary-foreground hover:scale-105"
            }`}
          >
            {isRecording ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>
          <p className="text-sm text-muted-foreground">
            {isRecording
              ? t("রেকর্ডিং চলছে... থামাতে চাপুন", "Recording... tap to stop", "جاري التسجيل... اضغط للإيقاف")
              : t("তেলাওয়াত শুরু করতে চাপুন", "Tap to start reciting", "اضغط للبدء")}
          </p>

          {recognizedText && !isRecording && (
            <div className="w-full rounded-lg bg-muted p-4">
              <p className="text-xs text-muted-foreground mb-1">{t("আপনি যা পড়েছেন:", "What you recited:", "ما قرأته:")}</p>
              <p className="font-arabic text-lg text-right text-foreground">{recognizedText}</p>
            </div>
          )}

          {result && (
            <div className="w-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground">
                  {t("ফলাফল", "Result", "النتيجة")}
                </span>
                <span className="text-sm text-muted-foreground">
                  {result.matches.filter((m) => m.correct).length}/{result.matches.length}{" "}
                  {t("সঠিক", "correct", "صحيح")}
                </span>
              </div>
              <div className="flex gap-1">
                <span className="inline-flex items-center gap-1 text-xs"><span className="w-3 h-3 rounded-full bg-success inline-block" /> {t("সঠিক", "Correct", "صحيح")}</span>
                <span className="inline-flex items-center gap-1 text-xs ml-3"><span className="w-3 h-3 rounded-full bg-destructive inline-block" /> {t("ভুল", "Wrong", "خطأ")}</span>
              </div>
              <Button variant="outline" size="sm" className="mt-3" onClick={resetPractice}>
                <RotateCcw className="w-4 h-4 mr-1" /> {t("আবার চেষ্টা করুন", "Try Again", "حاول مرة أخرى")}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
