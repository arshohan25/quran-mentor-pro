import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { qariList } from "@/data/prayerData";

const STORAGE_KEY = "selected_qari_id";
const DEFAULT_RECITER = qariList[0]?.id ?? "ar.alafasy";

const validIds = new Set(qariList.map((q) => q.id));

function readStored(): string {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && validIds.has(v)) return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_RECITER;
}

function nameFor(id: string): string {
  return qariList.find((q) => q.id === id)?.name ?? id;
}

/**
 * Module-level guard so the cross-tab toast fires once per change even when
 * multiple components mount this hook simultaneously (e.g. AudioView +
 * HifzView visible at the same time).
 */
let lastToastedValue: string | null = null;

/**
 * App-wide selected qari/reciter, persisted to localStorage and synced across
 * tabs / components via:
 *  - a custom "selected-reciter-changed" event (same-tab updates)
 *  - the native "storage" event (cross-tab updates; fires only in *other*
 *    tabs by spec, so we use it to surface a toast notification).
 */
export function useSelectedReciter(): {
  reciterId: string;
  reciterName: string;
  setReciterId: (id: string) => void;
} {
  const [reciterId, setReciterIdState] = useState<string>(readStored);

  useEffect(() => {
    const handleSameTab = () => setReciterIdState(readStored());

    const handleCrossTab = (e: StorageEvent) => {
      // Filter to our key so unrelated localStorage writes don't trigger work.
      if (e.key !== null && e.key !== STORAGE_KEY) return;
      const next = readStored();
      setReciterIdState((prev) => {
        if (prev !== next && lastToastedValue !== next) {
          lastToastedValue = next;
          toast(`Reciter changed to ${nameFor(next)}`, {
            description: "Updated from another tab",
            duration: 3000,
          });
        }
        return next;
      });
    };

    window.addEventListener("selected-reciter-changed", handleSameTab);
    window.addEventListener("storage", handleCrossTab);
    return () => {
      window.removeEventListener("selected-reciter-changed", handleSameTab);
      window.removeEventListener("storage", handleCrossTab);
    };
  }, []);

  const setReciterId = useCallback((id: string) => {
    const safe = validIds.has(id) ? id : DEFAULT_RECITER;
    try {
      localStorage.setItem(STORAGE_KEY, safe);
    } catch {
      /* ignore */
    }
    // Suppress the cross-tab toast for our own write (storage event won't
    // fire in this tab anyway, but keep the guard consistent).
    lastToastedValue = safe;
    setReciterIdState(safe);
    window.dispatchEvent(new Event("selected-reciter-changed"));
  }, []);

  const reciterName = nameFor(reciterId);

  return { reciterId, reciterName, setReciterId };
}

export const DEFAULT_RECITER_ID = DEFAULT_RECITER;
