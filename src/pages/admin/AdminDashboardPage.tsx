import { useEffect, useState } from "react";
import { Users, Mic, BookMarked, GraduationCap, TrendingUp, Activity } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import StatCard from "@/components/admin/StatCard";
import AdminKpiWidget from "@/components/admin/AdminKpiWidget";
import AdminModeBreakdownWidget from "@/components/admin/AdminModeBreakdownWidget";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

interface Stats {
  totalUsers: number;
  newUsers7d: number;
  totalSessions: number;
  avgAccuracy: number;
  totalBookmarks: number;
  totalHifz: number;
  signupsByDay: { date: string; count: number }[];
  accuracyByDay: { date: string; accuracy: number }[];
}

function dateNDaysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const since7 = new Date();
        since7.setDate(since7.getDate() - 7);
        const since30 = new Date();
        since30.setDate(since30.getDate() - 30);

        const [profilesAll, profilesNew, sessionsAll, sessionsRange, bookmarksAll, hifzAll] =
          await Promise.all([
            supabase.from("profiles").select("*", { count: "exact", head: true }),
            supabase
              .from("profiles")
              .select("created_at", { count: "exact" })
              .gte("created_at", since30.toISOString()),
            supabase.from("recitation_sessions").select("*", { count: "exact", head: true }),
            supabase
              .from("recitation_sessions")
              .select("accuracy, created_at")
              .gte("created_at", since30.toISOString()),
            supabase.from("bookmarks_sync").select("*", { count: "exact", head: true }),
            supabase.from("hifz_srs").select("*", { count: "exact", head: true }),
          ]);

        // signups by day (last 30)
        const buckets: Record<string, number> = {};
        for (let i = 29; i >= 0; i--) buckets[dateNDaysAgo(i)] = 0;
        (profilesNew.data ?? []).forEach((p: any) => {
          const k = (p.created_at as string).slice(0, 10);
          if (k in buckets) buckets[k]++;
        });
        const signupsByDay = Object.entries(buckets).map(([date, count]) => ({ date: date.slice(5), count }));

        // accuracy by day
        const accBuckets: Record<string, { sum: number; n: number }> = {};
        for (let i = 29; i >= 0; i--) accBuckets[dateNDaysAgo(i)] = { sum: 0, n: 0 };
        (sessionsRange.data ?? []).forEach((s: any) => {
          const k = (s.created_at as string).slice(0, 10);
          if (k in accBuckets) {
            accBuckets[k].sum += s.accuracy ?? 0;
            accBuckets[k].n += 1;
          }
        });
        const accuracyByDay = Object.entries(accBuckets).map(([date, { sum, n }]) => ({
          date: date.slice(5),
          accuracy: n > 0 ? Math.round((sum / n) * 100) : 0,
        }));

        const newUsers7d = (profilesNew.data ?? []).filter(
          (p: any) => new Date(p.created_at) >= since7
        ).length;

        const accs = (sessionsRange.data ?? []).map((s: any) => s.accuracy ?? 0);
        const avgAccuracy = accs.length ? Math.round((accs.reduce((a, b) => a + b, 0) / accs.length) * 100) : 0;

        setStats({
          totalUsers: profilesAll.count ?? 0,
          newUsers7d,
          totalSessions: sessionsAll.count ?? 0,
          avgAccuracy,
          totalBookmarks: bookmarksAll.count ?? 0,
          totalHifz: hifzAll.count ?? 0,
          signupsByDay,
          accuracyByDay,
        });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
        </div>
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
    );
  }
  if (!stats) return <p>Failed to load stats.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Overview</h1>
        <p className="text-sm text-muted-foreground">Real-time KPIs across the app.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total Users" value={stats.totalUsers} icon={Users} tone="primary" />
        <StatCard label="New (7d)" value={stats.newUsers7d} icon={TrendingUp} tone="accent" delta="last 7 days" />
        <StatCard label="Recitation Sessions" value={stats.totalSessions} icon={Mic} tone="primary" />
        <StatCard label="Avg Accuracy" value={`${stats.avgAccuracy}%`} icon={Activity} tone="accent" delta="last 30d" />
        <StatCard label="Bookmarks" value={stats.totalBookmarks} icon={BookMarked} tone="muted" />
        <StatCard label="Hifz Cards" value={stats.totalHifz} icon={GraduationCap} tone="muted" />
      </div>

      <AdminKpiWidget />

      <AdminModeBreakdownWidget />

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Signups (last 30 days)</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={stats.signupsByDay}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-4">
          <h3 className="text-sm font-bold text-foreground mb-3">Avg Recitation Accuracy</h3>
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={stats.accuracyByDay}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={4} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Line type="monotone" dataKey="accuracy" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
