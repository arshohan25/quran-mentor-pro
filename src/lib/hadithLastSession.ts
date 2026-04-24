// Stores the last Hadith Practice context so the user can resume where they left off.
// Captures book (collection), chapter, and the last opened hadith.

const KEY = "hadith_last_session_v1";

export interface HadithLastSession {
  collection: string;
  chapter: string;
  hadithId?: number;
  hadithNumber?: string | number;
  updatedAt: number;
}

export function getLastHadithSession(): HadithLastSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as HadithLastSession) : null;
  } catch {
    return null;
  }
}

export function saveLastHadithSession(
  data: Omit<HadithLastSession, "updatedAt">
) {
  try {
    const full: HadithLastSession = { ...data, updatedAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(full));
  } catch {
    // ignore
  }
}

export function clearLastHadithSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
