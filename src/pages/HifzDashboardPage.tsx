import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Brain, BookOpen, Search, Trophy, Flame, TrendingUp, Calendar, Clock, Zap } from "lucide-react";
import { surahList } from "@/data/surahList";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { getStreakStats } from "@/hooks/useStreakTracker";

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
        {/* Streak tracker */}
        <StreakCard />

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
