## Phase 1 — Step 2: Smart Hifz with Spaced Repetition (UI + Cloud Sync)

Builds on the auth + `hifz_srs` table from Step 1 and the `src/lib/srs.ts` SM-2 module. Adds a working "Today's Review" experience tied to the cloud, plus a one-time migration from the existing `localStorage` Hifz progress.

### What you'll get

1. A **"Today's Review"** queue at the top of the Hifz Dashboard showing how many ayahs are due, with a one-tap **Start review session** button.
2. A **Review Session screen** that walks the user through due ayahs one-by-one, hides the Arabic, lets them recall, then asks them to grade themselves: **Again / Hard / Good / Easy** (SM-2 quality 0/3/4/5). Each grade updates `next_review_at` in the cloud.
3. **Auto-creation of SRS cards** the first time a user marks an ayah as memorized in `HifzView`.
4. **One-time migration** on first sign-in: existing `localStorage` Hifz progress (`hifz-progress` key) is pushed into `hifz_srs` as new cards due today.
5. **Signed-out fallback**: dashboard still shows a "Sign in to enable smart review" CTA; existing local Hifz progress UI keeps working unchanged.

### Files to create

- `src/hooks/useHifzSrs.ts` — React Query hooks: `useDueCards()`, `useSrsCard(surah, ayah)`, `useReviewMutation()`, `useUpsertCard()`. Reads/writes `hifz_srs` scoped to `auth.uid()`.
- `src/lib/hifzMigration.ts` — `migrateLocalHifzToCloud(userId)` — idempotent; reads `localStorage["hifz-progress"]`, upserts cards with `next_review_at = now()`, sets a `localStorage` flag `hifz-srs-migrated-<userId>` so it runs once per user.
- `src/components/hifz/DueTodayCard.tsx` — Dashboard card showing due count, breakdown (new vs review), and **Start Review** button. Signed-out variant shows sign-in prompt.
- `src/components/hifz/ReviewSession.tsx` — Full-screen session UI: shows surah/ayah label, hidden Arabic (tap to reveal), translation toggle, then four grading buttons. Progress bar across the queue. On finish, shows summary (X reviewed, next due in Y).
- `src/pages/HifzReviewPage.tsx` — Route wrapper for the session, route `/hifz/review`.

### Files to edit

- `src/pages/HifzDashboardPage.tsx` — Mount `<DueTodayCard />` above `DailyGoalCard`. Run migration on mount when user is signed in.
- `src/components/quran/HifzView.tsx` — When `toggleMemorized` adds an ayah and user is signed in, also call `useUpsertCard` to create a default SRS card (due now). No-op when signed out.
- `src/App.tsx` — Add `/hifz/review` route.
- `src/contexts/AuthContext.tsx` — On `SIGNED_IN`, schedule `migrateLocalHifzToCloud` via `setTimeout(0)` (avoid blocking the auth callback).

### Technical details

- **Due query**: `select * from hifz_srs where user_id = auth.uid() and next_review_at <= now() order by next_review_at asc limit 50`. Cached by React Query with key `["hifz-srs", "due"]`; invalidated after each review mutation.
- **Review mutation**: takes `{ surah, ayah, quality }`, fetches existing card (or `defaultCard()`), runs `reviewCard(card, quality)` from `src/lib/srs.ts`, upserts on `(user_id, surah, ayah)`. **Requires** a unique constraint `(user_id, surah, ayah)` on `hifz_srs` — added via migration.
- **Migration logic**: for each `(surah, ayah)` in localStorage progress, upsert a card with `repetitions=0, ease=2.5, interval=0, next_review_at=now()` so they appear in today's queue. Skips ayahs that already have a cloud card.
- **Ayah text source**: session fetches Arabic via existing `useSurahWithTranslations(surah)` hook, picks ayah by `numberInSurah`. Translation toggled via `useLanguage()`.
- **Grading buttons** use `QUALITY_LABELS` from `src/lib/srs.ts` and show the projected next interval (e.g. "Good → 3d") computed by running `reviewCard` against the current card before commit.

### Out of scope for this step

- Recitation Coach v2 word-level scoring (Step 3).
- Tafsir comparison (Step 4).
- Bookmarks/Qaza migration (separate sync step).
- Notifications for due reviews (later — `useNotificationScheduler` integration).

### Acceptance check

- Signed-in user marks 5 ayahs memorized → dashboard shows "5 due today" → tapping Start Review walks through all 5 → grading "Good" pushes them to ~1d/3d → re-opening dashboard shows 0 due.
- Signed-out user sees prompt; existing Hifz UI still works.
- User with old localStorage progress signs in once → cards appear in cloud and queue.
