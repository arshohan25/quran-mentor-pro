# Tile Audit View in Admin Settings

Add a new sub-view inside Admin → Settings → UI tab that classifies every manifest tile by its current source of truth, so admins can see at a glance which tiles are running on auto defaults vs. which ones they have explicitly overridden (and whether the override matches or differs from the default).

## What the user will see

A new collapsible "Tile Audit" panel below the existing per-tile toggle list (in the UI tab). It shows three grouped lists with counts:

1. **Auto (default)** — tiles with no key present in `app_settings.ui.tiles`. Visibility comes from manifest `defaultEnabled`.
2. **Override matches default** — admin has written a key but the value equals `defaultEnabled` (a no-op override; safe to clear).
3. **Override differs from default** — admin has actively flipped the tile away from its default. These are the "interesting" overrides.

Each row shows: label · `path` (mono) · current effective state badge (Visible/Hidden) · default badge · source badge (Auto / Override).

For groups 2 and 3, a small "Reset to default" button per row deletes the key from `ui.tiles` (so it falls back to the manifest). A "Reset all matching defaults" button clears every key in group 2 in one click. These edits go through the same draft → Save & push live flow as the existing toggles (no separate save button).

## Technical details

**File edited: `src/pages/admin/AdminSettingsPage.tsx`**
- Add a `useMemo` that walks `HOME_TILE_MANIFEST` once against `draft.ui.tiles` and classifies each entry into `auto | matches | differs`.
- Render a new `<Section title="Tile Audit">` inside the existing UI `TabsContent`, below the "Home tiles & cards" section.
- Reuse `Badge`, `Button`, `Row` components already imported.
- Removing an override = `const next = { ...draft.ui.tiles }; delete next[path]; updateNested("ui", "tiles", next);`
- "Reset all matching defaults" iterates group 2 paths and deletes them from a single `next` map.

No new files, no migrations, no schema changes — purely a read/diff view on data already present in `draft` and `HOME_TILE_MANIFEST`.

## Out of scope
- No history of who/when an override was set (would need an audit log query).
- No filtering/search box (manifest is small, ~26 entries).