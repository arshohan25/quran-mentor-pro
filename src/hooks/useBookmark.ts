import { useState, useCallback } from "react";

interface Bookmark {
  surah: number;
  ayah: number;
}

interface AudioBookmark extends Bookmark {
  qari: string;
}

interface Bookmarks {
  lastRead?: Bookmark;
  lastAudio?: AudioBookmark;
}

const STORAGE_KEY = "quran-bookmarks";

function load(): Bookmarks {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function save(bookmarks: Bookmarks) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarks));
}

export function useBookmark() {
  const [bookmarks, setBookmarks] = useState<Bookmarks>(load);

  const saveLastRead = useCallback((surah: number, ayah: number) => {
    setBookmarks((prev) => {
      const next = { ...prev, lastRead: { surah, ayah } };
      save(next);
      return next;
    });
  }, []);

  const saveLastAudio = useCallback((surah: number, ayah: number, qari: string) => {
    setBookmarks((prev) => {
      const next = { ...prev, lastAudio: { surah, ayah, qari } };
      save(next);
      return next;
    });
  }, []);

  return { bookmarks, saveLastRead, saveLastAudio };
}
