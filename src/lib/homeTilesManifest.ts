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
  path: string;
  label: string;
  section: HomeTileSection;
}

export const HOME_TILE_MANIFEST: HomeTileManifestEntry[] = [
  // Cards / banners / chips
  { path: "card:announcement",        label: "Announcement banner",      section: "card" },
  { path: "card:streak_chip",         label: "Streak chip",              section: "card" },
  { path: "card:next_prayer",         label: "Next-prayer chip",         section: "card" },
  { path: "card:hijri_header",        label: "Hijri date in header",     section: "card" },
  { path: "card:daily_ayah",          label: "Daily Ayah card",          section: "card" },
  { path: "card:daily_amal_summary",  label: "Daily Amal summary card",  section: "card" },
  { path: "card:daily_dua",           label: "Daily Dua card",           section: "card" },

  // Quran
  { path: "/quran",            label: "Read Quran",        section: "quran" },
  { path: "/audio",            label: "Audio",             section: "quran" },
  { path: "/hifz",             label: "Hifz",              section: "quran" },
  { path: "/practice",         label: "Practice",          section: "quran" },
  { path: "/recitation/stats", label: "Recitation Stats",  section: "quran" },
  { path: "/tafsir/1/1",       label: "Tafsir Compare",    section: "quran" },
  { path: "/bookmarks",        label: "Bookmarks",         section: "quran" },
  { path: "/planner",          label: "Planner",           section: "quran" },

  // Prayer
  { path: "/prayer-times", label: "Prayer Times",  section: "prayer" },
  { path: "/qibla",        label: "Qibla",         section: "prayer" },
  { path: "/prayer",       label: "Prayer Guide",  section: "prayer" },
  { path: "/qaza",         label: "Qaza Tracker",  section: "prayer" },

  // Dhikr & Dua
  { path: "/tasbih",     label: "Tasbih",         section: "dhikr" },
  { path: "/dua",        label: "Duas & Azkar",   section: "dhikr" },
  { path: "/daily-amal", label: "Daily Amal",     section: "dhikr" },
  { path: "/hijri",      label: "Hijri Calendar", section: "dhikr" },

  // Learn
  { path: "/hadith",        label: "Hadith Library", section: "learn" },
  { path: "/ask",           label: "Ask AI",         section: "learn" },
  { path: "/notifications", label: "Notifications",  section: "learn" },
];

export const SECTION_LABELS: Record<HomeTileSection, string> = {
  card:   "Cards & Banners",
  quran:  "Quran",
  prayer: "Prayer",
  dhikr:  "Dhikr & Dua",
  learn:  "Learn",
};

export const SECTION_ORDER: HomeTileSection[] = ["card", "quran", "prayer", "dhikr", "learn"];

/** Default-on: missing key in the toggle map = visible. */
export function isTileVisibleIn(
  tiles: Record<string, boolean> | undefined,
  path: string,
): boolean {
  return tiles?.[path] !== false;
}
