

# Al Quran App — 5 New Features Plan

Inspired by **Al Quran (Greentech)** and **Al QURAN (9D Muslim)**, these features will bring the app closer to professional Quran apps.

## Features to Build

### 1. Juz & Surah Info Pages
Add detailed info cards showing surah summary (revelation type, ayah count, juz range, virtues) and a Juz browser to navigate the Quran by juz instead of only by surah.

**Changes:**
- **New file: `src/components/quran/JuzBrowser.tsx`** — Scrollable list of 30 juz with name (Arabic/Bengali/English), surah range, tap to navigate to that surah/ayah
- **New file: `src/components/quran/SurahInfoCard.tsx`** — Shows surah name, meaning, revelation type (Meccan/Medinan with icon), ayah count, juz range, ruku count. Displayed at top of Translation/Reading views
- **Edit `src/data/surahList.ts`** — Add `summary` and `virtues` fields (short Bengali/English descriptions) for at least the most popular surahs
- **Edit `src/pages/QuranPage.tsx`** — Add "Juz Browser" as a new category in the grid

### 2. Topic-Based Quran Browse
Browse ayahs by topic (Salah, Tawba, Patience, etc.) — each topic shows relevant ayahs with references.

**Changes:**
- **New file: `src/data/quranTopics.ts`** — Static data: ~15-20 topics with surah:ayah references, topic name in bn/en/ar
- **New file: `src/components/quran/TopicBrowser.tsx`** — Grid of topic cards; tapping a topic shows list of ayahs (fetched from API) with translations
- **Edit `src/pages/QuranPage.tsx`** — Add "Topics" category to the grid
- **Edit `src/components/quran/types.ts`** — Add `"topics" | "juz"` to `ActiveSection` type

### 3. Night Mode Toggle & Font Size Control
Add a settings panel accessible from reading views with dark/light toggle and Arabic font size slider.

**Changes:**
- **New file: `src/components/quran/ReadingSettings.tsx`** — Popover/sheet with: dark/light toggle (uses existing `useTheme`), Arabic font size slider (stored in localStorage, default 20px, range 16-36px), Tajweed on/off toggle (already exists but move here)
- **Edit `src/components/quran/ReadingView.tsx`** — Add settings button in header, read `arabicFontSize` from localStorage and apply to ayah text
- **Edit `src/components/quran/TranslationView.tsx`** — Same font size support

### 4. Copy & Share Ayah
Long-press or tap a share button on any ayah to copy text or share via Web Share API.

**Changes:**
- **New file: `src/components/quran/AyahActions.tsx`** — Small action bar with Copy and Share buttons. Copy puts Arabic + translation to clipboard. Share uses `navigator.share()` with fallback to clipboard
- **Edit `src/components/quran/TranslationView.tsx`** — Add `AyahActions` component to each ayah card (alongside existing Star button)
- **Edit `src/components/quran/ReadingView.tsx`** — Add tap-to-select ayah with copy/share popup

### 5. Mushaf View Mode (Enhanced Reading)
The current ReadingView is already mushaf-like. Enhance it to feel more authentic: add a "Mushaf" category entry point, smooth page-flip animation, and page number matching real Quran pages.

**Changes:**
- **Edit `src/pages/QuranPage.tsx`** — Add "মুসহাফ / Mushaf" as the first category (reuses ReadingView)
- **Edit `src/components/quran/ReadingView.tsx`** — Add header bar with back button + SurahSelector + settings gear icon. Add CSS page-flip animation on swipe. Show real Quran page number (from API `ayah.page` field) in footer instead of computed page

## Technical Details

- **Font size**: Stored as `arabicFontSize` in localStorage (number, px). Applied via inline style on Arabic text elements
- **Topics data**: Static JSON with `{ id, nameBn, nameEn, nameAr, references: [{surah, ayah}] }`. Ayah text fetched on-demand from existing API
- **Share API**: `navigator.share({ title, text })` with `navigator.clipboard.writeText()` fallback
- **Juz navigation**: Clicking a juz sets `selectedSurah` to `juz.startSurah` and navigates to ReadingView
- **No new dependencies** — all features use existing APIs, hooks, and UI components

## File Summary

| Action | File |
|--------|------|
| Create | `src/components/quran/JuzBrowser.tsx` |
| Create | `src/components/quran/SurahInfoCard.tsx` |
| Create | `src/data/quranTopics.ts` |
| Create | `src/components/quran/TopicBrowser.tsx` |
| Create | `src/components/quran/ReadingSettings.tsx` |
| Create | `src/components/quran/AyahActions.tsx` |
| Edit | `src/pages/QuranPage.tsx` |
| Edit | `src/components/quran/types.ts` |
| Edit | `src/components/quran/ReadingView.tsx` |
| Edit | `src/components/quran/TranslationView.tsx` |
| Edit | `src/data/surahList.ts` |

