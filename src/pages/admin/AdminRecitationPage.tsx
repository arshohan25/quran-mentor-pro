import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import StatCard from "@/components/admin/StatCard";
import { Mic, Activity, AlertTriangle, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type RangeDays = 7 | 30 | 90;

interface BreakdownRow {
  key: string;
  attempts: number;
  avgAccuracy: number;
}

export default function AdminRecitationPage() {
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<RangeDays>(30);
  const [totals, setTotals] = useState({ sessions: 0, avgAccuracy: 0, totalErrors: 0, weakestN: 0 });
  const [bySurah, setBySurah] = useState<{ surah: number; n: number }[]>([]);
  const [byReciter, setByReciter] = useState<BreakdownRow[]>([]);
  const [byLessonType, setByLessonType] = useState<BreakdownRow[]>([]);
  const [weakest, setWeakest] = useState<any[]>([]);
  const [byGrade, setByGrade] = useState<{ grade: string; label: string; attempts: number; fill: string }[]>([]);

  const GRADE_BUCKETS: { grade: string; label: string; min: number; max: number; fill: string }[] = [
    { grade: "A", label: "A · 90–100%", min: 0.9, max: 1.0001, fill: "hsl(152 55% 38%)" },
    { grade: "B", label: "B · 75–89%", min: 0.75, max: 0.9, fill: "hsl(152 45% 50%)" },
    { grade: "C", label: "C · 60–74%", min: 0.6, max: 0.75, fill: "hsl(45 70% 55%)" },
    { grade: "D", label: "D · 40–59%", min: 0.4, max: 0.6, fill: "hsl(28 80% 55%)" },
    { grade: "F", label: "F · <40%", min: 0, max: 0.4, fill: "hsl(var(--destructive))" },
  ];

  useEffect(() => {
    (async () => {
      setLoading(true);
      const since = new Date();
      since.setDate(since.getDate() - range);

      const [sessionsRes, weakRes] = await Promise.all([
        supabase
          .from("recitation_sessions")
          .select("surah, accuracy, error_words, hesitation_words, reciter, lesson_type, created_at")
          .gte("created_at", since.toISOString())
          .limit(10000),
        supabase
          .from("recitation_word_stats")
          .select("surah, ayah, word_index, errors, attempts")
          .gte("attempts", 3)
          .order("errors", { ascending: false })
          .limit(20),
      ]);

      const sessions = sessionsRes.data ?? [];
      const surahMap: Record<number, number> = {};
      const reciterMap = new Map<string, { attempts: number; accSum: number; accN: number }>();
      const lessonMap = new Map<string, { attempts: number; accSum: number; accN: number }>();
      let accSum = 0, accN = 0, errSum = 0;
      sessions.forEach((s: any) => {
        surahMap[s.surah] = (surahMap[s.surah] ?? 0) + 1;
        accSum += s.accuracy ?? 0;
        accN += 1;
        errSum += s.error_words ?? 0;

        const rKey = (s.reciter as string | null) ?? "(unspecified)";
        const r = reciterMap.get(rKey) ?? { attempts: 0, accSum: 0, accN: 0 };
        r.attempts += 1;
        r.accSum += s.accuracy ?? 0;
        r.accN += 1;
        reciterMap.set(rKey, r);

        const lKey = (s.lesson_type as string | null) ?? "(unspecified)";
        const l = lessonMap.get(lKey) ?? { attempts: 0, accSum: 0, accN: 0 };
        l.attempts += 1;
        l.accSum += s.accuracy ?? 0;
        l.accN += 1;
        lessonMap.set(lKey, l);
      });
      const bySurahArr = Object.entries(surahMap)
        .map(([s, n]) => ({ surah: +s, n }))
        .sort((a, b) => b.n - a.n)
        .slice(0, 12);

      const toRows = (m: Map<string, { attempts: number; accSum: number; accN: number }>): BreakdownRow[] =>
        Array.from(m.entries())
          .map(([key, v]) => ({
            key,
            attempts: v.attempts,
            avgAccuracy: v.accN > 0 ? Math.round((v.accSum / v.accN) * 100) : 0,
          }))
          .sort((a, b) => b.attempts - a.attempts)
          .slice(0, 12);

      setBySurah(bySurahArr);
      setByReciter(toRows(reciterMap));
      setByLessonType(toRows(lessonMap));

      const gradeCounts = GRADE_BUCKETS.map((b) => ({
        grade: b.grade,
        label: b.label,
        fill: b.fill,
        attempts: sessions.filter((s: any) => {
          const a = s.accuracy ?? 0;
          return a >= b.min && a < b.max;
        }).length,
      }));
      setByGrade(gradeCounts);
      setTotals({
        sessions: sessions.length,
        avgAccuracy: accN > 0 ? Math.round((accSum / accN) * 100) : 0,
        totalErrors: errSum,
        weakestN: (weakRes.data ?? []).length,
      });
      setWeakest(weakRes.data ?? []);
      setLoading(false);
    })();
  }, [range]);

  const hasReciterData = useMemo(
    () => byReciter.some((r) => r.key !== "(unspecified)"),
    [byReciter]
  );
  const hasLessonData = useMemo(
    () => byLessonType.some((r) => r.key !== "(unspecified)"),
    [byLessonType]
  );

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recitation Analytics</h1>
          <p className="text-sm text-muted-foreground">Aggregate trends across all users (last {range} days).</p>
        </div>
        <Tabs value={String(range)} onValueChange={(v) => setRange(Number(v) as RangeDays)}>
          <TabsList>
            <TabsTrigger value="7">7d</TabsTrigger>
            <TabsTrigger value="30">30d</TabsTrigger>
            <TabsTrigger value="90">90d</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label={`Sessions (${range}d)`} value={totals.sessions} icon={Mic} tone="primary" />
        <StatCard label="Avg Accuracy" value={`${totals.avgAccuracy}%`} icon={Activity} tone="accent" />
        <StatCard label="Total Errors" value={totals.totalErrors} icon={AlertTriangle} tone="muted" />
        <StatCard label="Tracked Weak Words" value={totals.weakestN} icon={Hash} tone="primary" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-bold text-foreground mb-1">Attempts by reciter</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {hasReciterData ? "Distribution of recitation attempts across selected qaris." : "No reciter tagged on sessions yet — new sessions will be tagged once a qari is selected in the player."}
          </p>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={byReciter} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis dataKey="key" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="attempts" name="Attempts" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-bold text-foreground mb-1">Attempts by lesson type</h3>
          <p className="text-xs text-muted-foreground mb-3">
            {hasLessonData ? "Distribution of recitation attempts across lesson styles." : "No lesson type tagged on sessions yet — new sessions will be tagged once selected."}
          </p>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={byLessonType} layout="vertical" margin={{ left: 8 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
                <YAxis dataKey="key" type="category" tick={{ fontSize: 10 }} width={120} />
                <Tooltip />
                <Legend />
                <Bar dataKey="attempts" name="Attempts" fill="hsl(var(--accent))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>


      <div className="rounded-xl border bg-card p-4">
        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground">Attempts by accuracy grade</h3>
            <p className="text-xs text-muted-foreground">
              Distribution of sessions across performance bands (last {range} days).
            </p>
          </div>
          <div className="text-xs text-muted-foreground">
            {totals.sessions.toLocaleString()} total · avg {totals.avgAccuracy}%
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer>
            <BarChart data={byGrade}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip
                formatter={(val: any) => [
                  `${val} (${totals.sessions > 0 ? Math.round((Number(val) / totals.sessions) * 100) : 0}%)`,
                  "Attempts",
                ]}
              />
              <Bar dataKey="attempts" radius={[4, 4, 0, 0]}>
                {byGrade.map((g) => (
                  <Cell key={g.grade} fill={g.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
          {byGrade.map((g) => {
            const pct = totals.sessions > 0 ? Math.round((g.attempts / totals.sessions) * 100) : 0;
            return (
              <div key={g.grade} className="rounded-md border bg-background/40 px-2 py-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: g.fill }} />
                  <span className="font-semibold text-foreground">{g.grade}</span>
                </div>
                <div className="text-muted-foreground">{g.attempts} · {pct}%</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-4">
        <h3 className="text-sm font-bold text-foreground mb-3">Top surahs by session count</h3>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={bySurah}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="surah" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="n" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-sm font-bold text-foreground">Weakest words (most errors)</h3>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Surah:Ayah</TableHead>
              <TableHead>Word #</TableHead>
              <TableHead>Errors</TableHead>
              <TableHead>Attempts</TableHead>
              <TableHead>Error rate</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weakest.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                  No data yet.
                </TableCell>
              </TableRow>
            ) : (
              weakest.map((w, i) => (
                <TableRow key={i}>
                  <TableCell>{w.surah}:{w.ayah}</TableCell>
                  <TableCell>{w.word_index}</TableCell>
                  <TableCell className="text-destructive font-semibold">{w.errors}</TableCell>
                  <TableCell>{w.attempts}</TableCell>
                  <TableCell>{Math.round((w.errors / Math.max(1, w.attempts)) * 100)}%</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
