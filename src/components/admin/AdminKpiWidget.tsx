import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, UserCheck, Mic, TrendingUp, ExternalLink, User as UserIcon } from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";

type Range = 7 | 30 | 90;

interface TopUser {
  user_id: string;
  attempts: number;
  display_name: string | null;
  avatar_url: string | null;
}

interface KpiData {
  totalUsers: number;
  dau: number;
  wau: number;
  mau: number;
  totalAttempts: number;
  attemptsByDay: { date: string; attempts: number; users: number }[];
  topUsers: TopUser[];
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

function buildDayBuckets(days: number) {
  const out: Record<string, { attempts: number; users: Set<string> }> = {};
  const today = startOfDay(new Date());
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out[d.toISOString().slice(0, 10)] = { attempts: 0, users: new Set<string>() };
  }
  return out;
}

export default function AdminKpiWidget() {
  const [range, setRange] = useState<Range>(30);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<KpiData | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const since = new Date();
        since.setDate(since.getDate() - range);
        const since1 = new Date();
        since1.setHours(0, 0, 0, 0);
        const since7 = new Date();
        since7.setDate(since7.getDate() - 7);
        const since30 = new Date();
        since30.setDate(since30.getDate() - 30);

        const [profilesAll, sessionsAll, sessionsRange] = await Promise.all([
          supabase.from("profiles").select("*", { count: "exact", head: true }),
          supabase.from("recitation_sessions").select("*", { count: "exact", head: true }),
          supabase
            .from("recitation_sessions")
            .select("user_id, created_at")
            .gte("created_at", since.toISOString())
            .order("created_at", { ascending: true }),
        ]);

        const sessions = (sessionsRange.data ?? []) as { user_id: string; created_at: string }[];

        const dauSet = new Set<string>();
        const wauSet = new Set<string>();
        const mauSet = new Set<string>();
        sessions.forEach((s) => {
          const t = new Date(s.created_at);
          if (t >= since1) dauSet.add(s.user_id);
          if (t >= since7) wauSet.add(s.user_id);
          if (t >= since30) mauSet.add(s.user_id);
        });

        const buckets = buildDayBuckets(range);
        sessions.forEach((s) => {
          const k = dayKey(s.created_at);
          if (k in buckets) {
            buckets[k].attempts += 1;
            buckets[k].users.add(s.user_id);
          }
        });
        const attemptsByDay = Object.entries(buckets).map(([date, v]) => ({
          date: date.slice(5),
          attempts: v.attempts,
          users: v.users.size,
        }));

        // Top active users by attempts in range
        const counts = new Map<string, number>();
        sessions.forEach((s) => counts.set(s.user_id, (counts.get(s.user_id) ?? 0) + 1));
        const topIds = Array.from(counts.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10);

        let topUsers: TopUser[] = [];
        if (topIds.length > 0) {
          const ids = topIds.map(([id]) => id);
          const { data: profs } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", ids);
          const map = new Map((profs ?? []).map((p: any) => [p.user_id, p]));
          topUsers = topIds.map(([user_id, attempts]) => {
            const p = map.get(user_id);
            return {
              user_id,
              attempts,
              display_name: p?.display_name ?? null,
              avatar_url: p?.avatar_url ?? null,
            };
          });
        }

        if (cancelled) return;
        setData({
          totalUsers: profilesAll.count ?? 0,
          dau: dauSet.size,
          wau: wauSet.size,
          mau: mauSet.size,
          totalAttempts: sessionsAll.count ?? 0,
          attemptsByDay,
          topUsers,
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
            <TrendingUp className="w-4 h-4 text-primary" />
            User & Recitation Activity
          </h3>
          <p className="text-[11px] text-muted-foreground">
            Active users measured by recitation sessions in the period.
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
          </div>
          <Skeleton className="h-48" />
          <Skeleton className="h-32" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <MiniStat icon={Users} label="Total users" value={data.totalUsers} tone="primary" />
            <MiniStat icon={UserCheck} label="DAU (today)" value={data.dau} tone="accent" />
            <MiniStat icon={UserCheck} label="WAU (7d)" value={data.wau} tone="accent" />
            <MiniStat icon={Mic} label={`Attempts (${range}d)`} value={data.totalAttempts} tone="primary" />
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Recitation attempts / day
            </p>
            <div className="h-48">
              <ResponsiveContainer>
                <AreaChart data={data.attemptsByDay} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
                  <defs>
                    <linearGradient id="attempts-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
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
                  <Area
                    type="monotone"
                    dataKey="attempts"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    fill="url(#attempts-grad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
              Active users / day
            </p>
            <div className="h-32">
              <ResponsiveContainer>
                <BarChart data={data.attemptsByDay} margin={{ top: 4, right: 8, left: -12, bottom: 0 }}>
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
                  <Bar dataKey="users" fill="hsl(var(--accent))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({
  icon: Icon, label, value, tone,
}: { icon: any; label: string; value: number; tone: "primary" | "accent" }) {
  const toneClass = tone === "primary" ? "text-primary bg-primary/10" : "text-accent-foreground bg-accent/15";
  return (
    <div className="rounded-lg border bg-background/40 p-2.5">
      <div className="flex items-center gap-2">
        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${toneClass}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider truncate">{label}</p>
          <p className="text-base font-bold text-foreground leading-tight">{value.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
