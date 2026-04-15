

## Plan: Sabina — Continuous Mic + Hidden Words with Hint Button

### Problems to fix
1. **Mic stops between ayahs** — When an ayah completes, the engine calls `stopListening()` then the ayah text changes which triggers another `stopListening()`. User has to manually restart mic each time.
2. **Words are visible (blurred but readable)** — User wants a true memorization mode: no words shown at all until recited correctly. Only a "Hint" button to peek at the current word.

### Changes

#### 1. Keep mic running across ayahs (`useArabicRecitationEngine.ts`)
- Remove `stopListening()` from the `onComplete` callback path — instead of stopping, just call `onComplete()` and let the engine naturally reset when `ayahText` changes
- In the `ayahText` change effect: instead of calling `stopListening()`, keep the recognition running — just reset `revealedIndex`, `errorIndex`, counters, etc. If recognition is active, restart it seamlessly (stop + immediate start)
- Add a `keepListening` option or handle it by checking if `isListening` was true before the text changed

#### 2. Hide all words, add Hint button (`SabinaPage.tsx`)
- Remove the blurred upcoming words — don't render unrecited words at all (or show dots/dashes as placeholders)
- Only show: revealed words (green/primary) + current word position indicator (e.g., "___") + error word (red)
- Add a `showHint` state and a "হিন্ট" button — clicking it temporarily reveals the current word for 2-3 seconds, then hides it again
- The hint shows only the current expected word, not the entire remaining text

### Files to modify
- `src/hooks/useArabicRecitationEngine.ts` — Keep recognition alive across ayah changes
- `src/pages/SabinaPage.tsx` — Hide words, add hint button, keep mic on continuously

