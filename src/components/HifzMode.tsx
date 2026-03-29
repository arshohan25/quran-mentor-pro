import { useState, useCallback, useEffect } from "react";
import { Eye, EyeOff, CheckCircle2, RotateCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import TajweedText from "@/components/TajweedText";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Ayah {
  number: number;
  numberInSurah: number;
  text: string;
}

interface HifzModeProps {
  arabicAyahs: Ayah[];
  bengaliAyahs: Ayah[];
  englishAyahs: Ayah[];
  surahNumber: number;
  tajweedEnabled: boolean;
}

type RevealLevel = "hidden" | "first-word" | "half" | "full";

export default function HifzMode({ arabicAyahs, bengaliAyahs, englishAyahs, surahNumber, tajweedEnabled }: HifzModeProps) {
  const { t } = useLanguage();
  const [currentAyah, setCurrentAyah] = useState(0);
  const [revealLevel, setRevealLevel] = useState<RevealLevel>("hidden");
  const [memorized, setMemorized] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem(`hifz-${surahNumber}`);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  useEffect(() => {
    setCurrentAyah(0);
    setRevealLevel("hidden");
    try {
      const saved = localStorage.getItem(`hifz-${surahNumber}`);
      setMemorized(saved ? new Set(JSON.parse(saved)) : new Set());
    } catch { setMemorized(new Set()); }
  }, [surahNumber]);

  useEffect(() => {
    localStorage.setItem(`hifz-${surahNumber}`, JSON.stringify([...memorized]));
  }, [memorized, surahNumber]);

  const ayah = arabicAyahs[currentAyah];
  if (!ayah) return null;

  const words = ayah.text.split(/\s+/);
  const totalWords = words.length;

  const getVisibleText = () => {
    switch (revealLevel) {
      case "hidden": return "";
      case "first-word": return words.slice(0, Math.max(1, Math.ceil(totalWords * 0.2))).join(" ");
      case "half": return words.slice(0, Math.ceil(totalWords * 0.5)).join(" ");
      case "full": return ayah.text;
    }
  };

  const cycleReveal = () => {
    const levels: RevealLevel[] = ["hidden", "first-word", "half", "full"];
    const idx = levels.indexOf(revealLevel);
    setRevealLevel(levels[(idx + 1) % levels.length]);
  };

  const toggleMemorized = () => {
    setMemorized(prev => {
      const next = new Set(prev);
      if (next.has(ayah.numberInSurah)) next.delete(ayah.numberInSurah);
      else next.add(ayah.numberInSurah);
      return next;
    });
  };

  const goNext = () => {
    if (currentAyah < arabicAyahs.length - 1) {
      setCurrentAyah(currentAyah + 1);
      setRevealLevel("hidden");
    }
  };

  const goPrev = () => {
    if (currentAyah > 0) {
      setCurrentAyah(currentAyah - 1);
      setRevealLevel("hidden");
    }
  };

  const progress = arabicAyahs.length > 0
    ? Math.round((memorized.size / arabicAyahs.length) * 100)
    : 0;

  const visibleText = getVisibleText();

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-foreground">
            {t("হিফজ অগ্রগতি", "Hifz Progress", "تقدم الحفظ")}
          </span>
          <span className="text-xs text-muted-foreground">
            {memorized.size}/{arabicAyahs.length} ({progress}%)
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          disabled={currentAyah === 0}
          className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </button>
        <span className="text-sm font-medium text-foreground">
          {t("আয়াত", "Ayah", "آية")} {ayah.numberInSurah} / {arabicAyahs.length}
        </span>
        <button
          onClick={goNext}
          disabled={currentAyah === arabicAyahs.length - 1}
          className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </button>
      </div>

      {/* Main card */}
      <div className="rounded-xl border border-border bg-card p-6 min-h-[200px] flex flex-col items-center justify-center">
        {revealLevel === "hidden" ? (
          <div className="text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <EyeOff className="w-8 h-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm">
              {t("আয়াতটি মনে করার চেষ্টা করুন, তারপর ট্যাপ করুন", "Try to recall, then tap to reveal", "حاول التذكر ثم اضغط للكشف")}
            </p>
          </div>
        ) : (
          <div className="w-full text-center space-y-3">
            <TajweedText
              text={visibleText}
              enabled={tajweedEnabled}
              className="font-arabic text-2xl md:text-3xl leading-loose text-foreground"
            />
            {revealLevel !== "full" && (
              <p className="text-xs text-muted-foreground">
                {revealLevel === "first-word"
                  ? t("প্রথম কিছু শব্দ দেখাচ্ছে", "Showing first words", "إظهار الكلمات الأولى")
                  : t("অর্ধেক দেখাচ্ছে", "Showing half", "إظهار النصف")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <button
          onClick={cycleReveal}
          className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90"
        >
          {revealLevel === "full" ? <RotateCcw className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          {revealLevel === "hidden"
            ? t("হিন্ট দেখুন", "Show Hint", "إظهار تلميح")
            : revealLevel === "full"
              ? t("আবার লুকান", "Hide Again", "إخفاء مرة أخرى")
              : t("আরও দেখুন", "Reveal More", "كشف المزيد")}
        </button>
        <button
          onClick={toggleMemorized}
          className={`px-4 py-3 rounded-xl border transition-colors flex items-center gap-2 ${
            memorized.has(ayah.numberInSurah)
              ? "bg-accent/20 border-accent text-accent"
              : "border-border text-muted-foreground hover:bg-muted"
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-sm hidden sm:inline">
            {memorized.has(ayah.numberInSurah)
              ? t("মুখস্থ", "Memorized", "محفوظ")
              : t("মুখস্থ করুন", "Mark", "حفظ")}
          </span>
        </button>
      </div>

      {/* Translation hint (shown when fully revealed) */}
      {revealLevel === "full" && (
        <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
          <p className="text-sm text-foreground">
            <span className="text-xs text-muted-foreground font-semibold">বাংলা: </span>
            {bengaliAyahs[currentAyah]?.text}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="text-xs font-semibold">English: </span>
            {englishAyahs[currentAyah]?.text}
          </p>
        </div>
      )}

      {/* Ayah grid for quick jump */}
      <ScrollArea className="max-h-[120px]">
        <div className="flex flex-wrap gap-1.5 p-1">
          {arabicAyahs.map((a, i) => (
            <button
              key={a.number}
              onClick={() => { setCurrentAyah(i); setRevealLevel("hidden"); }}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                i === currentAyah
                  ? "bg-primary text-primary-foreground"
                  : memorized.has(a.numberInSurah)
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {a.numberInSurah}
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
