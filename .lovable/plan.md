

# Mushaf View — Full-Screen Single Page (No Scroll)

## Problem
The Mushaf content currently scrolls because the layout uses `min-h-screen` with variable content height. The reference screenshot shows the entire page fitting within the viewport — no scrolling, just the ornate frame filled edge-to-edge.

## Solution
Make the entire Mushaf view a fixed viewport-height layout where the MushafFrame and its content fill all available space between the header and bottom nav. The Arabic text area will use `flex-1 overflow-hidden` so text fills the space without scrolling.

## Changes

### `src/components/quran/ReadingView.tsx`
1. **Root container**: Change from `min-h-screen` to `h-screen overflow-hidden` with `flex flex-col`
2. **Remove extra elements**: Remove progress label below header, TajweedLegend block, SurahNav, and page dot navigation — these cause overflow. Keep only the header bar and the MushafFrame content area.
3. **Content area**: Replace `container py-3 max-w-xl mx-auto px-2` wrapper with `flex-1 overflow-hidden flex flex-col px-1 py-1`
4. **MushafFrame content**: The flowing paragraph div gets `flex-1 overflow-hidden` so text fills available space without scrolling
5. **Navigation**: Remove the prev/next buttons and page dots below the frame. Navigation is swipe-only (already implemented) — keeps the view clean like the reference.
6. **Font size auto-fit**: Keep user's `arabicFontSize` but add `overflow-hidden` on the text container so if content exceeds the frame, it clips rather than scrolls (matching real Mushaf behavior where each page has fixed content).

### `src/components/quran/MushafFrame.tsx`
7. **Make frame fill height**: Update MushafFrame to accept and pass through `className` so the parent can make it `flex-1 flex flex-col`. The inner content wrapper also needs `flex-1 flex flex-col`.

## Key Behavior
- Header (surah selector + progress bar) stays at top
- MushafFrame fills remaining viewport height
- Arabic text fills the frame, clipped if overflow (no scroll)
- Swipe left/right to navigate pages
- Bottom nav bar remains visible beneath

