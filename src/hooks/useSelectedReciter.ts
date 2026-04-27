import { useCallback, useEffect, useState } from "react";
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

/**
 * App-wide selected qari/reciter, persisted to localStorage and synced across
 * tabs / components via a custom "selected-reciter-changed" event. All players
 * (audio + practice/hifz/live recitation) share this so the value flowing into
 * `useRecitationRecorder` matches what the user actually sees.
 */
export function useSelectedReciter(): {
  reciterId: string;
  reciterName: string;
  setReciterId: (id: string) => void;
} {
  const [reciterId, setReciterIdState] = useState<string>(readStored);

  useEffect(() => {
    const handler = () => setReciterIdState(readStored());
    window.addEventListener("selected-reciter-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("selected-reciter-changed", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const setReciterId = useCallback((id: string) => {
    const safe = validIds.has(id) ? id : DEFAULT_RECITER;
    try {
      localStorage.setItem(STORAGE_KEY, safe);
    } catch {
      /* ignore */
    }
    setReciterIdState(safe);
    window.dispatchEvent(new Event("selected-reciter-changed"));
  }, []);

  const reciterName =
    qariList.find((q) => q.id === reciterId)?.name ?? reciterId;

  return { reciterId, reciterName, setReciterId };
}

export const DEFAULT_RECITER_ID = DEFAULT_RECITER;
