import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SessionRow {
  id: string;
  surah: number;
  ayah: number;
  accuracy: number;
  total_words: number;
  correct_words: number;
  error_words: number;
  hesitation_words: number;
  duration_ms: number | null;
  created_at: string;
}

export interface WordStatRow {
  word_index: number;
  attempts: number;
  correct: number;
  errors: number;
  hesitations: number;
}

export interface WeakWord extends WordStatRow {
  surah: number;
  ayah: number;
}

export function useRecentSessions(limit = 20) {
  const { user } = useAuth();
  return useQuery<SessionRow[]>({
    queryKey: ["recitation-sessions", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recitation_sessions")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as SessionRow[];
    },
  });
}

export function useAyahHeatmap(surah: number | null, ayah: number | null) {
  const { user } = useAuth();
  return useQuery<WordStatRow[]>({
    queryKey: ["recitation-heatmap", user?.id, surah, ayah],
    enabled: !!user && surah != null && ayah != null,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recitation_word_stats")
        .select("word_index,attempts,correct,errors,hesitations")
        .eq("user_id", user!.id)
        .eq("surah", surah!)
        .eq("ayah", ayah!)
        .order("word_index", { ascending: true });
      if (error) throw error;
      return (data ?? []) as WordStatRow[];
    },
  });
}

export function useWeakestWords(limit = 20) {
  const { user } = useAuth();
  return useQuery<WeakWord[]>({
    queryKey: ["recitation-weakest", user?.id, limit],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recitation_word_stats")
        .select("surah,ayah,word_index,attempts,correct,errors,hesitations")
        .eq("user_id", user!.id)
        .gt("attempts", 0)
        .order("errors", { ascending: false })
        .limit(limit * 2);
      if (error) throw error;
      const rows = (data ?? []) as WeakWord[];
      // Re-rank client-side by errors+hesitations
      return rows
        .sort((a, b) => (b.errors + b.hesitations) - (a.errors + a.hesitations))
        .slice(0, limit);
    },
  });
}

export interface DayBucket { date: string; avgAccuracy: number; count: number; }

export function useAccuracyTrend(days = 7) {
  const { user } = useAuth();
  return useQuery<DayBucket[]>({
    queryKey: ["recitation-trend", user?.id, days],
    enabled: !!user,
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - days + 1);
      since.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("recitation_sessions")
        .select("accuracy,created_at")
        .eq("user_id", user!.id)
        .gte("created_at", since.toISOString());
      if (error) throw error;
      const buckets = new Map<string, { sum: number; count: number }>();
      for (let i = 0; i < days; i++) {
        const d = new Date(since);
        d.setDate(since.getDate() + i);
        buckets.set(d.toISOString().split("T")[0], { sum: 0, count: 0 });
      }
      (data ?? []).forEach((row: any) => {
        const key = new Date(row.created_at).toISOString().split("T")[0];
        const b = buckets.get(key);
        if (b) { b.sum += row.accuracy; b.count += 1; }
      });
      return Array.from(buckets.entries()).map(([date, b]) => ({
        date,
        avgAccuracy: b.count > 0 ? b.sum / b.count : 0,
        count: b.count,
      }));
    },
  });
}
