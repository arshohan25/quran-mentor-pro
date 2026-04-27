import { useEffect, useState } from "react";
import { Layers } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

type Range = 7 | 30 | 90;

const MODE_LABELS: Record<string, string> = {
  practice: "Practice",
  hifz: "Hifz review",
  live: "Live check",
  lesson: "Lesson",
};

const MODE_COLORS: Record<string, string> = {
  practice: "hsl(var(--primary))",
  hifz: "hsl(var(--accent))",
  live: "hsl(152 55% 45%)",
  lesson: "hsl(45 70% 45%)",
};

interface ModeBucket {
  mode: string;
  label: string;
  attempts: number;
  avgAccuracy: number;
  color: string;
}

interface DailyRow {
  date: string;
  [key: string]: number | string;
}

interface Data {
  totals: ModeBucket[];
  daily: DailyRow[];
  modes: string[];
  totalAttempts: number;
}

function buildDays(range: number) {
  const out: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = range - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export default function AdminModeBreakdownWidget() {
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

        const { data: rows } = await supabase
          .from("recitation_sessions")
          .select("mode, accuracy, created_at")
          .gte("created_at", since.toISOString())
          .limit(10000);

        const sessions = (rows ?? []) as { mode: string | null; accuracy: number; created_at: string }[];

        const tally = new Map<string, { attempts: number; sum: number }>();
        sessions.forEach((s) => {
          const m = s.mode || "practice";
          const t = tally.get(m) ?? { attempts: 0, sum: 0 };
          t.attempts += 1;
          t.sum += s.accuracy ?? 0;
          tally.set(m, t);
        });

        const totals: ModeBucket[] = Array.from(tally.entries())
          .map(([mode, t]) => ({
            mode,
            label: MODE_LABELS[mode] ?? mode,
            attempts: t.attempts,
            avgAccuracy: t.attempts > 0 ? Math.round((t.sum / t.attempts) * 100) : 0,
            color: MODE_COLORS[mode] ?? "hsl(var(--muted-foreground))",
          }))
          .sort((a, b) => b.attempts - a.attempts);

        const modes = totals.map((t) => t.mode);
        const days = buildDays(range);
        const dailyMap = new Map<string, DailyRow>();
        days.forEach((d) => {
          const row: DailyRow = { date: d.slice(5) };
          modes.forEach((m) => (row[m] = 0));
          dailyMap.set(d, row);
        });
        sessions.forEach((s) => {
          const k = s.created_at.slice(0, 10);
          const row = dailyMap.get(k);
          if (!row) return;
          const m = s.mode || "practice";
          row[m] = ((row[m] as number) ?? 0) + 1;
        });
        const daily = Array.from(dailyMap.values());

        if (cancelled) return;
        setData({
          totals,
          daily,
          modes,
          totalAttempts: sessions.length,
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
            <Layers className="w-4 h-4 text-primary" />
            Recitation attempts by mode
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Practice vs Hifz review vs Live check vs Lesson, in the selected range.
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
        <div className="space-y-3">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      ) : data.totalAttempts === 0 ? (
        <p className="text-xs text-muted-foreground italic px-1 py-6 text-center">
          No recitation attempts recorded in the last {range} days.
        </p>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Pie + numeric breakdown */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Share of attempts
            </p>
            <div className="h-48">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data.totals}
                    dataKey="attempts"
                    nameKey="label"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {data.totals.map((t) => (
                      <Cell key={t.mode} fill={t.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-2 space-y-1">
              {data.totals.map((t) => {
                const pct = data.totalAttempts > 0
                  ? Math.round((t.attempts / data.totalAttempts) * 100)
                  : 0;
                return (
                  <li key={t.mode} className="flex items-center gap-2 text-xs">
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: t.color }} />
                    <span className="font-medium text-foreground flex-1 truncate">{t.label}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {t.attempts.toLocaleString()} ({pct}%) · {t.avgAccuracy}% acc
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Stacked bar over time */}
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Attempts per day by mode
            </p>
            <div className="h-48">
              <ResponsiveContainer>
                <BarChart data={data.daily} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={Math.ceil(range / 8)} />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} width={28} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  {data.modes.map((m) => (
                    <Bar
                      key={m}
                      dataKey={m}
                      stackId="a"
                      name={MODE_LABELS[m] ?? m}
                      fill={MODE_COLORS[m] ?? "hsl(var(--muted-foreground))"}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
