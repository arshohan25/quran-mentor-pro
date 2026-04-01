

# Mushaf View — Quran.com Style Redesign

## Reference
Quran.com shows a clean, modern **verse-by-verse** layout:
- White background, no ornate borders
- Surah header: Arabic calligraphic name + English name + meaning, centered
- Bismillah in decorative Arabic with translation below
- Each ayah as a **separate card/section** with:
  - Top bar: verse ref (2:1) + play/bookmark icons on left, copy/share on right
  - Arabic text right-aligned, large, with verse number in ornate circle end-mark
  - Translation text below
- Separator lines between ayahs
- Clean teal/green header with "Page X / Juz X / Hizb X" info
- Toggle between "Verse by Verse" and "Reading" modes

## Changes

### 1. `src/components/quran/ReadingView.tsx` — Full rewrite of layout
- **Remove** MushafFrame wrapper, SurahBanner, flowing paragraph layout, ornate borders
- **Replace with** clean white scrollable verse-by-verse layout matching Quran.com:
  - Header: teal bar with surah selector, page/juz info, settings
  - Surah intro section: Arabic calligraphic surah name, English name, meaning, ayah count
  - Bismillah section (centered, decorative)
  - Each ayah rendered as its own section:
    - Action bar: `{surah}:{ayah}` label + play/bookmark left side, copy/share right side
    - Arabic text (RTL, large Amiri font, right-aligned) with ornate verse end marker ﴿١﴾
    - Bengali translation below (from API data)
    - Thin separator line
- **Scrollable** layout (remove `overflow-hidden`, use `overflow-y-auto`)
- Keep swipe navigation for surah-level, but primary navigation is scroll
- Keep tajweed toggle, font size, page jump features

### 2. `src/components/quran/MushafFrame.tsx` — Keep but unused by ReadingView
- No changes needed — keep for potential "Reading" (Mushaf) mode toggle later

### 3. `src/components/quran/ReadingView.tsx` — Ayah action bar
- Reuse existing `AyahActions` component for copy/share
- Add play button (triggers audio) and bookmark toggle per ayah
- Show verse reference as `{surahNumber}:{ayahNumberInSurah}`

### 4. Surah header section
- Large Arabic calligraphic surah name centered
- "{number}. {englishName}" + "info" badge
- Meaning translation below (e.g., "The Cow")
- Bismillah in decorative style with English translation

### 5. Style tokens
- Background: white (`bg-white dark:bg-gray-950`)
- Header: teal (`bg-[#008374]` / primary green)
- Ayah Arabic: large Amiri, right-aligned
- Translation: regular size, left-aligned, muted color
- Separator: thin `border-b` between ayah sections
- Verse number: ornate end-mark style ﴿١﴾

## Technical Notes
- Bengali + English translations already fetched via `useSurahWithTranslations`
- `AyahActions` component already handles copy/share
- `useBookmark` hook already provides `toggleFavorite`/`isFavorite`
- Font size and tajweed settings persist in localStorage
- Surah metadata available from `surahList` data

