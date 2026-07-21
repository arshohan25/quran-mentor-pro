import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Check, RotateCcw, X, Volume2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDueCards, useReviewMutation, projectNext, type HifzSrsRow } from "@/hooks/useHifzSrs";
import { useAyahAudio, useSurahWithTranslations } from "@/hooks/useQuranApi";
import { useSelectedReciter } from "@/hooks/useSelectedReciter";
import { surahList } from "@/data/surahList";
import { QUALITY_LABELS, type Quality } from "@/lib/srs";
import { Skeleton } from "@/components/ui/skeleton";

const QUALITIES: Quality[] = [0, 3, 4, 5];
type Feedback = "correct" | "incorrect" | null;

function formatInterval(days: number, t: (bn: string, en: string, ar: string) => string) {
  if (days < 1) return t("<১ দিন", "<1d", "<1ي");
  if (days === 1) return t("১ দিন", "1d", "1ي");
  if (days < 30) return t(`${days} দিন`, `${days}d`, `${days}ي`);
  const months = Math.round(days / 30);
  return t(`${months} মাস`, `${months}mo`, `${months}ش`);
}

export default function ReviewSession() {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { data: due, isLoading } = useDueCards();
  const review = useReviewMutation();
  const { reciterId } = useSelectedReciter();

  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [replaying, setReplaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const advanceTimerRef = useRef<number | null>(null);

  // Snapshot the queue once so it doesn't shrink as we mutate
  const [queue, setQueue] = useState<HifzSrsRow[] | null>(null);
  useEffect(() => {
    if (due && !queue) setQueue(due);
  }, [due, queue]);

  const current = queue?.[index];
  const surahMeta = current ? surahList.find(s => s.number === current.surah) : null;

  const { data: surahData, isLoading: ayahLoading } = useSurahWithTranslations(current?.surah ?? 0);
  const { data: audioUrl } = useAyahAudio(current?.surah ?? 0, current?.ayah ?? 0, reciterId);

  const ayahArabic = useMemo(() => {
    if (!current || !surahData) return "";
    return surahData.arabic.ayahs.find(a => a.numberInSurah === current.ayah)?.text ?? "";
  }, [current, surahData]);

  const ayahTranslation = useMemo(() => {
    if (!current || !surahData) return "";
    const src = language === "bn" ? surahData.bengali : surahData.english;
    return src.ayahs.find(a => a.numberInSurah === current.ayah)?.text ?? "";
  }, [current, surahData, language]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current = null;
    }
    setReplaying(false);
  };

  const playCurrentAudio = (onDone?: () => void) => {
    if (!audioUrl) { onDone?.(); return; }
    stopAudio();
    const a = new Audio(audioUrl);
    audioRef.current = a;
    setReplaying(true);
    const finish = () => {
      if (audioRef.current === a) audioRef.current = null;
      setReplaying(false);
      onDone?.();
    };
    a.onended = finish;
    a.onerror = finish;
    a.play().catch(finish);
  };

  const grade = async (q: Quality) => {
    if (!current || review.isPending) return;
    const isCorrect = q >= 4;
    setFeedback(isCorrect ? "correct" : "incorrect");
    setRevealed(true);
    if (isCorrect) setCorrectCount(c => c + 1);
    else setIncorrectCount(c => c + 1);
    try {
      await review.mutateAsync({
        surah: current.surah,
        ayah: current.ayah,
        quality: q,
        existing: current,
      });
      setReviewedCount(c => c + 1);

      const advance = () => {
        setFeedback(null);
        setRevealed(false);
        setShowTranslation(false);
        stopAudio();
        setIndex(i => i + 1);
      };

      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);

      if (isCorrect) {
        advanceTimerRef.current = window.setTimeout(advance, 650);
      } else {
        // Auto-replay the ayah so the learner can immediately repeat the red-marked line.
        playCurrentAudio();
        // Give them time to listen + repeat; capped so the session still flows.
        advanceTimerRef.current = window.setTimeout(advance, 8000);
      }
    } catch (e) {
      console.error("Review failed", e);
      setFeedback(null);
    }
  };

  const quickCorrect = () => grade(5);
  const quickIncorrect = () => grade(0);

  useEffect(() => {
    return () => {
      if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
      stopAudio();
    };
  }, []);

  if (isLoading || !queue) {
    return (
      <div className="min-h-screen bg-background">
        <Header title={t("রিভিউ সেশন", "Review Session", "جلسة المراجعة")} />
        <div className="container py-6 space-y-3">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-12 rounded-lg" />
        </div>
      </div>
    );
  }

  if (queue.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header title={t("রিভিউ সেশন", "Review Session", "جلسة المراجعة")} />
        <div className="container py-12 text-center space-y-3">
          <p className="text-2xl font-bold text-accent">🌿</p>
          <p className="text-foreground font-semibold">
            {t("আজ কিছু বাকি নেই", "Nothing due today", "لا شيء مستحق اليوم")}
          </p>
          <Link to="/hifz" className="inline-block text-sm text-primary underline">
            {t("ড্যাশবোর্ডে ফিরুন", "Back to dashboard", "العودة إلى اللوحة")}
          </Link>
        </div>
      </div>
    );
  }

  // Session done
  if (index >= queue.length) {
    return (
      <div className="min-h-screen bg-background">
        <Header title={t("সম্পন্ন", "Done", "تم")} />
        <div className="container py-12 text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-accent/15 flex items-center justify-center">
            <Check className="w-8 h-8 text-accent" />
          </div>
          <p className="text-2xl font-bold text-foreground">
            {reviewedCount} {t("রিভিউ সম্পন্ন", "reviewed", "تمت المراجعة")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("দারুণ! কাল আবার দেখা হবে।", "Great work! See you tomorrow.", "عمل رائع! نراك غدا.")}
          </p>
          <div className="flex gap-2 justify-center pt-2">
            <button
              onClick={() => navigate("/hifz")}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
            >
              {t("ড্যাশবোর্ড", "Dashboard", "اللوحة")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((index) / queue.length) * 100;

  return (
    <div className="min-h-screen bg-background">
      <Header title={`${index + 1} / ${queue.length}`} />

      <div className="h-1 w-full bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
      </div>

      <div className="container py-5 max-w-2xl mx-auto space-y-5">
        {/* Ayah label + tally */}
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">
            {language === "bn" ? surahMeta?.bengaliName : surahMeta?.englishName}
          </p>
          <p className="text-sm font-semibold text-foreground">
            {t("আয়াত", "Ayah", "آية")} {current!.ayah}
          </p>
          <div className="flex justify-center gap-3 pt-1 text-[11px]">
            <span className="inline-flex items-center gap-1 text-accent">
              <Check className="w-3 h-3" /> {correctCount}
            </span>
            <span className="inline-flex items-center gap-1 text-destructive">
              <X className="w-3 h-3" /> {incorrectCount}
            </span>
          </div>
        </div>

        {/* Arabic */}
        <button
          onClick={() => setRevealed(r => !r)}
          className={`w-full islamic-card p-6 min-h-[140px] flex items-center justify-center text-center border-2 transition-colors ${
            feedback === "correct"
              ? "border-accent bg-accent/10"
              : feedback === "incorrect"
              ? "border-destructive bg-destructive/10 ring-2 ring-destructive/40"
              : "border-transparent"
          }`}
          dir="rtl"
        >
          {ayahLoading ? (
            <Skeleton className="h-10 w-full" />
          ) : revealed ? (
            <p
              className={`font-arabic text-2xl md:text-3xl leading-[2.4] ${
                feedback === "incorrect"
                  ? "text-destructive underline decoration-2 decoration-destructive/70"
                  : feedback === "correct"
                  ? "text-accent"
                  : "text-foreground"
              }`}
            >
              {ayahArabic}
            </p>
          ) : (
            <div className="space-y-2" dir="ltr">
              <EyeOff className="w-6 h-6 text-muted-foreground/60 mx-auto" />
              <p className="text-sm text-muted-foreground">
                {t("মনে করুন, তারপর দেখতে ট্যাপ করুন", "Recall, then tap to reveal", "تذكر، ثم اضغط للكشف")}
              </p>
            </div>
          )}
        </button>

        {/* Quick actions — always visible for one-tap grading */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={quickIncorrect}
            disabled={review.isPending}
            className="rounded-xl border-2 border-destructive/30 bg-destructive/10 text-destructive px-3 py-3 text-sm font-semibold hover:bg-destructive/15 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            {t("ভুল হয়েছে", "Incorrect", "خطأ")}
          </button>
          <button
            onClick={quickCorrect}
            disabled={review.isPending}
            className="rounded-xl border-2 border-accent/30 bg-accent/10 text-accent px-3 py-3 text-sm font-semibold hover:bg-accent/15 transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            {t("সঠিক হয়েছে", "Correct", "صحيح")}
          </button>
        </div>

        {/* Translation toggle */}
        <div className="flex justify-center">
          <button
            onClick={() => setShowTranslation(s => !s)}
            className="text-xs text-primary inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-muted transition-colors"
          >
            <Eye className="w-3.5 h-3.5" />
            {showTranslation
              ? t("অনুবাদ লুকান", "Hide translation", "إخفاء الترجمة")
              : t("অনুবাদ দেখান", "Show translation", "إظهار الترجمة")}
          </button>
        </div>
        {showTranslation && (
          <p className="text-sm text-muted-foreground text-center px-2">{ayahTranslation}</p>
        )}

        {/* Detailed grading (SRS quality) */}
        {revealed && (
          <div className="pt-1">
            <p className="text-[11px] text-muted-foreground text-center mb-2 uppercase tracking-wide">
              {t("বিস্তারিত গ্রেড", "Detailed grade", "تقييم مفصل")}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {QUALITIES.map(q => {
                const next = projectNext(current!, q);
                const label = QUALITY_LABELS[q];
                const color =
                  q === 0
                    ? "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/15"
                    : q === 3
                    ? "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20 hover:bg-orange-500/15"
                    : q === 4
                    ? "bg-primary/10 text-primary border-primary/20 hover:bg-primary/15"
                    : "bg-accent/10 text-accent border-accent/20 hover:bg-accent/15";
                return (
                  <button
                    key={q}
                    onClick={() => grade(q)}
                    disabled={review.isPending}
                    className={`rounded-lg border px-3 py-3 text-sm font-semibold transition-colors disabled:opacity-50 ${color}`}
                  >
                    <div className="flex items-center justify-center gap-1.5">
                      {q === 0 && <RotateCcw className="w-3.5 h-3.5" />}
                      {language === "bn" ? label.bn : label.en}
                    </div>
                    <p className="text-[10px] font-normal opacity-80 mt-0.5">
                      → {formatInterval(next.interval_days, t)}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


function Header({ title }: { title: string }) {
  return (
    <header className="islamic-header">
      <div className="container flex items-center gap-3 relative z-10">
        <Link to="/hifz" className="hover:opacity-80 p-1">
          <ArrowLeft className="w-5 h-5" strokeWidth={1.8} />
        </Link>
        <h1 className="text-base font-bold">{title}</h1>
      </div>
    </header>
  );
}
