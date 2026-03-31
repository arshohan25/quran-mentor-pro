

# Make Quran Page Fully Responsive

## Problem
The header has too many controls crammed into one row — on mobile (390px), the toolbar buttons, qari selector, speed control, and language switcher overflow or get squished. The content area also uses fixed `calc()` heights that may not adapt well.

## Plan

### 1. Responsive Header Toolbar
- Break the header into two rows on mobile: top row = back button + title + language switcher; bottom row = view mode toggle, speed, auto-play, loop, search, tajweed, qari selector
- Use `flex-wrap` with proper gap so buttons wrap naturally on small screens
- Make the qari `Select` use a shorter `min-w` on mobile (`min-w-[90px]` instead of `120px`)

### 2. Mobile-Friendly Control Bar
- Move the toolbar controls (speed, auto-play, loop, search, tajweed) into a scrollable horizontal strip below the header on small screens
- Use `overflow-x-auto` with `flex-nowrap` so all controls are accessible via horizontal scroll

### 3. Surah Info Banner
- Reduce font sizes on mobile: Arabic name `text-2xl` instead of `text-3xl`, smaller padding
- Stack metadata badges vertically on very small screens

### 4. Ayah Cards
- Reduce padding on mobile (`p-3` instead of `p-4`)
- Arabic text size: `text-xl` on mobile, `text-2xl` on desktop
- Translation section: reduce left padding on mobile (`pl-0` instead of `pl-11`)

### 5. Navigation Buttons
- On mobile, show shorter labels or just arrows with surah number
- Reduce button padding for mobile

### 6. ScrollArea Heights
- Replace fixed `calc(100vh-320px)` with responsive values using `md:` breakpoints
- Use `h-[calc(100vh-280px)]` on mobile accounting for the taller wrapped header

### 7. Loop Range Selector
- Stack the from/to selectors vertically on mobile instead of horizontal row

## Files to Edit
- `src/pages/QuranPage.tsx` — all responsive changes in one file

