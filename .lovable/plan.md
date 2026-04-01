

# Remove Current Mushaf Ornate Style — Clean Minimal Layout

## Changes in `src/components/quran/ReadingView.tsx`

1. **Remove MushafFrame & SurahBanner** — stop importing and wrapping content in the ornate frame component
2. **Replace parchment background** (`#F5EFE0` / `#1a1510`) with clean white/dark (`bg-white dark:bg-gray-950`)
3. **Replace dark green header** (`#2D5016`) with a neutral or teal header (`#008374`)
4. **Remove ornate elements**: gold/brown borders, diamond SVG dividers, gradient ornaments, decorative page number frame
5. **Simplify surah header**: plain centered text instead of `SurahBanner` with wing ornaments
6. **Simplify bismillah**: plain centered text, simple thin line divider instead of diamond ornament
7. **Clean verse markers**: use teal `#008374` instead of dark green for `﴿١﴾` markers
8. **Simple bottom page number**: plain text, no gradient lines
9. **Clean page jump & progress bar**: match teal theme
10. **Swipe indicator**: teal instead of green

The `MushafFrame.tsx` file itself stays untouched (kept for future use), just no longer imported in ReadingView.

