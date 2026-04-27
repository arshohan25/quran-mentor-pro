## Goal
Auto-generate a switch in **Admin → Settings → UI** for every home tile and the home cards/banners, and have Index hide each item the moment its toggle is flipped (live, no reload).

## Approach
Use a single shared **manifest** as the source of truth for what's on the home page. Admin renders switches from it; Index filters render from the same list. Adding a future tile means adding one manifest entry — no admin/Index edits needed.

## Files

### 1. NEW: `src/lib/homeTilesManifest.ts`
Exports:
- `HOME_TILE_MANIFEST: { path, label, section }[]` covering:
  - **Cards/banners** (`card:*` synthetic paths): announcement banner, Daily Ayah, Daily Amal summary, Daily Dua, streak chip, next-prayer chip, Hijri header chip
  - **Quran tiles**: `/quran`, `/audio`, `/hifz`, `/practice`, `/recitation/stats`, `/tafsir/1/1`, `/bookmarks`, `/planner`
  - **Prayer tiles**: `/prayer-times`, `/qibla`, `/prayer`, `/qaza`
  - **Dhikr tiles**: `/tasbih`, `/dua`, `/daily-amal`, `/hijri`
  - **Learn tiles**: `/hadith`, `/ask`, `/notifications`
- `SECTION_LABELS` for grouping in admin UI

### 2. EDIT: `src/hooks/useAppSettings.ts`
Extend `AppSettings.ui` with:
```ts
tiles: Record<string, boolean>   // keyed by manifest path; missing key = visible
```
Default = `{}` (empty → everything visible). Add a small helper:
```ts
export function isTileVisible(path: string): boolean {
  const v = getAppSettingsSnapshot().ui.tiles?.[path];
  return v !== false;   // default-on for any unknown path
}
```
Keep the existing `show_qibla_tile`, `show_hijri_tile`, `show_daily_ayah` for back-compat but stop relying on them in Index — the manifest map supersedes them.

### 3. EDIT: `src/pages/admin/AdminSettingsPage.tsx`
In the **UI** tab, append a new section "Home tiles & cards":
- Group manifest entries by `section`, render a `Switch` per entry.
- Bound state to `draft.ui.tiles[path]`; default `true` if undefined.
- "Toggle all in section" header chip (small QoL).
- Existing UI toggles (compact_home, show_streak_chip, etc.) stay above for now.

### 4. EDIT: `src/pages/Index.tsx`
- Replace the conditional spreads (`...(ui.show_qibla_tile ? [...] : [])`) with a generic helper:
  ```ts
  const visible = (path: string) => ui.tiles?.[path] !== false;
  ```
- Filter `quranTiles`, `prayerTiles`, `dhikrTiles`, `learnTiles` arrays through `visible(tile.path)`.
- Gate the announcement banner with `visible("card:announcement") && showAnnouncement`.
- Gate Daily Ayah, Daily Amal summary card, Daily Dua card, streak chip, next-prayer chip, and Hijri header chip with their `card:*` keys.
- If a section ends up with **0 visible tiles**, hide the whole `<BentoSection>`.

### 5. NO migration required
The existing JSONB column already stores arbitrary keys. Defaults stay backward-compatible because `isTileVisible` treats missing keys as `true`. Realtime push from the previous round already covers `app_settings` changes.

## What the user gets
- Admin → Settings → UI tab now lists ~25 switches grouped by section.
- Toggling any switch hides/shows the corresponding tile or card on every connected user's home page within ~1 second.
- Adding a new home tile in the future: add one manifest line → toggle appears automatically.