import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, CheckCircle2, Circle, Target, RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PLANNER_KEY = "quran-khatmah-planner";
const TOTAL_JUZ = 30;

interface KhatmahPlan {
  totalDays: number;
  startDate: string;
  completedDays: number[];
  juzPerDay: number[];
}

function createPlan(totalDays: number): KhatmahPlan {
  const today = new Date().toISOString().split("T")[0];
  const juzPerDay: number[] = [];
  const baseJuz = Math.floor(TOTAL_JUZ / totalDays);
  let remaining = TOTAL_JUZ - baseJuz * totalDays;

  for (let i = 0; i < totalDays; i++) {
    juzPerDay.push(baseJuz + (remaining > 0 ? 1 : 0));
    if (remaining > 0) remaining--;
  }

  return { totalDays, startDate: today, completedDays: [], juzPerDay };
}

function loadPlan(): KhatmahPlan | null {
  try {
    const raw = localStorage.getItem(PLANNER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function savePlan(plan: KhatmahPlan) {
  localStorage.setItem(PLANNER_KEY, JSON.stringify(plan));
}

export default function QuranPlannerPage() {
  const { t } = useLanguage();
  const [plan, setPlan] = useState<KhatmahPlan | null>(loadPlan);
  const [selectedDays, setSelectedDays] = useState("30");

  useEffect(() => {
    if (plan) savePlan(plan);
  }, [plan]);

  const startPlan = () => {
    const newPlan = createPlan(Number(selectedDays));
    setPlan(newPlan);
  };

  const resetPlan = () => {
    localStorage.removeItem(PLANNER_KEY);
    setPlan(null);
  };

  const toggleDay = (dayIndex: number) => {
    if (!plan) return;
    setPlan((prev) => {
      if (!prev) return prev;
      const completed = prev.completedDays.includes(dayIndex)
        ? prev.completedDays.filter((d) => d !== dayIndex)
        : [...prev.completedDays, dayIndex];
      return { ...prev, completedDays: completed };
    });
  };

  const completedJuz = plan
    ? plan.completedDays.reduce((sum, dayIdx) => sum + (plan.juzPerDay[dayIdx] || 0), 0)
    : 0;
  const progressPercent = plan ? Math.round((completedJuz / TOTAL_JUZ) * 100) : 0;

  // Compute juz ranges for each day
  const getJuzRange = (dayIndex: number): string => {
    if (!plan) return "";
    let start = 1;
    for (let i = 0; i < dayIndex; i++) {
      start += plan.juzPerDay[i];
    }
    const end = start + plan.juzPerDay[dayIndex] - 1;
    return start === end ? `${t("পারা", "Juz", "جزء")} ${start}` : `${t("পারা", "Juz", "جزء")} ${start}-${end}`;
  };

  const getDayDate = (dayIndex: number): string => {
    if (!plan) return "";
    const d = new Date(plan.startDate);
    d.setDate(d.getDate() + dayIndex);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="islamic-header">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="hover:opacity-80 transition-opacity">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <Calendar className="w-5 h-5" />
            <h1 className="text-lg font-bold">
              {t("কুরআন প্ল্যানার", "Quran Planner", "مخطط القرآن")}
            </h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <main className="container py-6 space-y-5">
        {!plan ? (
          /* Setup screen */
          <div className="islamic-card p-6 text-center space-y-5">
            <div className="text-4xl mb-2">🌙</div>
            <h2 className="text-xl font-bold text-foreground">
              {t("খতম পরিকল্পনা শুরু করুন", "Start Your Khatmah Plan", "ابدأ خطة الختمة")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t(
                "কুরআন শরিফ কত দিনে খতম করতে চান নির্বাচন করুন",
                "Choose how many days to complete the Quran",
                "اختر عدد الأيام لإكمال القرآن"
              )}
            </p>

            <div className="flex items-center justify-center gap-3">
              <Select value={selectedDays} onValueChange={setSelectedDays}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7">7 {t("দিন", "Days", "أيام")}</SelectItem>
                  <SelectItem value="10">10 {t("দিন", "Days", "أيام")}</SelectItem>
                  <SelectItem value="15">15 {t("দিন", "Days", "أيام")}</SelectItem>
                  <SelectItem value="20">20 {t("দিন", "Days", "أيام")}</SelectItem>
                  <SelectItem value="29">29 {t("দিন", "Days", "أيام")}</SelectItem>
                  <SelectItem value="30">30 {t("দিন", "Days", "أيام")}</SelectItem>
                  <SelectItem value="60">60 {t("দিন", "Days", "أيام")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <p className="text-xs text-muted-foreground">
              ≈ {Math.ceil(TOTAL_JUZ / Number(selectedDays))} {t("পারা/দিন", "juz/day", "جزء/يوم")}
            </p>

            <Button onClick={startPlan} className="w-full max-w-xs mx-auto">
              <Target className="w-4 h-4 mr-2" />
              {t("শুরু করুন", "Start Plan", "ابدأ الخطة")}
            </Button>
          </div>
        ) : (
          /* Active plan */
          <>
            {/* Progress overview */}
            <div className="islamic-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">
                  {t("খতম অগ্রগতি", "Khatmah Progress", "تقدم الختمة")}
                </h3>
                <button onClick={resetPlan} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
                  <RotateCcw className="w-3 h-3" />
                  {t("রিসেট", "Reset", "إعادة")}
                </button>
              </div>
              <Progress value={progressPercent} className="h-3" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{completedJuz}/{TOTAL_JUZ} {t("পারা", "Juz", "جزء")}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-primary font-medium">
                  {plan.completedDays.length}/{plan.totalDays} {t("দিন সম্পন্ন", "days done", "أيام مكتملة")}
                </span>
                <span className="text-muted-foreground">
                  {plan.totalDays - plan.completedDays.length} {t("দিন বাকি", "days left", "أيام متبقية")}
                </span>
              </div>
            </div>

            {/* Daily checklist */}
            <div className="space-y-2">
              {Array.from({ length: plan.totalDays }).map((_, i) => {
                const done = plan.completedDays.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => toggleDay(i)}
                    className={`w-full islamic-card p-3.5 flex items-center gap-3 text-left transition-all ${
                      done ? "bg-primary/5 border-primary/30" : ""
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${done ? "text-primary line-through" : "text-foreground"}`}>
                        {t("দিন", "Day", "يوم")} {i + 1} — {getJuzRange(i)}
                      </p>
                      <p className="text-[11px] text-muted-foreground">{getDayDate(i)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}>
                      {plan.juzPerDay[i]} {t("পারা", "Juz", "جزء")}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
