import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, Star, BookOpen, Trophy, Flame } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { DAILY_AMALS, AMAL_CATEGORIES, DailyAmal } from "@/data/dailyAmalData";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import DailyAmalStats from "@/components/DailyAmalStats";
import DailyAmalDataSync from "@/components/DailyAmalDataSync";

function getToday() {
  return new Date().toISOString().slice(0, 10);
}

function loadCompleted(): number[] {
  try {
    const raw = localStorage.getItem(`daily-amal-${getToday()}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveCompleted(ids: number[]) {
  localStorage.setItem(`daily-amal-${getToday()}`, JSON.stringify(ids));
}

function getStreak(): number {
  let streak = 0;
  const d = new Date();
  for (let i = 0; i < 365; i++) {
    const key = `daily-amal-${d.toISOString().slice(0, 10)}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const ids: number[] = JSON.parse(raw);
      if (ids.length >= Math.ceil(DAILY_AMALS.length * 0.5)) {
        streak++;
      } else if (i > 0) break;
    } else if (i > 0) break;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

export default function DailyAmalPage() {
  const { t, language } = useLanguage();
  const [activeCategory, setActiveCategory] = useState("all");
  const [completed, setCompleted] = useState<number[]>(loadCompleted);
  const streak = getStreak();

  useEffect(() => { saveCompleted(completed); }, [completed]);

  const filtered = activeCategory === "all"
    ? DAILY_AMALS
    : DAILY_AMALS.filter((a) => a.category === activeCategory);

  const progressPercent = Math.round((completed.length / DAILY_AMALS.length) * 100);

  const toggleAmal = (id: number) => {
    setCompleted((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (!prev.includes(id)) {
        const done = next.length;
        if (done === DAILY_AMALS.length) {
          toast.success(t("মাশাআল্লাহ! সব আমল সম্পন্ন! 🎉", "MashaAllah! All amals completed! 🎉", "ما شاء الله! اكتملت جميع الأعمال! 🎉"));
        } else if (done === Math.ceil(DAILY_AMALS.length / 2)) {
          toast(t("অর্ধেক হয়েছে! চালিয়ে যান 💪", "Halfway done! Keep going 💪", "أكملت النصف! استمر 💪"));
        }
      }
      return next;
    });
  };

  const getCategoryLabel = (a: DailyAmal) => {
    if (language === "bn") return a.categoryBn;
    if (language === "ar") return a.categoryAr;
    return a.category.charAt(0).toUpperCase() + a.category.slice(1);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="islamic-header relative overflow-hidden">
        <div className="relative z-10 container py-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Link to="/" className="text-primary-foreground/80 hover:text-primary-foreground">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-lg font-bold font-bengaliDisplay">
                {t("দৈনিক আমল", "Daily Amal", "الأعمال اليومية")}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <DailyAmalDataSync onImport={() => setCompleted(loadCompleted())} />
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="container py-4 space-y-4">
        {/* Progress + Streak */}
        <div className="islamic-card p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-accent" />
              <span className="text-sm font-semibold text-foreground">
                {t("আজকের অগ্রগতি", "Today's Progress", "تقدم اليوم")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-accent" />
              <span className="text-xs font-bold text-accent">{streak} {t("দিন", "days", "يوم")}</span>
            </div>
          </div>
          <Progress value={progressPercent} className="h-2.5" />
          <p className="text-xs text-muted-foreground text-center">
            {completed.length}/{DAILY_AMALS.length} {t("সম্পন্ন", "completed", "مكتمل")} — {progressPercent}%
          </p>
        </div>

        {/* Stats Chart */}
        <DailyAmalStats key={completed.length} />

        {/* Category Pills */}
        <ScrollArea className="w-full whitespace-nowrap">
          <div className="flex gap-2 pb-2">
            {AMAL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                  activeCategory === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                }`}
              >
                {language === "bn" ? cat.bn : language === "ar" ? cat.ar : cat.en}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {/* Amal Cards */}
        <div className="space-y-3">
          {filtered.map((amal) => {
            const isDone = completed.includes(amal.id);
            return (
              <div
                key={amal.id}
                className={`islamic-card p-4 space-y-2.5 transition-all ${isDone ? "opacity-75 border-accent/30" : ""}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">
                        {getCategoryLabel(amal)}
                      </Badge>
                      {amal.targetCount > 1 && (
                        <span className="text-[10px] text-muted-foreground">
                          ×{amal.targetCount}
                        </span>
                      )}
                    </div>
                    <p className="font-arabic text-base leading-[2] text-foreground">{amal.arabic}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {language === "bn" ? amal.bn : language === "ar" ? amal.ar : amal.en}
                    </p>
                  </div>
                  <Checkbox
                    checked={isDone}
                    onCheckedChange={() => toggleAmal(amal.id)}
                    className="mt-1 h-5 w-5"
                  />
                </div>

                {/* Reference */}
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
                  <BookOpen className="w-3 h-3" />
                  <span>{amal.reference}</span>
                </div>

                {/* Benefit */}
                <div className="flex items-start gap-1.5 bg-accent/10 rounded-lg p-2">
                  <Star className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <p className="text-[11px] text-accent leading-relaxed font-medium">
                    {language === "bn" ? amal.benefitBn : language === "ar" ? amal.benefitAr : amal.benefitEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">
            {t("এই ক্যাটাগরিতে কোনো আমল নেই", "No amals in this category", "لا أعمال في هذه الفئة")}
          </p>
        )}

        <div className="text-center pt-2 pb-4">
          <div className="gold-divider">
            <span className="text-accent/40 text-sm">✦</span>
          </div>
        </div>
      </main>
    </div>
  );
}
