

# Daily Dua Notification Feature

## Overview
Create a hook that shows a daily random dua as a browser notification, with a toggle to enable/disable it. Reuses the existing DUAS data from `DuaPage.tsx` and follows the same notification pattern as `usePrayerAlarm.ts`.

## Changes

### 1. Extract DUAS data to shared file
**New file: `src/data/duaData.ts`**
- Move the `DUAS` array and `Dua` interface from `DuaPage.tsx` to a shared data file
- Export both so `DuaPage.tsx` and the new hook can import them

### 2. Create `useDailyDuaNotification` hook
**New file: `src/hooks/useDailyDuaNotification.ts`**
- Uses a date-seeded random index to pick one dua per day (same dua all day, new one next day)
- On app load, checks if today's dua notification was already sent (via `localStorage` key `lastDuaNotifDate`)
- If not sent and notifications are granted and feature is enabled, sends a browser `Notification` with the dua's Bengali/English text and Arabic snippet
- Exposes: `{ enabled, toggleEnabled, todaysDua, permission, requestPermission }`
- Stores enabled state in `localStorage` key `duaDailyNotif`

### 3. Integrate into Home page
**Edit: `src/pages/Index.tsx`**
- Add a small "Daily Dua Reminder" card/toggle in the features section
- Call `useDailyDuaNotification()` so the check runs on app open
- Show today's dua as a preview card with notification toggle

### 4. Update DuaPage imports
**Edit: `src/pages/DuaPage.tsx`**
- Import `DUAS` and `Dua` from `src/data/duaData.ts` instead of defining inline

## Technical Details
- Date-seeded random: `(year * 10000 + month * 100 + day) % DUAS.length`
- Notification fires once per day on first app visit (like prayer alarm pattern)
- No new dependencies — uses Web Notification API already in use

