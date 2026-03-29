import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Brain, BookOpen, Search, Trophy, Flame, TrendingUp, Calendar, Clock, Zap, Target, Settings2, Check } from "lucide-react";
import { surahList } from "@/data/surahList";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getStreakStats } from "@/hooks/useStreakTracker";
import HifzProgressChart from "@/components/HifzProgressChart";

interface SrsCard {
  ayahNum: number;
  ease: number;
  interval: number;
  repetitions: number;
  nextReview: number;
  lastQuality: number;
}

type SrsData = Record<number, SrsCard>;

function loadSrs(surahNumber: number): SrsData {
  try {
    const raw = localStorage.getItem(`hifz-srs-${surahNumber}`);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function getSurahStats(surahNumber: number, totalAyahs: number) {
  const srs = loadSrs(surahNumber);
  const now = Date.now();
  let newCount = 0, learning = 0, mastered = 0, due = 0;

  for (let i = 1; i <= totalAyahs; i++) {
    const card = srs[i];
    if (!card) { newCount++; continue; }
    if (card.interval >= 21 && card.repetitions >= 5) mastered++;
    else if (card.nextReview <= now) due++;
    else learning++;
  }

  return { new: newCount, learning, mastered, due, total: totalAyahs };
}

type SortMode = "number" | "progress" | "due";

// --- Daily Goal ---
const GOAL_KEY = "hifz-daily-goal";
const GOAL_LOG_KEY = "hifz-daily-log";

interface DailyGoal {
  target: number; // ayahs per day
}

interface DailyLog {
  date: string;
  reviewed: number;
}

function loadGoal(): DailyGoal {
  try {
    const raw = localStorage.getItem(GOAL_KEY);
    return raw ? JSON.parse(raw) : { target: 10 };
  } catch { return { target: 10 }; }
}

function saveGoal(goal: DailyGoal) {
  localStorage.setItem(GOAL_KEY, JSON.stringify(goal));
}

function getTodayStr() {
  return new Date().toISOString().split("T")[0];
}

function getTodayReviewed(): number {
  try {
    const raw = localStorage.getItem(GOAL_LOG_KEY);
    if (!raw) return 0;
    const log: DailyLog = JSON.parse(raw);
    return log.date === getTodayStr() ? log.reviewed : 0;
  } catch { return 0; }
}

function DailyGoalCard() {
  const { t } = useLanguage();
  const [goal, setGoal] = useState<DailyGoal>(loadGoal);
  const [editing, setEditing] = useState(false);
  const [tempTarget, setTempTarget] = useState(goal.target.toString());
  const todayReviewed = useMemo(() => getTodayReviewed(), []);
  const progress = Math.min((todayReviewed / Math.max(goal.target, 1)) * 100, 100);
  const achieved = todayReviewed >= goal.target;

  const handleSave = useCallback(() => {
    const val = Math.max(1, Math.min(100, parseInt(tempTarget) || 10));
    const newGoal = { target: val };
    setGoal(newGoal);
    saveGoal(newGoal);
    setEditing(false);
  }, [tempTarget]);

  const presets = [5, 10, 15, 20, 30];

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <span className="font-semibold text-foreground">
            {t("দৈনিক লক্ষ্য", "Daily Goal", "الهدف اليومي")}
          </span>
        </div>
        <button
          onClick={() => { setEditing(!editing); setTempTarget(goal.target.toString()); }}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
        >
          <Settings2 className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {editing ? (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">
            {t("প্রতিদিন কতটি আয়াত রিভিউ করতে চান?", "How many ayahs to review daily?", "كم آية تريد مراجعتها يومياً؟")}
          </p>
          <div className="flex gap-2 flex-wrap">
            {presets.map(p => (
              <button
                key={p}
                onClick={() => setTempTarget(p.toString())}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  tempTarget === p.toString()
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              min={1}
              max={100}
              value={tempTarget}
              onChange={e => setTempTarget(e.target.value)}
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {t("সেভ", "Save", "حفظ")}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline gap-1.5">
              <span className={`text-3xl font-bold ${achieved ? "text-accent" : "text-foreground"}`}>
                {todayReviewed}
              </span>
              <span className="text-sm text-muted-foreground">/ {goal.target}</span>
            </div>
            {achieved && (
              <div className="flex items-center gap-1 text-accent text-xs font-medium">
                <Check className="w-4 h-4" />
                {t("সম্পন্ন!", "Done!", "تم!")}
              </div>
            )}
          </div>

          <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${achieved ? "bg-accent" : "bg-primary"}`}
              style={{ width: `${progress}%` }}
            />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            {achieved
              ? t("আজকের লক্ষ্য পূরণ হয়েছে! 🎉", "Today's goal achieved! 🎉", "تم تحقيق هدف اليوم! 🎉")
              : t(
                  `আরও ${goal.target - todayReviewed}টি আয়াত বাকি`,
                  `${goal.target - todayReviewed} more ayahs to go`,
                  `بقي ${goal.target - todayReviewed} آيات`
                )}
          </p>
        </div>
      )}
    </div>
  );
}

const DAY_NAMES_BN = ["শনি", "রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র"];
const DAY_NAMES_EN = ["Sat", "Sun", "Mon", "Tue", "Wed", "Thu", "Fri"];
const DAY_NAMES_AR = ["سبت", "أحد", "اثن", "ثلا", "أرب", "خمي", "جمع"];

function StreakCard() {
  const { t, language } = useLanguage();
  const streak = useMemo(() => getStreakStats(), []);
  const maxMin = Math.max(...streak.last7Days.map(d => d.minutes), 1);
  const dayNames = language === "bn" ? DAY_NAMES_BN : language === "ar" ? DAY_NAMES_AR : DAY_NAMES_EN;

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flame className="w-5 h-5 text-accent" />
        <span className="font-semibold text-foreground">
          {t("স্ট্রিক ট্র্যাকার", "Streak Tracker", "متتبع المتابعة")}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="rounded-lg bg-accent/10 p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Zap className="w-4 h-4 text-accent" />
          </div>
          <p className="text-2xl font-bold text-accent">{streak.currentStreak}</p>
          <p className="text-[10px] text-muted-foreground">{t("বর্তমান স্ট্রিক", "Current", "الحالي")}</p>
        </div>
        <div className="rounded-lg bg-primary/10 p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-bold text-primary">{streak.longestStreak}</p>
          <p className="text-[10px] text-muted-foreground">{t("সর্বোচ্চ", "Best", "الأفضل")}</p>
        </div>
        <div className="rounded-lg bg-muted p-3 text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <Clock className="w-4 h-4 text-foreground" />
          </div>
          <p className="text-2xl font-bold text-foreground">{streak.todayMinutes}<span className="text-xs font-normal text-muted-foreground">m</span></p>
          <p className="text-[10px] text-muted-foreground">{t("আজ", "Today", "اليوم")}</p>
        </div>
      </div>

      {/* Weekly bar chart */}
      <div className="flex items-end gap-1.5 h-16">
        {streak.last7Days.map((day, i) => {
          const height = day.minutes > 0 ? Math.max((day.minutes / maxMin) * 100, 8) : 4;
          const dayDate = new Date(day.date);
          const dayIdx = dayDate.getDay();
          return (
            <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t transition-all ${day.minutes > 0 ? "bg-accent" : "bg-muted"}`}
                style={{ height: `${height}%` }}
                title={`${day.minutes}m`}
              />
              <span className="text-[9px] text-muted-foreground">{dayNames[dayIdx]}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex items-center justify-center gap-1 text-xs text-muted-foreground">
        <Calendar className="w-3 h-3" />
        <span>{streak.totalDays} {t("দিন প্র্যাকটিস", "days practiced", "أيام تدريب")}</span>
      </div>
    </div>
  );
}

export default function HifzDashboardPage() {
  const { t, language } = useLanguage();
  const [search, setSearch] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("number");

  const surahStats = useMemo(() => {
    return surahList.map(s => ({
      ...s,
      stats: getSurahStats(s.number, s.numberOfAyahs),
    }));
  }, []);

  const globalStats = useMemo(() => {
    let total = 0, mastered = 0, learning = 0, due = 0, newCount = 0;
    surahStats.forEach(s => {
      total += s.stats.total;
      mastered += s.stats.mastered;
      learning += s.stats.learning;
      due += s.stats.due;
      newCount += s.stats.new;
    });
    return { total, mastered, learning, due, new: newCount };
  }, [surahStats]);

  const startedSurahs = useMemo(() => {
    return surahStats.filter(s => s.stats.mastered + s.stats.learning + s.stats.due > 0).length;
  }, [surahStats]);

  const filtered = useMemo(() => {
    let list = surahStats.filter(s =>
      s.name.includes(search) ||
      s.englishName.toLowerCase().includes(search.toLowerCase()) ||
      s.bengaliName.includes(search) ||
      s.number.toString() === search
    );

    if (sortMode === "progress") {
      list = [...list].sort((a, b) => {
        const pa = a.stats.total > 0 ? a.stats.mastered / a.stats.total : 0;
        const pb = b.stats.total > 0 ? b.stats.mastered / b.stats.total : 0;
        return pb - pa;
      });
    } else if (sortMode === "due") {
      list = [...list].sort((a, b) => b.stats.due - a.stats.due);
    }

    return list;
  }, [surahStats, search, sortMode]);

  const globalProgress = globalStats.total > 0
    ? Math.round((globalStats.mastered / globalStats.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary text-primary-foreground py-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="hover:opacity-80">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Brain className="w-5 h-5" />
              {t("হিফজ ড্যাশবোর্ড", "Hifz Dashboard", "لوحة الحفظ")}
            </h1>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="container py-4 space-y-4">
        {/* Daily goal + Streak */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <DailyGoalCard />
          <StreakCard />
        </div>

        {/* Global stats */}
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-accent" />
            <span className="font-semibold text-foreground">
              {t("সামগ্রিক অগ্রগতি", "Overall Progress", "التقدم العام")}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="rounded-lg bg-accent/10 p-3 text-center">
              <p className="text-2xl font-bold text-accent">{globalStats.mastered}</p>
              <p className="text-xs text-muted-foreground">{t("মুখস্থ আয়াত", "Mastered", "آيات محفوظة")}</p>
            </div>
            <div className="rounded-lg bg-primary/10 p-3 text-center">
              <p className="text-2xl font-bold text-primary">{globalStats.learning}</p>
              <p className="text-xs text-muted-foreground">{t("শিখছে", "Learning", "تعلم")}</p>
            </div>
            <div className="rounded-lg bg-destructive/10 p-3 text-center">
              <p className="text-2xl font-bold text-destructive">{globalStats.due}</p>
              <p className="text-xs text-muted-foreground">{t("রিভিউ প্রয়োজন", "Due", "مراجعة")}</p>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{startedSurahs}</p>
              <p className="text-xs text-muted-foreground">{t("সূরা শুরু", "Started", "سور بدأت")}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{globalStats.mastered}/{globalStats.total} {t("আয়াত", "ayahs", "آيات")}</span>
              <span>{globalProgress}%</span>
            </div>
            <div className="w-full h-3 rounded-full bg-muted overflow-hidden flex">
              <div className="h-full bg-accent transition-all" style={{ width: `${(globalStats.mastered / Math.max(globalStats.total, 1)) * 100}%` }} />
              <div className="h-full bg-primary transition-all" style={{ width: `${(globalStats.learning / Math.max(globalStats.total, 1)) * 100}%` }} />
              <div className="h-full bg-destructive/60 transition-all" style={{ width: `${(globalStats.due / Math.max(globalStats.total, 1)) * 100}%` }} />
            </div>
          </div>
        </div>

        {/* Search & sort */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={t("সূরা খুঁজুন...", "Search surah...", "ابحث عن سورة...")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
            {(["number", "progress", "due"] as SortMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setSortMode(mode)}
                className={`px-3 py-2 text-xs transition-colors ${
                  sortMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {mode === "number" ? "#" : mode === "progress" ? <TrendingUp className="w-3 h-3" /> : <Flame className="w-3 h-3" />}
              </button>
            ))}
          </div>
        </div>

        {/* Surah list */}
        <ScrollArea className="h-[calc(100vh-380px)]">
          <div className="space-y-2">
            {filtered.map(surah => {
              const { stats } = surah;
              const hasActivity = stats.mastered + stats.learning + stats.due > 0;
              const pct = stats.total > 0 ? Math.round((stats.mastered / stats.total) * 100) : 0;

              return (
                <Link
                  key={surah.number}
                  to={`/quran?surah=${surah.number}`}
                  className="block rounded-xl border border-border bg-card p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                      {surah.number}
                    </span>

                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium text-sm text-foreground truncate">
                          {language === "bn" ? surah.bengaliName : surah.englishName}
                        </span>
                        <span className="font-arabic text-base text-primary shrink-0 ml-2">{surah.name}</span>
                      </div>

                      {hasActivity ? (
                        <>
                          <div className="flex gap-3 text-[10px] text-muted-foreground mb-1.5">
                            <span className="text-accent">✓ {stats.mastered}</span>
                            <span className="text-primary">◐ {stats.learning}</span>
                            {stats.due > 0 && <span className="text-destructive">⟳ {stats.due}</span>}
                            <span>/ {stats.total}</span>
                          </div>
                          <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden flex">
                            <div className="h-full bg-accent" style={{ width: `${(stats.mastered / stats.total) * 100}%` }} />
                            <div className="h-full bg-primary" style={{ width: `${(stats.learning / stats.total) * 100}%` }} />
                            <div className="h-full bg-destructive/60" style={{ width: `${(stats.due / stats.total) * 100}%` }} />
                          </div>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {surah.numberOfAyahs} {t("আয়াত", "ayahs", "آيات")} · {t("শুরু করুন", "Not started", "لم يبدأ")}
                        </span>
                      )}
                    </div>

                    {hasActivity && (
                      <span className={`text-xs font-bold shrink-0 ${
                        pct === 100 ? "text-accent" : pct > 50 ? "text-primary" : "text-muted-foreground"
                      }`}>
                        {pct}%
                      </span>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
