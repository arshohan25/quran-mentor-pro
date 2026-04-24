## Phase 1 — Step 4: Tafsir Comparison (4 Bengali sources side-by-side)

The 4 Bengali tafsirs (Ibn Kathir, Fathul Majid, Tafhimul Quran, Ahsanul Bayan) are already configured in `src/hooks/useTafsir.ts` but only one is shown at a time. This step adds a multi-source compare view.

### What you'll get

1. **"Compare all tafsirs" button** added to each ayah card in the Translation view (next to the existing single-tafsir accordion).
2. A bottom sheet that fetches **all 4 Bengali tafsirs in parallel** for the selected ayah and shows them stacked, each in its own card with a colored accent stripe so they're easy to scan.
3. The Arabic ayah + Bengali translation pinned at the top of the sheet for context.
4. **Per-tafsir copy button** for each entry.
5. A **direct-link route** `/tafsir/:surah/:ayah` so any ayah's comparison can be linked or bookmarked.

### Files to create

- `src/hooks/useTafsirCompare.ts` — uses `useQueries` to fan out one fetch per `TAFSIR_EDITIONS` entry against `https://api.quran.com/api/v4/tafsirs/:id/by_ayah/:s::a`. Strips HTML, caches each for 24h. Returns `[{edition, text, isLoading, error}]` aligned with `TAFSIR_EDITIONS`.
- `src/components/quran/TafsirCompareSheet.tsx` — Bottom sheet (uses existing shadcn `Sheet`) with the ayah header + 4 tafsir cards. Color-coded left borders (emerald / amber / sky / violet), per-card copy button, individual loading/error states so a slow source doesn't block the others.
- `src/pages/TafsirComparePage.tsx` — Standalone route reading `:surah` / `:ayah` from URL params; renders the same content as the sheet but as a full page with a back button.

### Files to edit

- `src/components/quran/TranslationView.tsx` — Add a small "Compare all" button (BookText icon + label) under each ayah. Holds local state `{ surah, ayah } | null` for the open sheet. Renders one shared `<TafsirCompareSheet>` driven by that state.
- `src/components/quran/ReadingView.tsx` — Add the same "Compare all tafsirs" link inside the existing translation popup so users in reading mode can also compare.
- `src/App.tsx` — Register `/tafsir/:surah/:ayah` route → `TafsirComparePage`.

### Technical details

- **Parallel fetch**: `useQueries` runs all 4 requests concurrently with independent cache entries. A 24h `staleTime` matches the existing single-tafsir cache, so opening the compare sheet after viewing a single tafsir reuses the cached result.
- **HTML scrub**: same `stripHtml` logic already used in `useTafsir.ts`, factored out so both hooks share behaviour.
- **Layout**: vertical stack, not side-by-side columns — Bengali tafsirs are long-form prose and don't read well in narrow columns on a 390px viewport. Each card has a colored left border for fast visual differentiation.
- **Direct-link page** uses the same `<TafsirCompareSheet>` content rendered inline (no sheet chrome) by reusing the inner block via shared layout.
- **No DB changes** — all data is fetched from the public quran.com API.

### Out of scope

- Cross-tafsir concordance / shared keyword highlighting (would need NLP per language).
- Saving tafsir notes (deferrable to Phase 2).
- Arabic tafsirs (the user explicitly chose 4 Bengali sources).

### Acceptance check

- Open Translation view → tap "Compare all tafsirs" on any ayah → sheet opens, all 4 tafsirs load in parallel, each with its own loading/error state.
- Slow source: if one tafsir fails, the other three still render; the failing one shows an inline error.
- Copy button on each card copies the cleaned text.
- Visit `/tafsir/2/255` directly → standalone page renders the same comparison.
