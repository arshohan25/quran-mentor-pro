import { useEffect, useState } from "react";
import { BookOpen, Sparkles, Layers3 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { surahList } from "@/data/surahList";

type Range = 7 | 30 | 90;

interface SurahRow {
  surah: number;
  name: string;
  attempts: number;
  avgAccuracy: number;
}

interface ReciterRow {
  reciter: string;
  attempts: number;
}

interface HifzBucket {
  label: string;
  count: number;
}

interface Data {
  topSurahs: SurahRow[];
  topReciters: ReciterRow[];
  hifzTotal: number;
  hifzDueNow: number;
  hifzMastered: number;
  hifzBuckets: HifzBucket[];
  avgEase: number;
}

function surahName(n: number): string {
  const s = surahList.find((x) => x.number === n);
  return s ? `${n}. ${s.englishName}` : `Surah ${n}`;
}

export default function AdminEngagementWidget() {
  const [range, setRange] = useState<Range>(30);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const since = new Date();
        since.setDate(since.getDate() - range);
        const nowIso = new Date().toISOString();

        const [{ data: sessions }, { data: hifz }] = await Promise.all([
          supabase
            .from("recitation_sessions")
            .select("surah, reciter, accuracy, created_at")
            .gte("created_at", since.toISOString())
            .limit(10000),
          supabase
            .from("hifz_srs")
            .select("interval_days, ease_factor, next_review_at")
            .limit(10000),
        ]);

        // Top surahs
        const sTally = new Map<number, { attempts: number; sum: number }>();
        (sessions ?? []).forEach((s: any) => {
          if (!s.surah) return;
          const t = sTally.get(s.surah) ?? { attempts: 0, sum: 0 };
          t.attempts += 1;
          t.sum += s.accuracy ?? 0;
          sTally.set(s.surah, t);
        });
        const topSurahs: SurahRow[] = Array.from(sTally.entries())
          .map(([surah, t]) => ({
            surah,
            name: surahName(surah),
            attempts: t.attempts,
            avgAccuracy: t.attempts > 0 ? Math.round((t.sum / t.attempts) * 100) : 0,
          }))
          .sort((a, b) => b.attempts - a.attempts)
          .slice(0, 8);

        // Top reciters
        const rTally = new Map<string, number>();
        (sessions ?? []).forEach((s: any) => {
          const r = (s.reciter as string) || "—";
          rTally.set(r, (rTally.get(r) ?? 0) + 1);
        });
        const topReciters: ReciterRow[] = Array.from(rTally.entries())
          .map(([reciter, attempts]) => ({ reciter, attempts }))
          .sort((a, b) => b.attempts - a.attempts)
          .slice(0, 6);

        // Hifz retention
        const rows = hifz ?? [];
        const hifzTotal = rows.length;
        const hifzDueNow = rows.filter((r: any) => r.next_review_at && r.next_review_at <= nowIso).length;
        const hifzMastered = rows.filter((r: any) => (r.interval_days ?? 0) >= 21).length;
        const easeVals = rows
          .map((r: any) => Number(r.ease_factor ?? 0))
          .filter((n) => n > 0);
        const avgEase = easeVals.length
          ? Math.round((easeVals.reduce((a, b) => a + b, 0) / easeVals.length) * 100) / 100
          : 0;

        const buckets: HifzBucket[] = [
          { label: "New (0)", count: 0 },
          { label: "Learning (1–6d)", count: 0 },
          { label: "Young (7–20d)", count: 0 },
          { label: "Mature (21–59d)", count: 0 },
          { label: "Mastered (60d+)", count: 0 },
        ];
        rows.forEach((r: any) => {
          const d = Number(r.interval_days ?? 0);
          if (d <= 0) buckets[0].count += 1;
          else if (d < 7) buckets[1].count += 1;
          else if (d < 21) buckets[2].count += 1;
          else if (d < 60) buckets[3].count += 1;
          else buckets[4].count += 1;
        });

        if (cancelled) return;
        setData({
          topSurahs,
          topReciters,
          hifzTotal,
          hifzDueNow,
          hifzMastered,
          hifzBuckets: buckets,
          avgEase,
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [range]);

  return (
    <div className="rounded-xl border bg-card p-4 space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Engagement & Hifz retention
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Most-practised surahs and reciters, plus SRS memorisation health.
          </p>
        </div>
        <Tabs value={String(range)} onValueChange={(v) => setRange(Number(v) as Range)}>
          <TabsList className="h-8">
            <TabsTrigger value="7" className="text-xs h-6 px-2">7d</TabsTrigger>
            <TabsTrigger value="30" className="text-xs h-6 px-2">30d</TabsTrigger>
            <TabsTrigger value="90" className="text-xs h-6 px-2">90d</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {loading || !data ? (
        <div className="grid lg:grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-4">
          {/* Top surahs */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1">
              <BookOpen className="w-3 h-3" /> Top surahs ({range}d)
            </p>
            {data.topSurahs.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4">No attempts.</p>
            ) : (
              <ul className="space-y-1.5">
                {data.topSurahs.map((s) => {
                  const max = data.topSurahs[0].attempts || 1;
                  const pct = Math.max(4, Math.round((s.attempts / max) * 100));
                  return (
                    <li key={s.surah} className="text-xs">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-medium text-foreground truncate">{s.name}</span>
                        <span className="text-muted-foreground tabular-nums shrink-0">
                          {s.attempts} · {s.avgAccuracy}%
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Top reciters */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2 flex items-center gap-1">
              <Layers3 className="w-3 h-3" /> Top reciters ({range}d)
            </p>
            {data.topReciters.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4">No attempts.</p>
            ) : (
              <ul className="space-y-1.5">
                {data.topReciters.map((r) => {
                  const max = data.topReciters[0].attempts || 1;
                  const pct = Math.max(4, Math.round((r.attempts / max) * 100));
                  return (
                    <li key={r.reciter} className="text-xs">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="font-medium text-foreground truncate font-mono text-[11px]">
                          {r.reciter}
                        </span>
                        <span className="text-muted-foreground tabular-nums shrink-0">
                          {r.attempts}
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

          {/* Hifz retention */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">
              Hifz retention (all-time)
            </p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <MiniKpi label="Cards" value={data.hifzTotal} />
              <MiniKpi label="Due now" value={data.hifzDueNow} />
              <MiniKpi label="Mastered" value={data.hifzMastered} />
            </div>
            <p className="text-[10px] text-muted-foreground mb-1">
              Avg ease factor: <span className="font-bold text-foreground">{data.avgEase.toFixed(2)}</span>
            </p>
            {data.hifzTotal === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4">No SRS cards yet.</p>
            ) : (
              <ul className="space-y-1.5 mt-2">
                {data.hifzBuckets.map((b) => {
                  const pct = data.hifzTotal > 0 ? Math.round((b.count / data.hifzTotal) * 100) : 0;
                  return (
                    <li key={b.label} className="text-xs">
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-foreground">{b.label}</span>
                        <span className="text-muted-foreground tabular-nums">
                          {b.count} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary/70"
                          style={{ width: `${Math.max(2, pct)}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function MiniKpi({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-background/40 p-2 text-center">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-base font-bold text-foreground leading-tight">{value.toLocaleString()}</p>
    </div>
  );
}
