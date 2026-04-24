## Phase 1 — Step 3: Recitation Coach v2 (word-level stats + heatmap)

Builds on the existing `useArabicRecitationEngine` (untouched — it's load-bearing) and the already-provisioned `recitation_sessions` + `recitation_word_stats` tables.

### What you'll get

1. **Per-word tracking** of every recitation attempt — correct, errors, and hesitations (>3s pauses on the same word).
2. **Session logging** to `recitation_sessions` whenever an ayah completes, with accuracy %, duration, and word counts.
3. A new **Recitation Stats page** at `/recitation/stats` showing:
   - Recent sessions list (surah/ayah, accuracy, date)
   - 7-day accuracy trend
   - **Word heatmap** for any selected ayah — each word shaded green→red by error/hesitation rate
   - "Weakest words" leaderboard across all your recitation
4. A small "View stats" link added to the Hifz Dashboard.

### Approach (non-invasive)

The existing engine is wired into Hifz, Recitation Check, and the keep-mic-alive flow. Instead of editing it, add an **observer hook** that reads its state and writes stats on completion. Zero risk to current behaviour.

### Files to create

- `src/hooks/useRecitationRecorder.ts` — Observer that watches `RecitationState` (`revealedIndex`, `errorIndex`, `isListening`, `totalWords`) and a `completed` boolean. Maintains per-word tallies in a ref, then on completion inserts one row into `recitation_sessions` and merge-upserts rows into `recitation_word_stats` (fetch-existing + add + upsert on `(user_id, surah, ayah, word_index)`).
- `src/hooks/useRecitationStats.ts` — React Query hooks: `useRecentSessions(limit)`, `useAyahHeatmap(surah, ayah)`, `useWeakestWords(limit)`, `useAccuracyTrend(days)`.
- `src/components/recitation/WordHeatmap.tsx` — Renders an ayah's words colored by error_rate = `(errors+hesitations)/max(attempts,1)`. Green ≤10%, amber 10–30%, red >30%.
- `src/components/recitation/SessionList.tsx` — Recent sessions card.
- `src/components/recitation/AccuracyTrend.tsx` — Simple 7-day bar chart of average accuracy.
- `src/pages/RecitationStatsPage.tsx` — Page assembling all of the above with surah/ayah selector for the heatmap.

### Files to edit

- `src/components/quran/HifzView.tsx` — Wire `useRecitationRecorder` with `surah`, `ayah`, the engine's `state`, and a `completed` flag set inside `handleRecitationComplete` (already exists). One-line addition; no behaviour change.
- `src/components/quran/LiveRecitationCheck.tsx` — Same observer hookup so non-Hifz recitation also records stats. Accept optional `surah`/`ayah` props (callers that don't pass them = no recording).
- `src/pages/HifzDashboardPage.tsx` — Small "View recitation stats" link in the header area.
- `src/App.tsx` — Add `/recitation/stats` route.

### Technical details

- **Counting rules** (computed inside the observer):
  - `correct++` for word index `i` whenever `revealedIndex` advances past it.
  - `error++` whenever `errorIndex` becomes a new value (deduped).
  - `hesitation++` if more than 3000ms elapsed since the last advance when the next correct word lands.
  - `attempts = correct + errors` (per word).
- **Persistence**: only fires when `completed === true` AND user is signed in AND `recordedRef` is false (one-shot per ayah).
- **Word heatmap**: needs the ayah's tokenized Arabic — fetched via existing `useSurahWithTranslations` and `tokenizeArabicWords` from `src/utils/arabicUtils.ts`.
- **Weakest words query**: `select surah, ayah, word_index, errors, hesitations, attempts from recitation_word_stats where user_id = auth.uid() order by (errors+hesitations) desc limit 20`. Display joins surah name + tokenized word client-side (lazy fetch the surah text only for surahs in the result).
- **Accuracy trend**: groups `recitation_sessions` by day in client (last 7 days, average accuracy, dot-bar chart with semantic tokens).

### Database

No migrations needed — `recitation_sessions` and `recitation_word_stats` are already provisioned with the required unique constraint `(user_id, surah, ayah, word_index)` and RLS scoped to `auth.uid()`.

### Out of scope

- Tarteel-style per-letter tajweed scoring (would need a server-side audio model).
- Streaming uploads of audio.
- Tafsir comparison (Step 4).

### Acceptance check

- Sign in, recite an ayah in Hifz mode → `recitation_sessions` gains a row with accuracy and duration; `recitation_word_stats` rows appear for each tokenized word.
- Recite the same ayah again with mistakes → counters accumulate (not overwritten).
- Visit `/recitation/stats` → see recent sessions, 7-day trend, weakest words, and a colored heatmap for any ayah you've practiced.
- Signed-out users see "Sign in to track your recitation" and the engine works as before with no DB writes.
