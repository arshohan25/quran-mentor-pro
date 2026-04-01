

# Rebuild Mushaf ReadingView — Pixel-Perfect Quran.com Clone

## Current Problems (vs Quran.com)

1. **Font**: Using Amiri (thin/light) — Quran.com uses **KFGQPC Uthmani Hafs** (bold, calligraphic)
2. **Verse markers**: Green `hsl(170 100% 26%)` and oversized — should be subtle, same color as text, small
3. **Bismillah**: Green colored — should match body text color
4. **Surah header**: Simple card with green title — Quran.com uses a bordered frame with surah name + English + ayah count, neutral colors
5. **Line spacing**: `2.6` is too wide — Quran.com uses ~`2.0`
6. **Text color**: Yellowish `hsl(40 20% 88%)` — should be clean white/near-white
7. **Page number**: `— 1 —` format — should be plain number
8. **Header bar**: Two-row header is bulky — Quran.com has a single clean bar
9. **Word spacing**: `4px` artificial spacing — should be natural
10. **Text alignment**: `text-center` — Quran.com uses `text-justify`

## Plan

### 1. Add KFGQPC Uthmani Font (index.css)
- Add `@font-face` or Google Fonts import for **"KFGQPC HAFS Uthmanic Script"** (or closest available: `Scheherazade New` from Google Fonts as fallback — it's a proper Uthmani Naskh font, bold and calligraphic)
- Update `.font-arabic` or add `.font-mushaf` class

### 2. Rewrite `ReadingView.tsx` — Full Overhaul

**Header** (single clean bar):
- Left: Back arrow + Page number
- Center: Surah name (Arabic) via SurahSelector
- Right: Juz number + Settings gear
- Background: `#1B1B2F` (deep navy), thin bottom border
- Single row, no secondary bar

**Surah intro block** (page 0 only):
- Bordered rectangular frame (subtle border, no background fill)
- Surah name in Arabic (white, not green)
- Below: English name + ayah count in small muted text
- Bismillah below frame in normal text color (not green)

**Body text**:
- Font: Scheherazade New (or KFGQPC if loadable), ~26px default
- Color: `#FFFFFF` or `rgba(255,255,255,0.92)`
- `text-align: justify`, `direction: rtl`
- Line-height: `2.0`
- No artificial word-spacing
- Verse end markers: `﴿١﴾` inline, same color as text, ~60% font size, subtle

**Page number** at bottom:
- Plain number, centered, muted color, no dashes

**Navigation bar** (sticky bottom):
- Same as current but with neutral colors instead of green

### 3. Update `ReadingSettings.tsx`
- Font size range: 20–40 (mushaf needs larger range)
- No other changes needed

### Files Changed
- `src/index.css` — Add Scheherazade New font import
- `src/components/quran/ReadingView.tsx` — Complete rewrite
- `src/components/quran/ReadingSettings.tsx` — Adjust min/max font size

