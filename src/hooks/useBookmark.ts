import { useState, useCallback } from "react";

interface Bookmark {
  surah: number;
  ayah: number;
  page?: number;
  section?: string;
  timestamp?: number;
}

interface AudioBookmark extends Bookmark {
  qari: string;
}

interface FavoriteAyah {
  surah: number;
  ayah: number;
  text?: string;
  addedAt: number;
}

interface Bookmarks {
  lastRead?: Bookmark;
  lastAudio?: AudioBookmark;
  favorites?: FavoriteAyah[];
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

  const saveLastRead = useCallback((surah: number, ayah: number, page?: number, section?: string) => {
    setBookmarks((prev) => {
      const next = { ...prev, lastRead: { surah, ayah, page, section, timestamp: Date.now() } };
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

  const toggleFavorite = useCallback((surah: number, ayah: number, text?: string) => {
    setBookmarks((prev) => {
      const favorites = prev.favorites || [];
      const exists = favorites.some((f) => f.surah === surah && f.ayah === ayah);
      const nextFavorites = exists
        ? favorites.filter((f) => !(f.surah === surah && f.ayah === ayah))
        : [...favorites, { surah, ayah, text, addedAt: Date.now() }];
      const next = { ...prev, favorites: nextFavorites };
      save(next);
      return next;
    });
  }, []);

  const isFavorite = useCallback(
    (surah: number, ayah: number) => {
      return (bookmarks.favorites || []).some((f) => f.surah === surah && f.ayah === ayah);
    },
    [bookmarks.favorites]
  );

  return { bookmarks, saveLastRead, saveLastAudio, toggleFavorite, isFavorite };
}
