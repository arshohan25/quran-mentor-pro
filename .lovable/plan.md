

# Add Mushaf Reading View — Quran.com Style Clean Layout

## Overview
Create a new `ReadingView.tsx` component that displays Arabic-only Quran text in a clean, minimal Quran.com-inspired layout. No translations — pure reading experience.

## New File: `src/components/quran/ReadingView.tsx`

- **Header**: Teal `#008374` bar with back button, surah name (Arabic), SurahSelector dropdown, and ReadingSettings (font size, dark mode, tajweed toggle)
- **Surah info bar**: Shows current page number, juz number, and hizb — small muted text below header
- **Surah header**: Centered Arabic surah name + bismillah for non-Tawbah surahs, with a thin separator line
- **Ayah display**: Right-to-left Arabic text using Amiri font, flowing inline paragraph style (not per-ayah cards). Verse numbers shown as teal `﴿١﴾` markers inline
- **Pagination**: Chunk ayahs into pages (~15 per page). Simple prev/next buttons at bottom with page indicator
- **Swipe support**: Touch swipe left/right for page navigation
- **Tajweed**: Optional tajweed color-coding via existing `applyTajweedColors` utility
- **Background**: Clean `bg-white dark:bg-gray-950`, no parchment or ornate styling
- **Data**: Uses existing `useSurah()` hook with `quran-uthmani` edition
- **Page/Juz display**: Uses `mushafPages.ts` data for page numbers

## File Changes

### 1. `src/components/quran/ReadingView.tsx` (NEW)
Full component as described above.

### 2. `src/components/quran/types.ts`
Add `"reading"` back to `ActiveSection` type.

### 3. `src/pages/QuranPage.tsx`
- Import `ReadingView`
- Add "মুসহাফ" / "Mushaf" / "المصحف" category to `CATEGORIES` array with the existing `IslamicMushafIcon`
- Add conditional render for `activeSection === "reading"`

