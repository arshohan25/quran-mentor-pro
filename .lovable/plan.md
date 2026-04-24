

## Add a setup step before Hadith Practice starts

### Goal
When the user opens Hadith Practice from the home quick-actions, instead of dropping straight into the library list, show a short setup screen where they pick a **book (collection)** and a **chapter (topic)**, then start practicing hadith from that selection.

### Flow

```text
Home → "Hadith Practice" pill
        │
        ▼
  /hadith/practice  ← new setup page
   ┌──────────────────────────────┐
   │  Step 1 — Choose a book       │
   │  [Bukhari] [Muslim] [Tirmidhi]│
   │  [Abu Dawud] [Nasai] [Majah]  │
   │                              │
   │  Step 2 — Choose a topic      │
   │  ▢ ঈমান   (xx হাদীস)         │
   │  ▢ পবিত্রতা (xx হাদীস)       │
   │  ▢ সালাত  (xx হাদীস)         │
   │  …                           │
   │                              │
   │  [ Start practicing → ]       │
   └──────────────────────────────┘
        │
        ▼
  /hadith/<book>/<chapter>?practice=1
   → first hadith auto-opens in HadithPracticeDialog
```

### Changes

1. **New page `src/pages/HadithPracticeSetupPage.tsx`**
   - Two-step picker: book chips at top (uses `HADITH_COLLECTIONS`), chapter list below (uses `useHadithChapters`).
   - Bengali names from the new `HADITH_CHAPTER_NAMES_BN` map; English fallback.
   - Search box to filter chapters by Bengali or English name.
   - "Start practicing" button enabled once both are chosen → navigates to `/hadith/<book>/<chapter>?practice=1`.
   - "Resume last session" shortcut at the top if a saved practice session exists in localStorage (read keys via `useHadithPractice` storage prefix).

2. **Edit `src/App.tsx`** — register `/hadith/practice` route pointing to the new page.

3. **Edit `src/pages/Index.tsx`** — change the "Hadith Practice" quick-action pill's link from `/hadith` to `/hadith/practice`.

4. **Edit `src/pages/HadithChapterPage.tsx`**
   - Read `?practice=1` from the URL.
   - When the hadith list loads and the flag is set, auto-open `HadithPracticeDialog` on the first hadith of the chapter (clear the flag after opening so navigation back doesn't re-trigger).
   - Add a small "Practice mode" banner with a "Practice this hadith" button on each card already exists via `HadithCard`, so no card changes needed.

5. **Edit `src/components/hadith/HadithCard.tsx`** *(only if needed)* — ensure the practice dialog can be opened externally; likely already supports it via existing state. If not, lift a `defaultPracticeOpen` prop so the chapter page can trigger it on the first card.

### UX details
- Setup page uses the existing `islamic-header`, `Card`, and chip styling for visual consistency with the rest of the Hadith section.
- Selected book chip uses `bg-primary text-primary-foreground`; unselected uses `bg-muted`.
- Chapter rows show: number badge, Bengali name (primary), English name (muted subtitle), hadith count.
- Empty/loading/error states reuse the same `Loader2` and muted-text patterns as `HadithCollectionPage`.

### Out of scope
- No changes to the practice dialog logic, persistence, or the underlying API hook.
- No new dependencies.

