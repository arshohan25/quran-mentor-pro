import { supabase } from "@/integrations/supabase/client";
import { defaultCard } from "@/lib/srs";

const HIFZ_KEY = "hifz-progress";
const flagKey = (userId: string) => `hifz-srs-migrated-${userId}`;

export async function migrateLocalHifzToCloud(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    if (localStorage.getItem(flagKey(userId))) return 0;

    const raw = localStorage.getItem(HIFZ_KEY);
    if (!raw) {
      localStorage.setItem(flagKey(userId), "1");
      return 0;
    }
    const progress: Record<string, number[]> = JSON.parse(raw);

    const rows: any[] = [];
    const card = defaultCard();
    for (const [surahStr, ayahs] of Object.entries(progress)) {
      const surah = Number(surahStr);
      if (!surah || !Array.isArray(ayahs)) continue;
      for (const ayah of ayahs) {
        if (!Number.isFinite(ayah)) continue;
        rows.push({
          user_id: userId,
          surah,
          ayah,
          ease_factor: card.ease_factor,
          interval_days: card.interval_days,
          repetitions: card.repetitions,
          next_review_at: card.next_review_at,
        });
      }
    }

    if (rows.length === 0) {
      localStorage.setItem(flagKey(userId), "1");
      return 0;
    }

    // Upsert in chunks of 500
    let inserted = 0;
    for (let i = 0; i < rows.length; i += 500) {
      const chunk = rows.slice(i, i + 500);
      const { error } = await supabase
        .from("hifz_srs")
        .upsert(chunk, { onConflict: "user_id,surah,ayah", ignoreDuplicates: true });
      if (error) {
        console.warn("[hifzMigration] chunk failed", error);
        return inserted;
      }
      inserted += chunk.length;
    }

    localStorage.setItem(flagKey(userId), "1");
    return inserted;
  } catch (e) {
    console.warn("[hifzMigration] failed", e);
    return 0;
  }
}
