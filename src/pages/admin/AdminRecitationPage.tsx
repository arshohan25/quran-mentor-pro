import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, Cell } from "recharts";
import StatCard from "@/components/admin/StatCard";
import { Mic, Activity, AlertTriangle, Hash, Radio, Download, FileText, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { surahList } from "@/data/surahList";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const MODES = ["practice", "hifz", "live", "lesson"] as const;
type Mode = (typeof MODES)[number];

const MODE_LABELS: Record<Mode, string> = {
  practice: "Practice",
  hifz: "Hifz",
  live: "Live",
  lesson: "Lesson",
};

interface WrongAyah {
  surah: number;
  ayah: number;
  failures: number;
  attempts: number;
  totalErrors: number;
  failRate: number;
}

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
  const [wrongByMode, setWrongByMode] = useState<Record<Mode, WrongAyah[]>>({
    practice: [], hifz: [], live: [], lesson: [],
  });
  const [liveWrongCount, setLiveWrongCount] = useState(0);
  const [livePulse, setLivePulse] = useState(false);

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
          .select("surah, ayah, accuracy, error_words, hesitation_words, reciter, lesson_type, mode, created_at")
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

        const rKey = normalizeReciterKey(s.reciter);
        const r = reciterMap.get(rKey) ?? { attempts: 0, accSum: 0, accN: 0 };
        r.attempts += 1;
        r.accSum += s.accuracy ?? 0;
        r.accN += 1;
        reciterMap.set(rKey, r);

        const lKey = normalizeLessonKey(s.lesson_type);
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

      // Wrong-ayah aggregation per mode (a "wrong" attempt = at least 1 error word)
      const perMode: Record<Mode, Map<string, WrongAyah>> = {
        practice: new Map(), hifz: new Map(), live: new Map(), lesson: new Map(),
      };
      let liveWrong = 0;
      sessions.forEach((s: any) => {
        const m = (MODES as readonly string[]).includes(s.mode) ? (s.mode as Mode) : "practice";
        const errs = s.error_words ?? 0;
        const isWrong = errs > 0;
        if (m === "live" && isWrong) liveWrong += 1;
        if (s.ayah == null) return;
        const key = `${s.surah}:${s.ayah}`;
        const bucket = perMode[m].get(key) ?? {
          surah: s.surah, ayah: s.ayah, failures: 0, attempts: 0, totalErrors: 0, failRate: 0,
        };
        bucket.attempts += 1;
        if (isWrong) bucket.failures += 1;
        bucket.totalErrors += errs;
        perMode[m].set(key, bucket);
      });
      const wrong: Record<Mode, WrongAyah[]> = {
        practice: [], hifz: [], live: [], lesson: [],
      };
      (Object.keys(perMode) as Mode[]).forEach((m) => {
        wrong[m] = Array.from(perMode[m].values())
          .map((w) => ({ ...w, failRate: w.attempts > 0 ? w.failures / w.attempts : 0 }))
          .filter((w) => w.failures > 0)
          .sort((a, b) => b.failures - a.failures || b.failRate - a.failRate)
          .slice(0, 25);
      });
      setWrongByMode(wrong);
      setLiveWrongCount(liveWrong);

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

  // Realtime: bump live counter when new wrong sessions arrive
  useEffect(() => {
    const channel = supabase
      .channel("admin-recitation-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "recitation_sessions" },
        (payload) => {
          const s: any = payload.new;
          if ((s?.error_words ?? 0) > 0) {
            setLiveWrongCount((c) => c + 1);
            setLivePulse(true);
            setTimeout(() => setLivePulse(false), 800);
            // Merge into the right mode bucket if ayah is known
            if (s.ayah != null) {
              const m = (MODES as readonly string[]).includes(s.mode) ? (s.mode as Mode) : "practice";
              setWrongByMode((prev) => {
                const list = [...prev[m]];
                const idx = list.findIndex((w) => w.surah === s.surah && w.ayah === s.ayah);
                if (idx >= 0) {
                  const cur = list[idx];
                  list[idx] = {
                    ...cur,
                    attempts: cur.attempts + 1,
                    failures: cur.failures + 1,
                    totalErrors: cur.totalErrors + (s.error_words ?? 0),
                    failRate: (cur.failures + 1) / (cur.attempts + 1),
                  };
                } else {
                  list.unshift({
                    surah: s.surah, ayah: s.ayah,
                    attempts: 1, failures: 1,
                    totalErrors: s.error_words ?? 0, failRate: 1,
                  });
                }
                list.sort((a, b) => b.failures - a.failures || b.failRate - a.failRate);
                return { ...prev, [m]: list.slice(0, 25) };
              });
            }
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const hasReciterData = useMemo(
    () => byReciter.some((r) => r.key !== "(unspecified)"),
    [byReciter]
  );
  const hasLessonData = useMemo(
    () => byLessonType.some((r) => r.key !== "(unspecified)"),
    [byLessonType]
  );

  const surahName = (n: number) =>
    surahList.find((s) => s.number === n)?.englishName ?? `Surah ${n}`;

  const exportCsv = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const lines: string[] = [];
    const push = (row: (string | number)[] = []) =>
      lines.push(row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));

    push([`Recitation Report - last ${range} days`]);
    push([`Generated`, new Date().toISOString()]);
    push();
    push(["Totals"]);
    push(["Sessions", totals.sessions]);
    push(["Avg accuracy %", totals.avgAccuracy]);
    push(["Total errors", totals.totalErrors]);
    push(["Tracked weak words", totals.weakestN]);
    push();
    push(["Attempts by accuracy grade"]);
    push(["Grade", "Attempts"]);
    byGrade.forEach((g) => push([g.label, g.attempts]));
    push();
    push(["Top surahs by sessions"]);
    push(["Surah", "Sessions"]);
    bySurah.forEach((r) => push([surahName(r.surah), r.n]));
    push();
    push(["Attempts by reciter"]);
    push(["Reciter", "Attempts", "Avg accuracy %"]);
    byReciter.forEach((r) => push([r.key, r.attempts, r.avgAccuracy]));
    push();
    push(["Attempts by lesson type"]);
    push(["Lesson type", "Attempts", "Avg accuracy %"]);
    byLessonType.forEach((r) => push([r.key, r.attempts, r.avgAccuracy]));
    push();
    push(["Commonly failed ayahs by mode"]);
    push(["Mode", "Surah", "Ayah", "Failures", "Attempts", "Total errors", "Fail rate %"]);
    (Object.keys(wrongByMode) as Mode[]).forEach((m) => {
      wrongByMode[m].forEach((w) =>
        push([
          MODE_LABELS[m],
          surahName(w.surah),
          w.ayah,
          w.failures,
          w.attempts,
          w.totalErrors,
          Math.round(w.failRate * 100),
        ])
      );
    });

    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recitation-report-${range}d-${stamp}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported", description: `Last ${range} days` });
  };

  const exportPdf = () => {
    const stamp = new Date().toISOString().slice(0, 10);
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = doc.internal.pageSize.getWidth();

    doc.setFontSize(18);
    doc.text("Recitation Analytics Report", 40, 50);
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text(`Range: last ${range} days`, 40, 68);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 82);
    doc.setTextColor(0);

    autoTable(doc, {
      startY: 100,
      head: [["Metric", "Value"]],
      body: [
        ["Sessions", String(totals.sessions)],
        ["Avg accuracy", `${totals.avgAccuracy}%`],
        ["Total errors", String(totals.totalErrors)],
        ["Tracked weak words", String(totals.weakestN)],
      ],
      theme: "grid",
      headStyles: { fillColor: [40, 100, 70] },
      styles: { fontSize: 10 },
    });

    autoTable(doc, {
      head: [["Accuracy grade", "Attempts"]],
      body: byGrade.map((g) => [g.label, String(g.attempts)]),
      theme: "striped",
      headStyles: { fillColor: [40, 100, 70] },
      styles: { fontSize: 10 },
    });

    autoTable(doc, {
      head: [["Surah", "Sessions"]],
      body: bySurah.map((r) => [surahName(r.surah), String(r.n)]),
      theme: "striped",
      headStyles: { fillColor: [40, 100, 70] },
      styles: { fontSize: 10 },
    });

    if (byReciter.length) {
      autoTable(doc, {
        head: [["Reciter", "Attempts", "Avg accuracy %"]],
        body: byReciter.map((r) => [r.key, String(r.attempts), String(r.avgAccuracy)]),
        theme: "striped",
        headStyles: { fillColor: [40, 100, 70] },
        styles: { fontSize: 10 },
      });
    }

    if (byLessonType.length) {
      autoTable(doc, {
        head: [["Lesson type", "Attempts", "Avg accuracy %"]],
        body: byLessonType.map((r) => [r.key, String(r.attempts), String(r.avgAccuracy)]),
        theme: "striped",
        headStyles: { fillColor: [40, 100, 70] },
        styles: { fontSize: 10 },
      });
    }

    (Object.keys(wrongByMode) as Mode[]).forEach((m) => {
      const rows = wrongByMode[m];
      if (!rows.length) return;
      autoTable(doc, {
        head: [[`Failed ayahs - ${MODE_LABELS[m]}`, "Failures", "Attempts", "Errors", "Fail %"]],
        body: rows.map((w) => [
          `${surahName(w.surah)} - Ayah ${w.ayah}`,
          String(w.failures),
          String(w.attempts),
          String(w.totalErrors),
          `${Math.round(w.failRate * 100)}%`,
        ]),
        theme: "grid",
        headStyles: { fillColor: [180, 60, 60] },
        styles: { fontSize: 9 },
      });
    });

    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 80, doc.internal.pageSize.getHeight() - 20);
    }

    doc.save(`recitation-report-${range}d-${stamp}.pdf`);
    toast({ title: "PDF exported", description: `Last ${range} days` });
  };

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recitation Analytics</h1>
          <p className="text-sm text-muted-foreground">Aggregate trends across all users (last {range} days).</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Tabs value={String(range)} onValueChange={(v) => setRange(Number(v) as RangeDays)}>
            <TabsList>
              <TabsTrigger value="7">7d</TabsTrigger>
              <TabsTrigger value="30">30d</TabsTrigger>
              <TabsTrigger value="90">90d</TabsTrigger>
            </TabsList>
          </Tabs>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export report
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={exportPdf} className="gap-2">
                <FileText className="h-4 w-4" /> PDF (.pdf)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={exportCsv} className="gap-2">
                <FileSpreadsheet className="h-4 w-4" /> CSV (.csv)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
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
        <div className="flex items-center justify-between gap-3 flex-wrap mb-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              Commonly failed ayahs by mode
              <span className="inline-flex items-center gap-1.5 rounded-full border border-destructive/40 bg-destructive/10 px-2 py-0.5 text-[11px] font-medium text-destructive">
                <Radio className={`h-3 w-3 ${livePulse ? "animate-ping" : ""}`} />
                Live · {liveWrongCount.toLocaleString()} wrong
              </span>
            </h3>
            <p className="text-xs text-muted-foreground">
              Ayahs with the most failed attempts (last {range} days). Click to open in the Quran reader.
            </p>
          </div>
        </div>
        <Tabs defaultValue="practice">
          <TabsList>
            {MODES.map((m) => {
              const total = wrongByMode[m].reduce((sum, w) => sum + w.failures, 0);
              return (
                <TabsTrigger key={m} value={m} className="gap-2">
                  {MODE_LABELS[m]}
                  <Badge variant="outline" className="px-1.5 py-0 text-[10px] font-semibold">{total}</Badge>
                </TabsTrigger>
              );
            })}
          </TabsList>
          {MODES.map((m) => {
            const list = wrongByMode[m];
            const maxFails = list.reduce((mx, w) => Math.max(mx, w.failures), 1);
            return (
              <TabsContent key={m} value={m} className="mt-3">
                {list.length === 0 ? (
                  <p className="text-sm text-muted-foreground italic text-center py-8">
                    No failed ayahs recorded for {MODE_LABELS[m]} mode in this window.
                  </p>
                ) : (
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {list.map((w) => {
                      const sName = surahList.find((s) => s.number === w.surah)?.englishName ?? `Surah ${w.surah}`;
                      const intensity = w.failures / maxFails;
                      const sev = w.failRate >= 0.7
                        ? "hsl(var(--destructive))"
                        : w.failRate >= 0.4
                        ? "hsl(28 80% 55%)"
                        : "hsl(45 70% 55%)";
                      return (
                        <li key={`${w.surah}:${w.ayah}`}>
                          <Link
                            to={`/quran?surah=${w.surah}&ayah=${w.ayah}`}
                            className="group block rounded-lg border bg-background/40 p-3 hover:bg-muted/40 transition-colors"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="inline-block w-2.5 h-2.5 rounded-full shrink-0" style={{ background: sev }} aria-hidden />
                                <div className="min-w-0">
                                  <div className="text-sm font-medium truncate text-foreground group-hover:text-primary">
                                    {sName} · Ayah {w.ayah}
                                  </div>
                                  <div className="text-[11px] text-muted-foreground">
                                    {w.failures} fails / {w.attempts} attempts · {w.totalErrors} word errors
                                  </div>
                                </div>
                              </div>
                              <Badge className="shrink-0 text-[10px] font-semibold border-0" style={{ background: sev, color: "white" }}>
                                {Math.round(w.failRate * 100)}%
                              </Badge>
                            </div>
                            <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                              <div className="h-full rounded-full" style={{ width: `${Math.max(6, intensity * 100)}%`, background: sev }} />
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
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
