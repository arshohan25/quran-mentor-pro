## Goal
Turn the existing `AdminSettingsPage` into a complete, app-wide settings control center that:
- Lets admins configure default reciter, practice/live limits, and UI feature toggles
- Pushes changes to all user devices instantly via Supabase Realtime
- Has a single source of truth (`app_settings.settings` JSONB) consumed everywhere

## Current State
- `app_settings` table exists with a JSONB `settings` column and admin-only update RLS (anon read allowed). ✅
- `AdminSettingsPage.tsx` already edits `announcement`, `features` (4 flags), and `defaults.daily_minutes_goal`. ❌ No realtime, no consumer hook on the user app — settings are written but never read.
- No `useAppSettings` hook anywhere; features are not gated.

## Plan

### 1. Schema (migration — additive only, no data wipe)
Expand the JSONB default to the full shape and seed missing keys on the existing row 1:
```jsonc
{
  "announcement": { "enabled": false, "text": "", "level": "info" },
  "features": {
    "ask_ai": true, "live_recitation": true, "hifz_srs": true,
    "tafsir_compare": true, "word_meanings": true, "tajweed": true,
    "audio_player": true, "bookmarks": true
  },
  "defaults": {
    "daily_minutes_goal": 20,
    "default_reciter_id": null,         // overrides reciters.is_default if set
    "default_translation": "bn.bengali",
    "default_arabic_font_size": 28
  },
  "limits": {
    "practice_max_seconds": 300,        // hard cap on a single practice session
    "live_max_seconds": 600,            // hard cap on a live recitation session
    "live_min_accuracy_to_save": 0,     // % threshold under which sessions are discarded
    "hifz_daily_review_cap": 50,        // max SRS cards/day
    "ask_ai_daily_quota": 20            // per-user/day
  },
  "ui": {
    "show_streak_chip": true,
    "show_daily_ayah": true,
    "show_daily_hadith": true,
    "show_daily_dua": true,
    "show_qibla_tile": true,
    "show_hijri_tile": true,
    "compact_home": false
  }
}
```
- Migration: `UPDATE app_settings SET settings = jsonb_strip_nulls('{...defaults...}'::jsonb || settings) WHERE id = 1;` (preserves any admin edits).
- Add `app_settings` to `supabase_realtime` publication.

### 2. New hook: `src/hooks/useAppSettings.ts`
- Module-level cache + subscriber pattern (mirrors `usePublicAppConfig`).
- One-time bootstrap: fetch row, then subscribe to `postgres_changes` on `app_settings`.
- Exports:
  - `useAppSettings()` → full settings object + `loading`
  - `useFeatureFlag(key)` → boolean (defaults true if missing)
  - `useLimit(key)` → number
  - `useUiToggle(key)` → boolean
- Safe defaults baked in so app never breaks if DB row is missing.

### 3. Admin UI rewrite: `src/pages/admin/AdminSettingsPage.tsx`
Tabbed layout (Tabs primitive): **Announcement · Features · Defaults · Limits · UI Toggles**.
- **Defaults tab** — `default_reciter_id` uses a `Select` populated from `reciters` table (the same source as `usePublicAppConfig.reciters`); shows current `is_default` reciter if unset.
- **Limits tab** — sliders/inputs for each cap with min/max validation.
- **Features / UI tabs** — list of switches generated from the JSON keys with human-readable labels.
- Sticky save bar; toast on success; optimistic UI; "Reset section to defaults" buttons.
- All writes go to `app_settings.id=1` via existing admin RLS — Realtime broadcasts to every connected client within ~1 s.

### 4. Wire consumers (minimal, surgical)
- **`useSelectedReciter.ts`** — when no per-user choice is stored, fall back to `app_settings.defaults.default_reciter_id` instead of the hardcoded constant.
- **`useRecitationRecorder.ts`** — read `limits.practice_max_seconds` / `limits.live_max_seconds` and auto-stop; gate save by `live_min_accuracy_to_save`.
- **`useHifzSrs.ts`** — clamp daily due queue to `limits.hifz_daily_review_cap`.
- **`AskPage.tsx`** — enforce `limits.ask_ai_daily_quota` (count today's queries in localStorage).
- **`Index.tsx` (home)** — hide tiles based on `ui.show_*` flags; render announcement banner from `announcement` when `enabled`.
- **Routes/nav guards** — hide menu entries and 404 routes when matching `features.*` flag is off (`live_recitation`, `hifz_srs`, `tafsir_compare`, `ask_ai`).
- **`ReadingSettings.tsx`** — initial font size pulls from `defaults.default_arabic_font_size` if user hasn't set one.

### 5. Realtime push verification
- `useAppSettings` already subscribes; no extra plumbing needed.
- Add a tiny "Last updated" stamp + "Live" indicator on the admin page so admins see broadcasts working.

## Files
**New:** `src/hooks/useAppSettings.ts`
**Edited:** `src/pages/admin/AdminSettingsPage.tsx`, `src/hooks/useSelectedReciter.ts`, `src/hooks/useRecitationRecorder.ts`, `src/hooks/useHifzSrs.ts`, `src/pages/AskPage.tsx`, `src/pages/Index.tsx`, `src/components/quran/ReadingSettings.tsx`, `src/App.tsx` (route gating)
**Migration:** one new SQL file (additive JSON merge + realtime publication).

## Out of scope (can follow up)
- Per-country setting overrides (could reuse the `content_item_locales` pattern later).
- Versioning / rollback of settings (Phase 4 of the earlier roadmap).
- A/B targeting by user role.