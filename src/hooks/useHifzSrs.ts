import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { defaultCard, reviewCard, type Quality, type SrsCard } from "@/lib/srs";

export interface HifzSrsRow {
  id: string;
  user_id: string;
  surah: number;
  ayah: number;
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  last_quality: number | null;
  last_reviewed_at: string | null;
}

const DUE_KEY = ["hifz-srs", "due"] as const;
const ALL_KEY = ["hifz-srs", "all"] as const;

export function useDueCards() {
  const { user } = useAuth();
  return useQuery<HifzSrsRow[]>({
    queryKey: DUE_KEY,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hifz_srs")
        .select("*")
        .lte("next_review_at", new Date().toISOString())
        .order("next_review_at", { ascending: true })
        .limit(50);
      if (error) throw error;
      return (data ?? []) as HifzSrsRow[];
    },
  });
}

export function useAllCards() {
  const { user } = useAuth();
  return useQuery<HifzSrsRow[]>({
    queryKey: ALL_KEY,
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("hifz_srs").select("*");
      if (error) throw error;
      return (data ?? []) as HifzSrsRow[];
    },
  });
}

function rowToCard(row: HifzSrsRow): SrsCard {
  return {
    ease_factor: row.ease_factor,
    interval_days: row.interval_days,
    repetitions: row.repetitions,
    next_review_at: row.next_review_at,
    last_quality: row.last_quality,
    last_reviewed_at: row.last_reviewed_at,
  };
}

export function projectNext(row: HifzSrsRow | null, quality: Quality): SrsCard {
  const base = row ? rowToCard(row) : defaultCard();
  return reviewCard(base, quality);
}

export function useReviewMutation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      surah,
      ayah,
      quality,
      existing,
    }: {
      surah: number;
      ayah: number;
      quality: Quality;
      existing: HifzSrsRow | null;
    }) => {
      if (!user) throw new Error("Not signed in");
      const base = existing ? rowToCard(existing) : defaultCard();
      const next = reviewCard(base, quality);
      const { error } = await supabase.from("hifz_srs").upsert(
        {
          user_id: user.id,
          surah,
          ayah,
          ease_factor: next.ease_factor,
          interval_days: next.interval_days,
          repetitions: next.repetitions,
          next_review_at: next.next_review_at,
          last_quality: next.last_quality,
          last_reviewed_at: next.last_reviewed_at,
        },
        { onConflict: "user_id,surah,ayah" }
      );
      if (error) throw error;
      return next;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DUE_KEY });
      qc.invalidateQueries({ queryKey: ALL_KEY });
    },
  });
}

export function useUpsertCard() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ surah, ayah }: { surah: number; ayah: number }) => {
      if (!user) return;
      const card = defaultCard();
      const { error } = await supabase.from("hifz_srs").upsert(
        {
          user_id: user.id,
          surah,
          ayah,
          ease_factor: card.ease_factor,
          interval_days: card.interval_days,
          repetitions: card.repetitions,
          next_review_at: card.next_review_at,
        },
        { onConflict: "user_id,surah,ayah", ignoreDuplicates: true }
      );
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: DUE_KEY });
      qc.invalidateQueries({ queryKey: ALL_KEY });
    },
  });
}
