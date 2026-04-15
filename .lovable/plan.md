

## Plan: "সবিনা" — Live Recitation Detection Page

### Overview
A new dedicated page `/sabina` where the user selects a Surah and Ayah, then starts reciting. Sabina listens via the microphone, reveals words one-by-one as the user recites correctly, marks errors in red with a warning beep, and pauses until the user corrects themselves.

### What already exists
- `useArabicRecitationEngine` hook — handles all the speech recognition, word matching, error detection, and beep sounds
- `LiveRecitationCheck` component — inline version of this feature
- `useQuranApi` hook — fetches Surah text with translations

### What to build

#### 1. New page: `src/pages/SabinaPage.tsx`
- Full-screen dedicated page with Islamic header ("সবিনা", "Sabina")
- Surah selector dropdown + Ayah navigation (prev/next)
- Large Arabic text display area showing words RTL:
  - **Correct words**: revealed in normal foreground color with a subtle green checkmark feel
  - **Current word**: highlighted with primary color + underline
  - **Error word**: red background + red text + warning beep (already handled by the engine)
  - **Upcoming words**: blurred/dimmed (not yet revealed)
- Large mic button to start/stop listening
- Progress bar showing words completed out of total
- Auto-advance to next ayah when current one is completed
- Sensitivity mode selector (strict/balanced/assist)

#### 2. Add route in `App.tsx`
- Add `/sabina` route pointing to `SabinaPage`

#### 3. Add link on Index page
- Add "সবিনা" to the quick actions or sections grid on the home page with a suitable icon (e.g., `Sparkles` or `Brain`)

### Files to create/modify
- **Create** `src/pages/SabinaPage.tsx` — full page using `useArabicRecitationEngine` + `useSurahWithTranslations`
- **Edit** `src/App.tsx` — add route
- **Edit** `src/pages/Index.tsx` — add navigation link

### No changes needed to
- `useArabicRecitationEngine` — already has all the logic (word matching, error beep, auto-restart recognition)
- `arabicUtils.ts` — matching utilities already complete

