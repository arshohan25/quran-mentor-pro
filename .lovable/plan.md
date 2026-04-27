# Admin "Edit Everything" Control Plan

Goal: Admins can change/add anything users see in the app — home content, navigation, daily Ayah/Hadith/Dua, qari list & default reciter, theme + branding, and every single user record — all live for all users.

Because the app currently has many large hardcoded data files (`dailyAmalData.ts`, `duaData.ts`, `surahList.ts`, `hadithCollections.ts`, `prayerData.ts`, etc.), this is delivered in **4 phases**. Phase 1 ships the foundation + most-requested controls so admins get value immediately; later phases migrate the long-form content into editable tables.

---

## Phase 1 — Foundation (ship first)

### 1.1 Database schema (new migration)

New tables (all with `Admins manage / Anyone read` RLS):

- `app_branding` (singleton row)
  - `app_name_bn/en/ar`, `tagline_bn/en/ar`, `logo_url`, `primary_hsl`, `accent_hsl`, `gold_hsl`, `default_language` (`bn|en|ar`), `default_theme` (`light|dark|auto`), `updated_at`, `updated_by`.
- `home_sections` (ordered cards on the home page)
  - `id`, `key` (e.g. `daily_ayah`, `prayer_times`, `streak`, `daily_amal`, `bookmarks`, `hifz`, `tasbih`, `dua`, `hadith`, `ask`, `recitation_stats`), `enabled`, `sort_order`, `title_bn/en/ar`, `subtitle_bn/en/ar`, `link`, `icon` (lucide name), `cta_label_bn/en/ar`.
- `nav_items` (bottom nav)
  - `id`, `enabled`, `sort_order`, `path`, `icon` (lucide name), `label_bn/en/ar`. Capped to 5 visible.
- `reciters` (replaces hardcoded qari list)
  - `id` (text PK e.g. `ar.alafasy`), `enabled`, `sort_order`, `name_bn/en/ar`, `is_default` (only one true), `external_id` (matches AlQuran.cloud). Seeded from current `qariList`.
- `daily_content_overrides`
  - `id`, `kind` (`ayah|hadith|dua`), `date` (date), `payload` jsonb, `enabled`. If a row exists for today, it overrides the algorithmic pick.
- `content_items` (generic key/value CMS for misc text snippets — banners, empty states, button labels)
  - `id`, `key` (unique), `bn/en/ar`, `enabled`.

Extend `app_settings.settings` JSON with:
- `bottomNav.maxItems`, `home.layout` (`compact|comfortable`), `branding.useCustomLogo`.

All tables have RLS:
- `SELECT` to `anon, authenticated` (so unauthenticated users see customizations).
- `INSERT/UPDATE/DELETE` only via `has_role(auth.uid(), 'admin')`.
- Trigger `audit_logs` insert on each change for traceability.

### 1.2 Public settings hook

New `src/hooks/usePublicAppConfig.ts`:
- Single React Query hook that fetches `app_settings`, `app_branding`, `home_sections`, `nav_items`, `reciters` once on app boot, caches in memory, and subscribes to Supabase Realtime so changes propagate live to every connected user without reload.
- Exposes typed `branding`, `homeSections`, `navItems`, `reciters`, `defaultReciterId`, `featureFlags`.

Wire into `App.tsx` near `LanguageProvider`/`ThemeProvider` so:
- `ThemeProvider` reads HSL tokens from `branding.*_hsl` and writes them to CSS custom properties (`--primary`, `--accent`, `--gold`) at runtime.
- `LanguageProvider` honors `defaultLanguage` for new users.
- `BottomNav.tsx` renders `navItems` from config (replacing hardcoded `NAV_ITEMS`).
- `Index.tsx` renders cards from `homeSections` in `sort_order`, hiding disabled ones.
- `useSelectedReciter.ts` falls back to `defaultReciterId` from config (instead of hardcoded `DEFAULT_RECITER`); the Qari picker shows reciters from the table.
- `DailyAyah`, daily hadith, and daily dua components first check `daily_content_overrides` for today.

### 1.3 New admin pages (under `/admin`)

Add to `AdminShell` nav and `App.tsx` routes:

1. **`/admin/branding`** — `AdminBrandingPage.tsx`
   - Edit app name (3 langs), tagline, upload logo (uses Supabase Storage bucket `branding`), pick primary/accent/gold via color picker (writes HSL), pick default language + default theme.
   - Live preview swatch + "Apply to all users" button (saves + broadcasts via realtime).

2. **`/admin/home`** — `AdminHomePage.tsx`
   - Drag-to-reorder list of `home_sections` with `Switch` per row, inline edit of multi-language title/subtitle/CTA, link, lucide icon picker.
   - "Add custom section" button creates a new card linking to any internal route.

3. **`/admin/navigation`** — `AdminNavPage.tsx`
   - Same pattern for `nav_items`. Validation: 3–5 visible items, paths must match an existing route (validated against an exported route manifest).

4. **`/admin/daily`** — `AdminDailyContentPage.tsx`
   - Tabs: Ayah / Hadith / Dua. Calendar picker → edit/override the entry shown to users that day. Schedule ahead by inserting future-dated rows.

5. **`/admin/reciters`** — `AdminRecitersPage.tsx`
   - Table of reciters with enable/disable, sort, edit names per language, "Set as default". `is_default` enforced singleton via partial unique index.

6. **`/admin/content-strings`** — `AdminContentStringsPage.tsx`
   - CRUD over `content_items`: edit any labeled snippet (banner text, empty states). Components consume via `useContentString(key, fallback)`.

### 1.4 Full edit on user data (extend existing pages)

Currently `AdminContentPage` is view + delete only. Add **edit** mode:

- Per-row "Edit" action opens a `Sheet` with a typed form for that table:
  - `recitation_sessions`: edit `accuracy`, `correct_words`, `error_words`, `hesitation_words`, `mode`, `reciter`, `lesson_type`, `duration_ms`.
  - `recitation_word_stats`: edit `attempts`, `correct`, `errors`, `hesitations`.
  - `bookmarks_sync`: edit `note`, `surah`, `ayah`.
  - `hifz_srs`: edit `ease_factor`, `interval_days`, `repetitions`, `next_review_at`, `last_quality`.
  - `qaza_sync`: edit each prayer counter.
- Updates go through the existing `admin-users` edge function with new actions `update_row` (table allowlist + zod-validated fields, service-role write, audit-logged).
- New `/admin/users/:id` profile page: edit `display_name`, `avatar_url`, language preference, daily minutes goal, full notification settings — writes to `profiles` and `user_settings`.
- New `/admin/users/:id/data` view aggregates that user's recitations, bookmarks, hifz, qaza in tabs with the same edit/delete actions scoped to them.

### 1.5 Edge function additions

Extend `supabase/functions/admin-users/index.ts` with admin-only actions:
- `update_row { table, id, patch }` — table allowlist, zod schema per table.
- `update_user_profile { user_id, patch }`.
- `update_user_settings { user_id, settings }`.
- `set_default_reciter { reciter_id }` — atomic toggle of `is_default`.
All write paths re-check `has_role(..., 'admin')` server-side and write `audit_logs` rows.

### 1.6 Storage

New public Supabase Storage bucket `branding` for logo uploads. Public read; insert/update/delete restricted by `has_role('admin')` policy on `storage.objects`.

---

## Phase 2 — Migrate static content to editable tables

(After Phase 1 ships and is verified.)

- **Surah/Ayah text overrides**: new `quran_overrides` table (`surah`, `ayah`, `field`, `bn/en/ar`) merged on top of API responses so admins can correct any translation/word.
- **Dua library**: migrate `src/data/duaData.ts` → `duas` table. Existing UI swapped to query the table; current data seeded via SQL.
- **Daily Amal**: migrate `dailyAmalData.ts` + `AMAL_CATEGORIES` → `amal_items` + `amal_categories` tables. Admin CRUD page with reorder.
- **Hadith collections list**: migrate `hadithCollections.ts` to `hadith_collections` table (the hadith bodies stay API-sourced, but admin can enable/disable and rename collections).
- **Prayer reference data** (`prayerData.ts`, tashahhud, durood) → `prayer_references` table.
- **Quran topics** (`quranTopics.ts`) → `topics` table with editable verse mappings.

Each gets a corresponding `/admin/content/<thing>` page reusing the same editable-table component built in Phase 1.

---

## Phase 3 — Fine-grained per-string editing

- Build an in-app **inline edit overlay** for admins: when an admin is logged in, every text node sourced from the CMS shows a tiny pencil on hover that opens the edit sheet for that `content_items` key. Powered by a `<T k="..." />` wrapper component that registers the key the first time it renders.
- Lets admins edit literally "every single word" without hunting for the right admin page.

---

## Phase 4 — Polish & guardrails

- **Realtime broadcast** confirmation toast in admin UI: "Pushed to N connected users".
- **Versioning/rollback** for `app_branding`, `home_sections`, `nav_items`: each save inserts into a `*_history` table; admin can restore any prior version.
- **Preview-as-user** mode: admin can render the home/nav/branding with a draft config without publishing.
- **Permissions split**: editor role allowed to edit content tables but not branding or user data; admin retains everything.
- **Security scan + linter pass**, type regen, smoke-test all admin pages.

---

## Files created (Phase 1)

- Migration: new tables, RLS, triggers, storage bucket + policies, seed reciters from current `qariList`.
- `src/hooks/usePublicAppConfig.ts`
- `src/hooks/useContentString.ts`
- `src/lib/routeManifest.ts`
- `src/pages/admin/AdminBrandingPage.tsx`
- `src/pages/admin/AdminHomePage.tsx`
- `src/pages/admin/AdminNavPage.tsx`
- `src/pages/admin/AdminDailyContentPage.tsx`
- `src/pages/admin/AdminRecitersPage.tsx`
- `src/pages/admin/AdminContentStringsPage.tsx`
- `src/pages/admin/AdminUserDetailPage.tsx`
- `src/components/admin/EditRowSheet.tsx`
- `src/components/admin/IconPicker.tsx`
- `src/components/admin/ColorPicker.tsx`

## Files edited (Phase 1)

- `src/App.tsx` — new routes, mount `usePublicAppConfig` provider.
- `src/contexts/ThemeContext.tsx` — apply HSL tokens from branding.
- `src/contexts/LanguageContext.tsx` — honor default language.
- `src/components/BottomNav.tsx` — render from `nav_items`.
- `src/pages/Index.tsx` — render from `home_sections`.
- `src/components/DailyAyah.tsx`, daily hadith/dua components — check overrides.
- `src/hooks/useSelectedReciter.ts` + `src/components/quran/SessionReciterPicker.tsx` — read reciters from DB, dynamic default.
- `src/components/admin/AdminShell.tsx` — new nav entries.
- `src/pages/admin/AdminContentPage.tsx` — add Edit action per row.
- `supabase/functions/admin-users/index.ts` — new admin write actions.

---

## Risks & notes

- **Scope is large.** The plan is structured so Phase 1 alone gives admins control of branding, home, nav, daily content, reciters, every CMS string, and full edit access on every user table. Phases 2–4 are incremental and can be approved separately.
- **Live theme changes** apply via CSS custom properties without reload, but users may notice a flash on navigation; acceptable and reversible.
- **Realtime cost**: one channel per public table, low-volume writes — negligible.
- **Data integrity**: every write goes through the edge function with zod + role check + audit log; users keep their RLS-scoped editing of their own rows.

Approve this plan to ship Phase 1, then I'll queue Phases 2–4 as follow-ups.