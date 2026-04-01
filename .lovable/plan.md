

# Mushaf Reading View — Quran.com Style Redesign

## What Changes
Replace the current ornate Mushaf frame + flowing paragraph layout with Quran.com's clean, modern **verse-by-verse scrollable** design.

## Visual Design (matching Quran.com screenshot)

```text
┌─────────────────────────────────┐
│ ← 2. Al-Baqarah    ⚙️ Settings │  ← Teal header (#008374)
│  📄 Page 2  Juz 1 / Hizb 1     │
│  [Verse by Verse] [Reading]     │  ← Mode toggle (future)
├─────────────────────────────────┤
│                                 │
│    ﴾ البقرة ﴿                   │  ← Decorative surah name
│    2. Al-Baqarah                │
│    The Cow · 286 verses         │
│                                 │
│  بسم الله الرحمن الرحيم         │  ← Centered bismillah
│  In the Name of Allah...        │
│                                 │
├─────────────────────────────────┤
│ 2:1  ▶ 🔖        📋 📤 ···     │  ← Action bar per ayah
│                                 │
│              الٓمٓ ١              │  ← Arabic text (RTL, large)
│                                 │
│ Alif-Lãm-Mĩm.                  │  ← Translation (LTR)
├── thin separator ───────────────┤
│ 2:2  ▶ 🔖        📋 📤 ···     │
│                                 │
│  ذَٰلِكَ ٱلْكِتَـٰبُ ... ٢      │
│                                 │
│ This is the Book...             │
├── thin separator ───────────────┤
│ ... (scrollable)                │
└─────────────────────────────────┘
```

## Files to Change

### 1. `src/components/quran/ReadingView.tsx` — Full layout rewrite
- **Remove**: MushafFrame wrapper, ornate borders, flowing paragraph, swipe navigation, page-based pagination
- **Replace with**: Scrollable verse-by-verse list layout
- **Header**: Teal/green bar with back button, surah selector, page/juz info, settings gear
- **Surah intro**: Arabic calligraphic name centered, English name + meaning, ayah count
- **Bismillah**: Centered decorative bismillah with translation (skip for Surah 9)
- **Each ayah section**:
  - Action bar: `{surah}:{ayah}` ref + play/bookmark on left, copy/share on right (reuse `AyahActions`)
  - Arabic text: large Amiri font, right-aligned, with ornate verse end marker
  - Bengali translation below (from `data.bengali.ayahs`)
  - Thin `border-b` separator
- **Background**: Clean white (`bg-white dark:bg-gray-950`) instead of parchment
- **Scrollable**: `overflow-y-auto` instead of `overflow-hidden`
- Keep: tajweed toggle, font size settings, surah selector, bookmark/last-read saving, page jump

### 2. `src/components/quran/AyahActions.tsx` — Minor enhancement
- Add optional `onPlayAudio` and `onBookmark` callbacks
- Add play button (▶) and bookmark button (🔖) alongside existing copy/share
- Show bookmark filled state via `isFavorite` prop

### 3. Styling tokens
- Header: `bg-[#008374]` (Quran.com teal)
- Ayah Arabic: `text-right`, large `font-arabic`, dark text
- Translation: normal size, `text-left`, muted gray
- Verse number: ornate end-mark `﴿١﴾` inline with Arabic text
- Separator: `border-b border-gray-200 dark:border-gray-800`
- Action icons: muted gray, small (16px)

## What Stays the Same
- `useSurahWithTranslations` hook (already fetches Arabic + Bengali + English)
- `useBookmark` for favorites and last-read
- `SurahSelector` component
- `ReadingSettings` popover (font size, tajweed, theme)
- `TajweedText` component for colored tajweed
- Helper functions (`toArabicNum`, `getJuzNumber`, `stripBismillah`)

