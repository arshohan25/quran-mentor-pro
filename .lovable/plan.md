

# Mushaf Reading View — Quran.com Clean Style (Arabic Only, No Translation)

## What the User Wants
Match Quran.com's clean, modern layout for the **Reading** view — Arabic-only (no translation/tarzama). The Quran.com style features:
- Clean white background, no ornate borders
- Teal header bar (`#008374`) with surah name, page/juz info
- Decorative surah intro: Arabic calligraphic name + English name + meaning
- Bismillah in calligraphic style
- Flowing Arabic text, right-aligned, large font with verse end markers
- Minimal, modern design — no parchment texture or ornate frame

## Current State
The current ReadingView uses an ornate MushafFrame with parchment colors (`#F5EFE0`), triple borders, corner ornaments, and edge patterns. This looks traditional but not like Quran.com's clean modern design.

## Changes

### 1. `src/components/quran/ReadingView.tsx` — Restyle layout
- **Background**: Change from parchment `#F5EFE0` to clean white `bg-white dark:bg-gray-950`
- **Header**: Change from dark green `#2D5016` to Quran.com teal `#008374`
  - Add Page/Juz/Hizb info line below surah selector
  - Keep settings gear, surah selector, page jump
- **Remove MushafFrame**: Replace with a simple clean container (no ornate borders)
- **Surah intro section** (on first page): 
  - Arabic calligraphic surah name centered (large)
  - `{number}. {englishName}` + meaning below
  - Bismillah in elegant calligraphic style with subtle divider
- **Arabic text area**: Flowing paragraph, clean white bg, generous padding, large Amiri font
  - Verse end markers ﴿١﴾ in teal color matching header
- **Bottom**: Simple centered page number, no ornaments
- **Keep**: swipe navigation, tajweed toggle, font size, page jump, auto-save, progress bar

### 2. `src/components/quran/MushafFrame.tsx` — No changes
Keep the file for potential future "traditional" mode toggle, but ReadingView will stop importing it.

### 3. Color/Style Tokens
| Element | Current | New (Quran.com style) |
|---------|---------|----------------------|
| Background | `#F5EFE0` parchment | `white` / `gray-950` |
| Header | `#2D5016` dark green | `#008374` teal |
| Progress bar | green gradient | teal gradient |
| Verse numbers | `#2D5016` green | `#008374` teal |
| Arabic text | `#1a1008` dark brown | `#1a1a1a` / near-black |
| Surah banner | Ornate bordered frame | Simple centered text block |
| Page borders | Triple SVG ornate borders | None — clean card |

### 4. Technical Details
- Remove `MushafFrame` and `SurahBanner` imports
- Replace the entire render section with a simpler clean layout
- Keep all logic: page grouping, swipe, navigation, bookmark, settings
- Surah intro shows: Arabic name in decorative size, English name, meaning, ayah count
- No translation shown (reading-only mode as requested)

