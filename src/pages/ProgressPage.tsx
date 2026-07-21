import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles, BookOpen, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { surahList } from "@/data/surahList";

interface Bucket { label: string; count: number; }
interface SurahRow { surah: number; name: string; total: number; mastered: number; due: number; }
interface Data {
  total: number;
  dueNow: number;
  mastered: number;
  avgEase: number;
  buckets: Bucket[];
  topSurahs: SurahRow[];
}

function surahName(n: number): string {
  const s = surahList.find((x) => x.number === n);
  return s ? `${n}. ${s.englishName}` : `Surah ${n}`;
}

export default function ProgressPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const nowIso = new Date().toISOString();
        const { data: rows } = await supabase
          .from("hifz_srs")
          .select("surah, interval_days, ease_factor, next_review_at")
          .eq("user_id", user.id)
          .limit(10000);

        const list = rows ?? [];
        const total = list.length;
        const dueNow = list.filter((r: any) => r.next_review_at && r.next_review_at <= nowIso).length;
        const mastered = list.filter((r: any) => (r.interval_days ?? 0) >= 21).length;
        const easeVals = list.map((r: any) => Number(r.ease_factor ?? 0)).filter((n) => n > 0);
        const avgEase = easeVals.length
          ? Math.round((easeVals.reduce((a, b) => a + b, 0) / easeVals.length) * 100) / 100
          : 0;

        const buckets: Bucket[] = [
          { label: t("নতুন (0)", "New (0)", "جديد (0)"), count: 0 },
          { label: t("শিখছে (১–৬ দিন)", "Learning (1–6d)", "تعلم (1–6ي)"), count: 0 },
          { label: t("তরুণ (৭–২০ দিন)", "Young (7–20d)", "شاب (7–20ي)"), count: 0 },
          { label: t("পরিপক্ব (২১–৫৯ দিন)", "Mature (21–59d)", "ناضج (21–59ي)"), count: 0 },
          { label: t("মুখস্থ (৬০+ দিন)", "Mastered (60d+)", "محفوظ (60+ي)"), count: 0 },
        ];
        const perSurah = new Map<number, { total: number; mastered: number; due: number }>();
        list.forEach((r: any) => {
          const d = Number(r.interval_days ?? 0);
          if (d <= 0) buckets[0].count += 1;
          else if (d < 7) buckets[1].count += 1;
          else if (d < 21) buckets[2].count += 1;
          else if (d < 60) buckets[3].count += 1;
          else buckets[4].count += 1;
          if (r.surah) {
            const cur = perSurah.get(r.surah) ?? { total: 0, mastered: 0, due: 0 };
            cur.total += 1;
            if (d >= 21) cur.mastered += 1;
            if (r.next_review_at && r.next_review_at <= nowIso) cur.due += 1;
            perSurah.set(r.surah, cur);
          }
        });
        const topSurahs: SurahRow[] = Array.from(perSurah.entries())
          .map(([surah, v]) => ({ surah, name: surahName(surah), ...v }))
          .sort((a, b) => b.total - a.total)
          .slice(0, 10);

        if (!cancelled) setData({ total, dueNow, mastered, avgEase, buckets, topSurahs });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user, t]);

  return (
    <div className="min-h-screen bg-background">
      <header className="islamic-header">
        <div className="container flex items-center justify-between relative z-10">
          <div className="flex items-center gap-3">
            <Link to="/hifz" className="hover:opacity-80 p-1"><ArrowLeft className="w-5 h-5" strokeWidth={1.8} /></Link>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2 leading-tight">
                <TrendingUp className="w-5 h-5" strokeWidth={1.6} />
                {t("আমার অগ্রগতি", "My Progress", "تقدمي")}
              </h1>
              <p className="text-primary-foreground/60 text-[10px]">
                {t("SRS মুখস্থ অবস্থা", "SRS mastery breakdown", "تفصيل الحفظ")}
              </p>
            </div>
          </div>
          <LanguageSwitcher />
        </div>
      </header>

      <div className="container py-4 space-y-4">
        {!user ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              {t("অগ্রগতি দেখতে সাইন ইন করুন", "Sign in to see your progress", "سجل الدخول لرؤية تقدمك")}
            </p>
            <Link to="/auth" className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              {t("সাইন ইন", "Sign in", "تسجيل الدخول")}
            </Link>
          </div>
        ) : loading || !data ? (
          <div className="grid gap-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-48" />
            <Skeleton className="h-64" />
          </div>
        ) : data.total === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center">
            <Sparkles className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {t("এখনও কোনো SRS কার্ড নেই। হিফজ শুরু করুন!", "No SRS cards yet. Start memorizing!", "لا توجد بطاقات بعد. ابدأ الحفظ!")}
            </p>
            <Link to="/hifz" className="inline-block mt-3 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
              {t("হিফজ শুরু করুন", "Start Hifz", "ابدأ الحفظ")}
            </Link>
          </div>
        ) : (
          <>
            {/* KPI row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Kpi label={t("মোট কার্ড", "Cards", "بطاقات")} value={data.total} tone="muted" />
              <Kpi label={t("এখন প্রয়োজন", "Due now", "مستحق الآن")} value={data.dueNow} tone="destructive" />
              <Kpi label={t("মুখস্থ", "Mastered", "محفوظ")} value={data.mastered} tone="accent" />
              <Kpi label={t("গড় ইজ", "Avg ease", "متوسط السهولة")} value={data.avgEase.toFixed(2) as any} tone="primary" />
            </div>

            {/* Buckets */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {t("মুখস্থ অবস্থা", "Mastery breakdown", "تفصيل الحفظ")}
              </h2>
              <ul className="space-y-2">
                {data.buckets.map((b) => {
                  const pct = data.total > 0 ? Math.round((b.count / data.total) * 100) : 0;
                  return (
                    <li key={b.label} className="text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-foreground">{b.label}</span>
                        <span className="text-muted-foreground tabular-nums">{b.count} ({pct}%)</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary/70" style={{ width: `${Math.max(2, pct)}%` }} />
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Top surahs */}
            <div className="rounded-xl border border-border bg-card p-4">
              <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                {t("সূরা অনুযায়ী", "By surah", "حسب السورة")}
              </h2>
              {data.topSurahs.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">
                  {t("কোনো ডেটা নেই", "No data", "لا توجد بيانات")}
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.topSurahs.map((s) => {
                    const pct = s.total > 0 ? Math.round((s.mastered / s.total) * 100) : 0;
                    return (
                      <li key={s.surah} className="text-xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <Link to={`/quran?surah=${s.surah}`} className="font-medium text-foreground truncate hover:text-primary">
                            {s.name}
                          </Link>
                          <span className="text-muted-foreground tabular-nums shrink-0">
                            <span className="text-accent">{s.mastered}</span>/{s.total}
                            {s.due > 0 && <span className="text-destructive"> · {s.due} due</span>}
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {data.dueNow > 0 && (
              <Link to="/hifz/review" className="block rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-center hover:bg-destructive/15 transition-colors">
                <p className="text-sm font-semibold text-destructive">
                  {t(`এখন রিভিউ করুন (${data.dueNow})`, `Review now (${data.dueNow})`, `راجع الآن (${data.dueNow})`)}
                </p>
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, tone }: { label: string; value: number | string; tone: "muted" | "destructive" | "accent" | "primary" }) {
  const toneClass = {
    muted: "bg-muted border-border text-foreground",
    destructive: "bg-destructive/10 border-destructive/20 text-destructive",
    accent: "bg-accent/10 border-accent/20 text-accent",
    primary: "bg-primary/10 border-primary/20 text-primary",
  }[tone];
  return (
    <div className={`rounded-lg border p-3 text-center ${toneClass}`}>
      <p className="text-xl font-bold leading-tight tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
