import { useCallback, useEffect, useState } from "react";

export type PracticeLang = "ar" | "bn" | "en";

export interface HadithPracticeSession {
  hadithId: number;
  lang: PracticeLang;
  // wrong[sectionIdx] = array of word indices
  wrong: Record<number, number[]>;
  activeSection: number;
  totalSections: number;
  totalWords: number;
  updatedAt: number;
}

const STORAGE_KEY = "hadith_practice_v1";

type Store = Record<string, HadithPracticeSession>;

const sessionKey = (hadithId: number, lang: PracticeLang) => `${hadithId}:${lang}`;

function readStore(): Store {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Store) : {};
  } catch {
    return {};
  }
}

function writeStore(store: Store) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // ignore quota errors
  }
}

export function useHadithPractice(hadithId: number, lang: PracticeLang) {
  const [session, setSession] = useState<HadithPracticeSession | null>(() => {
    const store = readStore();
    return store[sessionKey(hadithId, lang)] || null;
  });

  // Reload when hadith/lang changes
  useEffect(() => {
    const store = readStore();
    setSession(store[sessionKey(hadithId, lang)] || null);
  }, [hadithId, lang]);

  const save = useCallback(
    (next: Omit<HadithPracticeSession, "hadithId" | "lang" | "updatedAt">) => {
      const store = readStore();
      const full: HadithPracticeSession = {
        hadithId,
        lang,
        ...next,
        updatedAt: Date.now(),
      };
      store[sessionKey(hadithId, lang)] = full;
      writeStore(store);
      setSession(full);
    },
    [hadithId, lang]
  );

  const clear = useCallback(() => {
    const store = readStore();
    delete store[sessionKey(hadithId, lang)];
    writeStore(store);
    setSession(null);
  }, [hadithId, lang]);

  return { session, save, clear };
}

export function getAllPracticeSessions(): HadithPracticeSession[] {
  return Object.values(readStore()).sort((a, b) => b.updatedAt - a.updatedAt);
}
