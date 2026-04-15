

## Plan: Mushaf-Style Sabina Page with Continuous Mic

### What changes
Completely redesign Sabina to use the **Mushaf page layout** (15 lines per page, word-by-word) instead of single-ayah view. Mic stays on continuously across pages.

### How it works
1. **Use `useQuranPage(pageNumber)`** to fetch exact Mushaf page data (lines + words) — same API the ReadingView uses
2. **Concatenate all words on the page** into one text string, feed to `useArabicRecitationEngine`
3. **Display in 15-line Mushaf layout** — each line shows its words RTL. Words start as dots/hidden, revealed as recited correctly
4. **When page completes** → auto-advance to next page, mic stays on
5. **Ayahs stay visible** after recitation (green text), never disappear
6. **Page navigation** — user can pick a surah (auto-jumps to its start page via `SURAH_START_PAGES`) or manually go prev/next page

### Engine changes (`useArabicRecitationEngine.ts`)
- Fix the `onend` handler: when `revealedRef.current >= words.length` (page complete), the engine currently sets `isListening = false`. Need to keep it alive — the `onComplete` callback will change the page text, and the `ayahText` change effect will restart recognition
- Store `words` in a ref so `onend` always checks the latest word count (currently captures stale `words` from closure)

### Page rewrite (`SabinaPage.tsx`)
- Replace surah+ayah selectors with **surah selector + page number display**
- Use `useQuranPage(currentPage)` instead of `useSurahWithTranslations`
- Build page text by joining all `line.words.map(w => w.text_uthmani)`
- Render 15 lines in a Mushaf-like grid, each word styled based on its index in the flat word array:
  - `i < revealedIndex` → visible green
  - `i === revealedIndex` → current position marker
  - `i === errorIndex` → red error
  - else → hidden dot
- On complete: `setCurrentPage(p => p + 1)`, keep mic running
- Hint button reveals current word temporarily
- Progress bar shows page-level progress
- Sticky mic button at bottom

### Files to modify
- **`src/pages/SabinaPage.tsx`** — Major rewrite to Mushaf page layout
- **`src/hooks/useArabicRecitationEngine.ts`** — Fix `onend` to use ref for words length, keep mic alive across page transitions

