# Admin Content Management — Reciters, Lessons, Country Translations

## What's already in place
- **Reciters CMS** — `AdminRecitersPage` (`/admin/reciters`) already lets you add/edit/reorder/delete qaris, set the default, and toggle `enabled`. The `reciters` table is wired into the user-facing picker via `usePublicAppConfig` + `useSelectedReciter`. ✅ No changes needed here — the page already meets the request.
- **Content strings** — `AdminContentStringsPage` (`/admin/strings`) exists with bn/en/ar editing. We will extend it for country variants below.

## What's missing — build now

### 1. Lesson items library (new)
Today `recitation_sessions.lesson_type` is a free-text column. There's no curated list — the user just gets whatever string the code passes. We'll add a managed library so admins can publish lesson templates that show up in Live/Hifz.

**Schema migration** — new table `lesson_items`:
- `id` text PK (slug, e.g. `tajweed-basics`)
- `enabled` boolean default true
- `sort_order` int default 0
- `category` text (e.g. `tajweed`, `memorization`, `tarteel`)
- `title_bn`, `title_en`, `title_ar` text
- `description_bn`, `description_en`, `description_ar` text
- `target_surah` int nullable, `target_ayah_start` int nullable, `target_ayah_end` int nullable
- `recommended_reciter_id` text nullable (FK soft ref to `reciters.id`)
- `created_at`, `updated_at`
- RLS: anon/authenticated SELECT; admin INSERT/UPDATE/DELETE (mirrors `reciters` policies)
- Realtime: `ALTER PUBLICATION supabase_realtime ADD TABLE lesson_items`
- Audit trigger using existing `audit_admin_table_change()`

**Admin page** — `src/pages/admin/AdminLessonsPage.tsx`
- Pattern mirrors `AdminRecitersPage` (list cards, reorder via up/down arrows, enable switch, save & publish button).
- Trilingual title + description fields, category select, optional surah/ayah range, optional recommended reciter dropdown (sourced from `usePublicAppConfig().reciters`).
- Add/delete with confirmation.

**Wiring**
- Add `lessonItems: LessonItem[]` to `usePublicAppConfig.ts` state, fetch + subscribe like the other tables.
- Add nav entry in `AdminShell.tsx` (`{ title: "Lessons", url: "/admin/lessons", icon: BookOpen }`) and route in `App.tsx`.
- User-facing pick-up: small `LessonPicker` component in `src/components/quran/LessonPicker.tsx` that lists enabled lessons; integrate in `LiveRecitationCheck.tsx` and `HifzView.tsx` so selecting a lesson sets `lessonType` passed to `useRecitationRecorder` (existing prop).

### 2. Country-aware translation overrides (new)
Extend the existing string CMS so admins can ship copy that varies per country (e.g. Bangla wording for BD vs IN, English wording for US vs UK).

**Schema migration** — new table `content_item_locales` (sibling to `content_items`):
- `id` uuid PK
- `key` text references `content_items.key`-equivalent (use text, not FK, to allow lazy creation)
- `language` text (`bn`|`en`|`ar`)
- `country` text (ISO 3166-1 alpha-2, lowercase, e.g. `bd`, `in`, `us`, `gb`, `sa`, `ae`)
- `value` text
- `enabled` boolean default true
- `updated_at`, `updated_by`
- UNIQUE (`key`, `language`, `country`)
- Same RLS pattern as `content_items` (public read, admin write); realtime + audit trigger.

**Admin UI** — extend `AdminContentStringsPage.tsx`
- Each item card gains an expandable "Country overrides" section.
- Inside: a small table — pick language, pick country (preset list of common targets: BD, IN, PK, US, GB, SA, AE, MY, ID, EG, TR + free-text), enter value, enable toggle, delete row.
- Save persists overrides through `content_item_locales`.

**Resolver update** — `src/hooks/useContentString.ts` and `usePublicAppConfig.ts`
- Load `content_item_locales` and group by key → language → country.
- New helper `resolveContentString(key, language, country)`:
  1. Try `locales[key][language][country]` if enabled
  2. Fall back to `locales[key][language]['*']` (any global override)
  3. Fall back to `contentItems[key][language]` (current behavior)
  4. Fall back to provided `fallback`
- Add `country` to user/visitor context: detect via `navigator.language` region tag (e.g. `bn-BD` → `bd`) on first load, persist in `localStorage` as `user_country`, expose via new `useUserCountry()` hook with a manual override (Account page settings + admin can force a default in `app_branding.default_country`).

**Branding extension** — add `default_country` text column to `app_branding` (nullable). Admin branding page gets a country select.

### 3. User-facing country picker
- New small component in `src/components/CountrySwitcher.tsx` similar to `LanguageSwitcher.tsx`.
- Surface in `AccountPage.tsx` so users can manually override the auto-detected country.

## Files to create
- `supabase/migrations/<ts>_lessons_and_country_locales.sql` — `lesson_items`, `content_item_locales`, `app_branding.default_country`, RLS, realtime, audit triggers.
- `src/pages/admin/AdminLessonsPage.tsx`
- `src/components/quran/LessonPicker.tsx`
- `src/components/CountrySwitcher.tsx`
- `src/hooks/useUserCountry.ts`

## Files to edit
- `src/hooks/usePublicAppConfig.ts` — add `lessonItems`, `contentLocales`, subscribe to new tables.
- `src/hooks/useContentString.ts` — country-aware resolver.
- `src/pages/admin/AdminContentStringsPage.tsx` — country override editor per row.
- `src/pages/admin/AdminBrandingPage.tsx` — add default-country select.
- `src/components/admin/AdminShell.tsx` — add "Lessons" nav entry.
- `src/App.tsx` — register `/admin/lessons` route.
- `src/components/quran/LiveRecitationCheck.tsx` and `src/components/quran/HifzView.tsx` — render `LessonPicker`, pass selected lesson into `useRecitationRecorder`.
- `src/pages/AccountPage.tsx` — surface `CountrySwitcher`.

## Out of scope (already shipped)
- Reciter CRUD page (already at `/admin/reciters`).
- Branding, home sections, nav, daily content overrides (Phase 1 work).

## Open question
Default country list to seed in the admin override picker — confirmed BD, IN, PK, US, GB, SA, AE, MY, ID, EG, TR. Add/remove if you want a different set before I start.
