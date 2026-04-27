/**
 * Single source of truth for everything visible on the home (Index) page.
 * Both the Admin Settings UI tab and Index.tsx render from this list,
 * so adding a new home tile means: add an entry here → the admin toggle
 * appears automatically and Index respects it.
 *
 * `path` is the stable identifier stored in app_settings.ui.tiles[path].
 * Synthetic "card:*" paths cover non-tile elements (banners, summary cards).
 */
export type HomeTileSection = "card" | "quran" | "prayer" | "dhikr" | "learn";

export interface HomeTileManifestEntry {
  /** Stable identifier — also the storage key in `app_settings.ui.tiles[path]`. */
  path: string;
  /** Human label shown in the admin toggle list. */
  label: string;
  section: HomeTileSection;
  /** Initial visibility when no admin override exists. Defaults to `true`. */
  defaultEnabled: boolean;
}

export const HOME_TILE_MANIFEST: HomeTileManifestEntry[] = [
  // Cards / banners / chips
  { path: "card:announcement",        label: "Announcement banner",      section: "card",   defaultEnabled: true  },
  { path: "card:streak_chip",         label: "Streak chip",              section: "card",   defaultEnabled: true  },
  { path: "card:next_prayer",         label: "Next-prayer chip",         section: "card",   defaultEnabled: true  },
  { path: "card:hijri_header",        label: "Hijri date in header",     section: "card",   defaultEnabled: true  },
  { path: "card:daily_ayah",          label: "Daily Ayah card",          section: "card",   defaultEnabled: true  },
  { path: "card:daily_amal_summary",  label: "Daily Amal summary card",  section: "card",   defaultEnabled: true  },
  { path: "card:daily_dua",           label: "Daily Dua card",           section: "card",   defaultEnabled: true  },

  // Quran
  { path: "/quran",            label: "Read Quran",        section: "quran",  defaultEnabled: true },
  { path: "/audio",            label: "Audio",             section: "quran",  defaultEnabled: true },
  { path: "/hifz",             label: "Hifz",              section: "quran",  defaultEnabled: true },
  { path: "/practice",         label: "Practice",          section: "quran",  defaultEnabled: true },
  { path: "/recitation/stats", label: "Recitation Stats",  section: "quran",  defaultEnabled: true },
  { path: "/tafsir/1/1",       label: "Tafsir Compare",    section: "quran",  defaultEnabled: true },
  { path: "/bookmarks",        label: "Bookmarks",         section: "quran",  defaultEnabled: true },
  { path: "/planner",          label: "Planner",           section: "quran",  defaultEnabled: true },

  // Prayer
  { path: "/prayer-times", label: "Prayer Times",  section: "prayer", defaultEnabled: true },
  { path: "/qibla",        label: "Qibla",         section: "prayer", defaultEnabled: true },
  { path: "/prayer",       label: "Prayer Guide",  section: "prayer", defaultEnabled: true },
  { path: "/qaza",         label: "Qaza Tracker",  section: "prayer", defaultEnabled: true },

  // Dhikr & Dua
  { path: "/tasbih",     label: "Tasbih",         section: "dhikr",  defaultEnabled: true },
  { path: "/dua",        label: "Duas & Azkar",   section: "dhikr",  defaultEnabled: true },
  { path: "/daily-amal", label: "Daily Amal",     section: "dhikr",  defaultEnabled: true },
  { path: "/hijri",      label: "Hijri Calendar", section: "dhikr",  defaultEnabled: true },

  // Learn
  { path: "/hadith",        label: "Hadith Library", section: "learn",  defaultEnabled: true },
  { path: "/ask",           label: "Ask AI",         section: "learn",  defaultEnabled: true },
  { path: "/notifications", label: "Notifications",  section: "learn",  defaultEnabled: true },
];

/** O(1) lookup helper. */
const MANIFEST_BY_PATH: Record<string, HomeTileManifestEntry> = Object.fromEntries(
  HOME_TILE_MANIFEST.map((m) => [m.path, m]),
);

export function getTileManifest(path: string): HomeTileManifestEntry | undefined {
  return MANIFEST_BY_PATH[path];
}

export const SECTION_LABELS: Record<HomeTileSection, string> = {
  card:   "Cards & Banners",
  quran:  "Quran",
  prayer: "Prayer",
  dhikr:  "Dhikr & Dua",
  learn:  "Learn",
};

export const SECTION_ORDER: HomeTileSection[] = ["card", "quran", "prayer", "dhikr", "learn"];

/**
 * Resolve a tile's visibility against admin overrides + manifest defaults.
 * - Admin override (true/false) wins when present.
 * - Otherwise, falls back to the manifest's `defaultEnabled`.
 * - Unknown paths default to visible (so adding a tile before its manifest
 *   entry doesn't accidentally hide it).
 */
export function isTileVisibleIn(
  tiles: Record<string, boolean> | undefined,
  path: string,
): boolean {
  const override = tiles?.[path];
  if (typeof override === "boolean") return override;
  return MANIFEST_BY_PATH[path]?.defaultEnabled ?? true;
}

