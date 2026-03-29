import { useState, useEffect, useMemo, useRef } from "react";
import { Eye, EyeOff, CheckCircle2, RotateCcw, ChevronLeft, ChevronRight, Brain, Flame, Zap, ThumbsUp, ThumbsDown, Minus } from "lucide-react";
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

// --- Spaced Repetition (SM-2 simplified) ---

interface SrsCard {
  ayahNum: number;
  ease: number;       // 1.3 - 3.0
  interval: number;   // days
  repetitions: number;
  nextReview: number;  // timestamp ms
  lastQuality: number; // 0-5
}

type SrsData = Record<number, SrsCard>;

function loadSrs(surahNumber: number): SrsData {
  try {
    const raw = localStorage.getItem(`hifz-srs-${surahNumber}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveSrs(surahNumber: number, data: SrsData) {
  localStorage.setItem(`hifz-srs-${surahNumber}`, JSON.stringify(data));
}

function getOrCreateCard(srs: SrsData, ayahNum: number): SrsCard {
  return srs[ayahNum] || {
    ayahNum,
    ease: 2.5,
    interval: 0,
    repetitions: 0,
    nextReview: 0,
    lastQuality: 0,
  };
}

function reviewCard(card: SrsCard, quality: number): SrsCard {
  // quality: 0=forgot, 3=hard, 4=good, 5=easy
  const now = Date.now();
  let { ease, interval, repetitions } = card;

  if (quality < 3) {
    // Reset
    repetitions = 0;
    interval = 0;
  } else {
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 3;
    } else {
      interval = Math.round(interval * ease);
    }
    repetitions += 1;
  }

  ease = Math.max(1.3, ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));

  return {
    ...card,
    ease,
    interval,
    repetitions,
    lastQuality: quality,
    nextReview: now + interval * 24 * 60 * 60 * 1000,
  };
}

function getDueAyahs(srs: SrsData, totalAyahs: Ayah[]): number[] {
  const now = Date.now();
  const due: { ayahIdx: number; priority: number }[] = [];

  totalAyahs.forEach((a, idx) => {
    const card = srs[a.numberInSurah];
    if (!card) {
      // New — high priority
      due.push({ ayahIdx: idx, priority: 0 });
    } else if (card.nextReview <= now) {
      // Overdue — lower ease = higher priority
      due.push({ ayahIdx: idx, priority: card.ease });
    }
  });

  due.sort((a, b) => a.priority - b.priority);
  return due.map(d => d.ayahIdx);
}

function getCardStatus(srs: SrsData, ayahNum: number): "new" | "learning" | "due" | "mastered" {
  const card = srs[ayahNum];
  if (!card) return "new";
  if (card.interval >= 21 && card.repetitions >= 5) return "mastered";
  if (card.nextReview <= Date.now()) return "due";
  return "learning";
}

// --- Component ---

export default function HifzMode({ arabicAyahs, bengaliAyahs, englishAyahs, surahNumber, tajweedEnabled }: HifzModeProps) {
  const { t } = useLanguage();
  const [currentAyah, setCurrentAyah] = useState(0);
  const [revealLevel, setRevealLevel] = useState<RevealLevel>("hidden");
  const [srs, setSrs] = useState<SrsData>(() => loadSrs(surahNumber));
  const [reviewMode, setReviewMode] = useState(false);
  const [reviewQueue, setReviewQueue] = useState<number[]>([]);
  const [reviewIdx, setReviewIdx] = useState(0);
  const sessionStart = useRef<number>(Date.now());

  useEffect(() => {
    setCurrentAyah(0);
    setRevealLevel("hidden");
    setSrs(loadSrs(surahNumber));
    setReviewMode(false);
  }, [surahNumber]);

  useEffect(() => {
    saveSrs(surahNumber, srs);
  }, [srs, surahNumber]);

  const dueCount = useMemo(() => {
    return getDueAyahs(srs, arabicAyahs).length;
  }, [srs, arabicAyahs]);

  const stats = useMemo(() => {
    let newCount = 0, learning = 0, mastered = 0, due = 0;
    arabicAyahs.forEach(a => {
      const s = getCardStatus(srs, a.numberInSurah);
      if (s === "new") newCount++;
      else if (s === "learning") learning++;
      else if (s === "mastered") mastered++;
      else due++;
    });
    return { new: newCount, learning, mastered, due };
  }, [srs, arabicAyahs]);

  const startReview = () => {
    const queue = getDueAyahs(srs, arabicAyahs);
    if (queue.length === 0) return;
    setReviewQueue(queue);
    setReviewIdx(0);
    setCurrentAyah(queue[0]);
    setRevealLevel("hidden");
    setReviewMode(true);
  };

  // Log practice time on unmount or surah change
  useEffect(() => {
    sessionStart.current = Date.now();
    return () => {
      const elapsed = Date.now() - sessionStart.current;
      if (elapsed > 5000) {
        import("@/hooks/useStreakTracker").then(m => m.logPracticeSession(elapsed));
      }
    };
  }, [surahNumber]);

  const rateAyah = (quality: number) => {
    const ayah = arabicAyahs[currentAyah];
    if (!ayah) return;
    const card = getOrCreateCard(srs, ayah.numberInSurah);
    const updated = reviewCard(card, quality);
    setSrs(prev => ({ ...prev, [ayah.numberInSurah]: updated }));

    // Move to next in review queue
    if (reviewMode) {
      const nextIdx = reviewIdx + 1;
      if (nextIdx < reviewQueue.length) {
        setReviewIdx(nextIdx);
        setCurrentAyah(reviewQueue[nextIdx]);
        setRevealLevel("hidden");
      } else {
        setReviewMode(false);
      }
    } else {
      // Normal mode — go next
      if (currentAyah < arabicAyahs.length - 1) {
        setCurrentAyah(currentAyah + 1);
        setRevealLevel("hidden");
      }
    }
  };

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

  const masteredCount = stats.mastered;
  const progress = arabicAyahs.length > 0
    ? Math.round((masteredCount / arabicAyahs.length) * 100)
    : 0;

  const visibleText = getVisibleText();
  const currentStatus = getCardStatus(srs, ayah.numberInSurah);
  const currentCard = srs[ayah.numberInSurah];

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Brain className="w-4 h-4 text-primary" />
            {t("স্পেসড রিপিটিশন", "Spaced Repetition", "التكرار المتباعد")}
          </span>
          <span className="text-xs text-muted-foreground">{progress}% {t("মাস্টার্ড", "mastered", "متقن")}</span>
        </div>

        {/* Stat chips */}
        <div className="flex gap-2 mb-3 flex-wrap">
          <span className="text-xs px-2 py-1 rounded-lg bg-muted text-muted-foreground">
            {t("নতুন", "New", "جديد")} {stats.new}
          </span>
          <span className="text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary">
            {t("শিখছে", "Learning", "تعلم")} {stats.learning}
          </span>
          <span className="text-xs px-2 py-1 rounded-lg bg-destructive/10 text-destructive">
            {t("রিভিউ", "Due", "مراجعة")} {stats.due}
          </span>
          <span className="text-xs px-2 py-1 rounded-lg bg-accent/10 text-accent">
            {t("মুখস্থ", "Mastered", "متقن")} {stats.mastered}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full bg-muted overflow-hidden flex">
          {arabicAyahs.length > 0 && (
            <>
              <div className="h-full bg-accent transition-all" style={{ width: `${(stats.mastered / arabicAyahs.length) * 100}%` }} />
              <div className="h-full bg-primary transition-all" style={{ width: `${(stats.learning / arabicAyahs.length) * 100}%` }} />
              <div className="h-full bg-destructive/60 transition-all" style={{ width: `${(stats.due / arabicAyahs.length) * 100}%` }} />
            </>
          )}
        </div>
      </div>

      {/* Review button */}
      {dueCount > 0 && !reviewMode && (
        <button
          onClick={startReview}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 font-medium hover:bg-destructive/20 transition-colors"
        >
          <Flame className="w-4 h-4" />
          {t(`${dueCount}টি আয়াত রিভিউ করুন`, `Review ${dueCount} due ayahs`, `مراجعة ${dueCount} آيات`)}
        </button>
      )}

      {reviewMode && (
        <div className="flex items-center justify-between px-2">
          <span className="text-xs text-destructive font-semibold flex items-center gap-1">
            <Flame className="w-3 h-3" />
            {t("রিভিউ মোড", "Review Mode", "وضع المراجعة")}
          </span>
          <span className="text-xs text-muted-foreground">
            {reviewIdx + 1}/{reviewQueue.length}
          </span>
          <button onClick={() => setReviewMode(false)} className="text-xs text-muted-foreground underline">
            {t("বন্ধ করুন", "Exit", "خروج")}
          </button>
        </div>
      )}

      {/* Navigation (hidden in review mode) */}
      {!reviewMode && (
        <div className="flex items-center justify-between">
          <button onClick={goPrev} disabled={currentAyah === 0} className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 transition-colors">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="text-center">
            <span className="text-sm font-medium text-foreground">
              {t("আয়াত", "Ayah", "آية")} {ayah.numberInSurah} / {arabicAyahs.length}
            </span>
            <span className={`block text-[10px] mt-0.5 ${
              currentStatus === "mastered" ? "text-accent" :
              currentStatus === "due" ? "text-destructive" :
              currentStatus === "learning" ? "text-primary" : "text-muted-foreground"
            }`}>
              {currentStatus === "new" ? t("নতুন", "New", "جديد") :
               currentStatus === "learning" ? t("শিখছে", "Learning", "تعلم") :
               currentStatus === "due" ? t("রিভিউ প্রয়োজন", "Due for review", "يحتاج مراجعة") :
               t("মুখস্থ ✓", "Mastered ✓", "متقن ✓")}
              {currentCard && currentStatus !== "new" && (
                <> · {currentCard.interval}{t("দিন", "d", "ي")}</>
              )}
            </span>
          </div>
          <button onClick={goNext} disabled={currentAyah === arabicAyahs.length - 1} className="p-2 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 transition-colors">
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
        </div>
      )}

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

      {/* Reveal button */}
      {revealLevel !== "full" && (
        <button
          onClick={cycleReveal}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-medium transition-colors hover:bg-primary/90"
        >
          {revealLevel === "hidden" ? <Eye className="w-4 h-4" /> : <Zap className="w-4 h-4" />}
          {revealLevel === "hidden"
            ? t("হিন্ট দেখুন", "Show Hint", "إظهار تلميح")
            : t("আরও দেখুন", "Reveal More", "كشف المزيد")}
        </button>
      )}

      {/* Rating buttons (shown when fully revealed) */}
      {revealLevel === "full" && (
        <div className="space-y-3">
          <p className="text-xs text-center text-muted-foreground">
            {t("কতটুকু মনে ছিল?", "How well did you recall?", "كيف كان تذكرك؟")}
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => rateAyah(0)}
              className="flex flex-col items-center gap-1 py-3 rounded-xl border border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <ThumbsDown className="w-5 h-5" />
              <span className="text-xs font-medium">{t("ভুলে গেছি", "Forgot", "نسيت")}</span>
              <span className="text-[10px] text-destructive/60">{t("আবার শুরু", "Reset", "إعادة")}</span>
            </button>
            <button
              onClick={() => rateAyah(3)}
              className="flex flex-col items-center gap-1 py-3 rounded-xl border border-border bg-muted/30 text-foreground hover:bg-muted/50 transition-colors"
            >
              <Minus className="w-5 h-5" />
              <span className="text-xs font-medium">{t("কঠিন", "Hard", "صعب")}</span>
              <span className="text-[10px] text-muted-foreground">~1{t("দিন", "d", "ي")}</span>
            </button>
            <button
              onClick={() => rateAyah(5)}
              className="flex flex-col items-center gap-1 py-3 rounded-xl border border-accent/30 bg-accent/5 text-accent hover:bg-accent/10 transition-colors"
            >
              <ThumbsUp className="w-5 h-5" />
              <span className="text-xs font-medium">{t("সহজ", "Easy", "سهل")}</span>
              {currentCard && <span className="text-[10px] text-accent/60">~{Math.round((currentCard.interval || 1) * currentCard.ease)}{t("দিন", "d", "ي")}</span>}
            </button>
          </div>
        </div>
      )}

      {/* Translation (shown when fully revealed) */}
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

      {/* Ayah grid */}
      {!reviewMode && (
        <ScrollArea className="max-h-[120px]">
          <div className="flex flex-wrap gap-1.5 p-1">
            {arabicAyahs.map((a, i) => {
              const status = getCardStatus(srs, a.numberInSurah);
              return (
                <button
                  key={a.number}
                  onClick={() => { setCurrentAyah(i); setRevealLevel("hidden"); }}
                  className={`w-8 h-8 rounded-lg text-xs font-medium transition-colors ${
                    i === currentAyah
                      ? "bg-primary text-primary-foreground"
                      : status === "mastered"
                        ? "bg-accent/20 text-accent border border-accent/30"
                        : status === "due"
                          ? "bg-destructive/15 text-destructive border border-destructive/30"
                          : status === "learning"
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                  }`}
                >
                  {a.numberInSurah}
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
