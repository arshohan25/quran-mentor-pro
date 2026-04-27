import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import StatCard from "@/components/admin/StatCard";
import { Mic, Activity, AlertTriangle, Hash } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function AdminRecitationPage() {
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ sessions: 0, avgAccuracy: 0, totalErrors: 0, weakestN: 0 });
  const [bySurah, setBySurah] = useState<{ surah: number; n: number }[]>([]);
  const [weakest, setWeakest] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);

      const [sessionsRes, weakRes] = await Promise.all([
        supabase
          .from("recitation_sessions")
          .select("surah, accuracy, error_words, hesitation_words, created_at")
          .gte("created_at", since.toISOString())
          .limit(5000),
        supabase
          .from("recitation_word_stats")
          .select("surah, ayah, word_index, errors, attempts")
          .gte("attempts", 3)
          .order("errors", { ascending: false })
          .limit(20),
      ]);

      const sessions = sessionsRes.data ?? [];
      const surahMap: Record<number, number> = {};
      let accSum = 0, accN = 0, errSum = 0;
      sessions.forEach((s: any) => {
        surahMap[s.surah] = (surahMap[s.surah] ?? 0) + 1;
        accSum += s.accuracy ?? 0;
        accN += 1;
        errSum += s.error_words ?? 0;
      });
      const bySurahArr = Object.entries(surahMap)
        .map(([s, n]) => ({ surah: +s, n }))
        .sort((a, b) => b.n - a.n)
        .slice(0, 12);

      setBySurah(bySurahArr);
      setTotals({
        sessions: sessions.length,
        avgAccuracy: accN > 0 ? Math.round((accSum / accN) * 100) : 0,
        totalErrors: errSum,
        weakestN: (weakRes.data ?? []).length,
      });
      setWeakest(weakRes.data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <Skeleton className="h-96" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Recitation Analytics</h1>
        <p className="text-sm text-muted-foreground">Aggregate trends across all users (last 30 days).</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard label="Sessions (30d)" value={totals.sessions} icon={Mic} tone="primary" />
        <StatCard label="Avg Accuracy" value={`${totals.avgAccuracy}%`} icon={Activity} tone="accent" />
        <StatCard label="Total Errors" value={totals.totalErrors} icon={AlertTriangle} tone="muted" />
        <StatCard label="Tracked Weak Words" value={totals.weakestN} icon={Hash} tone="primary" />
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
