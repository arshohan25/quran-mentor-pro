

# Real-Time Voice-Guided Hifz Practice — Word-by-Word Live Feedback

## Overview
When a user hides an ayah in HifzView and starts reciting, the system will reveal words one-by-one in real-time as they speak. If a word is wrong, it shows red, plays an error sound, and blocks progress until corrected.

## How It Works

```text
Hidden Ayah: [████████████████████████]
User recites "بسم" → [بِسْمِ] ████████████████
User recites "الله" → [بِسْمِ ٱللَّهِ] ██████████████
User says wrong word → [بِسْمِ ٱللَّهِ] [الرحيم] ← RED + beep
User corrects "الرحمن" → [بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ] ████
...continues until complete
```

## Changes

### 1. New Component: `src/components/quran/LiveRecitationCheck.tsx`
A self-contained component that takes an ayah's Arabic text and handles the entire live recitation flow:

- **Props**: `ayahText: string`, `onComplete: () => void`, `onCancel: () => void`
- **State**: `revealedWordIndex` (how many words revealed), `currentError: number | null` (index of wrong word), `isListening: boolean`
- **Logic**:
  - Splits ayah text into words array
  - Uses Web Speech API (`continuous: true`, `interimResults: true`, `lang: "ar-SA"`)
  - On each speech result, compares the latest recognized word against `words[revealedWordIndex]` using `normalizeArabic()` (reuse from PracticePage)
  - **Correct**: Increment `revealedWordIndex`, word appears in green briefly then normal
  - **Wrong**: Set `currentError` to that index, word appears in red with underline, play error beep sound (Web Audio API — short 400Hz tone), do NOT increment index
  - When next correct word is spoken, clear error and proceed
  - When all words revealed: auto-stop, call `onComplete()`
- **UI**: 
  - Row of words: revealed words shown normally, current position has a pulsing cursor, unrevealed words are blurred/hidden
  - Mic button at bottom (same style as PracticePage)
  - Progress indicator: "3/7 words"

### 2. Error Sound Effect
- Use Web Audio API (`AudioContext`) to generate a short beep (no external file needed)
- ~200ms, 400Hz sine wave, volume 0.3
- Play on wrong word detection

### 3. Integrate into `src/components/quran/HifzView.tsx`
- Add state: `activeRecitationAyah: number | null`
- When user taps a **hidden** ayah, instead of just toggling visibility, start `LiveRecitationCheck` for that ayah
- Replace the blurred ayah row with the `LiveRecitationCheck` component inline
- On complete: mark as memorized (optional prompt), clear `activeRecitationAyah`
- On cancel: return to blurred state
- Add a small mic icon indicator on hidden ayahs to hint "tap to practice"

### 4. Reuse Utilities
- Move `normalizeArabic()` from `PracticePage.tsx` to a shared util (e.g., `src/utils/arabicUtils.ts`) so both components can use it

## Files Changed
1. **NEW** `src/utils/arabicUtils.ts` — shared `normalizeArabic()` function
2. **NEW** `src/components/quran/LiveRecitationCheck.tsx` — word-by-word live recitation component
3. **EDIT** `src/components/quran/HifzView.tsx` — integrate LiveRecitationCheck on hidden ayah tap
4. **EDIT** `src/pages/PracticePage.tsx` — import `normalizeArabic` from shared util

