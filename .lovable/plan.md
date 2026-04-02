

# Daily Amal (দৈনিক আমল) Feature

## Overview
A new "Daily Amal" page showing recommended daily Islamic deeds/practices with Quran/Hadith references, their benefits (ফযিলত/profit), and a completion tracker with feedback.

## What It Includes

Each amal entry will have:
- **Arabic text** of the amal
- **Trilingual description** (bn/en/ar)
- **Reference** — Quran ayah or Hadith source
- **Benefit/Profit (ফযিলত)** — what reward you get for doing it
- **Completion checkbox** — track daily, resets each day
- **Feedback** — congratulatory message + progress stats when you mark items done

## Data Structure
A static data file (`src/data/dailyAmalData.ts`) with ~15-20 daily amals across categories:
- Morning/Evening azkar
- After Salah deeds
- Sunnah acts (miswak, salaam, sadaqah, etc.)
- Quran recitation targets
- Night deeds (tahajjud, witr, istighfar)

Each item: `{ id, category, arabic, bn, en, ar, reference, benefitBn, benefitEn, benefitAr, targetCount }`

## UI Design
- Header with back arrow + language switcher (same pattern as DuaPage)
- Daily progress bar at top showing X/Y amals completed today
- Category filter pills (scrollable)
- Card list — each card shows:
  - Category badge
  - Arabic text
  - Translation
  - Reference (📖 icon)
  - Benefit/profit section (🌟 icon, highlighted in accent color)
  - Checkbox/counter to mark completion
- Completion feedback: toast + streak counter persisted in localStorage

## Completion Tracking
- `localStorage` key `daily-amal-{YYYY-MM-DD}` stores completed amal IDs
- Shows today's completion percentage at top
- Streak tracking: consecutive days with 50%+ completion

## Files to Create/Edit

1. **NEW** `src/data/dailyAmalData.ts` — amal data array + categories
2. **NEW** `src/pages/DailyAmalPage.tsx` — full page component
3. **EDIT** `src/App.tsx` — add route `/daily-amal`
4. **EDIT** `src/pages/Index.tsx` — add Daily Amal to sections list with link

