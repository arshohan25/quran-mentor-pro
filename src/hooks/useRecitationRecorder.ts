import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { RecitationState } from "./useArabicRecitationEngine";

export type RecitationMode = "practice" | "hifz" | "live" | "lesson";

interface UseRecitationRecorderOpts {
  surah: number | null;
  ayah: number | null;
  state: RecitationState;
  /** Set true exactly once when the ayah is fully completed */
  completed: boolean;
  /** Tagging the attempt: defaults to "practice" */
  mode?: RecitationMode;
}

interface WordTally {
  attempts: number;
  correct: number;
  errors: number;
  hesitations: number;
}

/**
 * Observes the recitation engine state and records word-level statistics
 * on completion. Non-invasive — does not modify the engine itself.
 *
 * Counting:
 *  - correct++  : whenever revealedIndex advances past a word
 *  - errors++   : whenever errorIndex hits a new word
 *  - hesitations++ : if more than 3s elapsed since last advance
 */
export function useRecitationRecorder({ surah, ayah, state, completed, mode = "practice" }: UseRecitationRecorderOpts) {
  const { user } = useAuth();
  const startRef = useRef<number | null>(null);
  const wordsRef = useRef<Map<number, WordTally>>(new Map());
  const lastIndexRef = useRef(0);
  const lastErrorIndexRef = useRef<number | null>(null);
  const lastAdvanceTsRef = useRef<number>(Date.now());
  const recordedRef = useRef(false);

  // Reset on ayah change
  useEffect(() => {
    startRef.current = null;
    wordsRef.current = new Map();
    lastIndexRef.current = 0;
    lastErrorIndexRef.current = null;
    lastAdvanceTsRef.current = Date.now();
    recordedRef.current = false;
  }, [surah, ayah]);

  // Start session timer once listening begins
  useEffect(() => {
    if (state.isListening && startRef.current === null) {
      startRef.current = Date.now();
      lastAdvanceTsRef.current = Date.now();
    }
  }, [state.isListening]);

  // Track advances (correct words)
  useEffect(() => {
    const now = Date.now();
    if (state.revealedIndex > lastIndexRef.current) {
      const wordIdx = lastIndexRef.current;
      const tally = wordsRef.current.get(wordIdx) ?? { attempts: 0, correct: 0, errors: 0, hesitations: 0 };
      tally.attempts += 1;
      tally.correct += 1;
      if (now - lastAdvanceTsRef.current > 3000) tally.hesitations += 1;
      wordsRef.current.set(wordIdx, tally);
      lastIndexRef.current = state.revealedIndex;
      lastAdvanceTsRef.current = now;
    }
  }, [state.revealedIndex]);

  // Track errors
  useEffect(() => {
    if (state.errorIndex !== null && state.errorIndex !== lastErrorIndexRef.current) {
      const wordIdx = state.errorIndex;
      const tally = wordsRef.current.get(wordIdx) ?? { attempts: 0, correct: 0, errors: 0, hesitations: 0 };
      tally.attempts += 1;
      tally.errors += 1;
      wordsRef.current.set(wordIdx, tally);
      lastErrorIndexRef.current = state.errorIndex;
    } else if (state.errorIndex === null) {
      lastErrorIndexRef.current = null;
    }
  }, [state.errorIndex]);

  // Persist on completion
  useEffect(() => {
    if (!completed || recordedRef.current) return;
    if (!user || surah == null || ayah == null) return;
    recordedRef.current = true;

    const startedAt = startRef.current ?? Date.now();
    const duration = Date.now() - startedAt;

    let correct = 0, errors = 0, hesitations = 0;
    wordsRef.current.forEach(t => {
      correct += t.correct;
      errors += t.errors;
      hesitations += t.hesitations;
    });
    const total = state.totalWords;
    const accuracy = total > 0 ? Math.max(0, Math.min(1, correct / total)) : 0;

    (async () => {
      try {
        await supabase.from("recitation_sessions").insert({
          user_id: user.id,
          surah,
          ayah,
          total_words: total,
          correct_words: correct,
          error_words: errors,
          hesitation_words: hesitations,
          accuracy,
          duration_ms: duration,
          mode,
        } as any);

        const wordRows = Array.from(wordsRef.current.entries()).map(([word_index, t]) => ({
          user_id: user.id,
          surah,
          ayah,
          word_index,
          attempts: t.attempts,
          correct: t.correct,
          errors: t.errors,
          hesitations: t.hesitations,
        }));

        if (wordRows.length > 0) {
          const indices = wordRows.map(r => r.word_index);
          const { data: existing } = await supabase
            .from("recitation_word_stats")
            .select("word_index,attempts,correct,errors,hesitations")
            .eq("user_id", user.id)
            .eq("surah", surah)
            .eq("ayah", ayah)
            .in("word_index", indices);

          const existingMap = new Map((existing ?? []).map(r => [r.word_index, r]));
          const merged = wordRows.map(r => {
            const e = existingMap.get(r.word_index);
            return {
              ...r,
              attempts: r.attempts + (e?.attempts ?? 0),
              correct: r.correct + (e?.correct ?? 0),
              errors: r.errors + (e?.errors ?? 0),
              hesitations: r.hesitations + (e?.hesitations ?? 0),
              last_seen_at: new Date().toISOString(),
            };
          });

          await supabase
            .from("recitation_word_stats")
            .upsert(merged, { onConflict: "user_id,surah,ayah,word_index" });
        }
      } catch (e) {
        console.warn("[recitationRecorder] save failed", e);
      }
    })();
  }, [completed, user, surah, ayah, state.totalWords]);
}
