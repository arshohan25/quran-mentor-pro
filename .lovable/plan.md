

## Plan: Fix Over-Revealing Words in Interim Speech Matching

### Problem
The interim speech matching loop processes ALL tokens from the growing interim transcript every time. When the user finishes ayah 2, the interim text accumulates words like "الحمد لله رب العالمين الرحمن الرحيم". Each interim update re-scans all tokens, and since `revealedRef` advances with each match, words from ayah 3 get incorrectly revealed before the user actually recites them.

### Root Cause
In `useArabicRecitationEngine.ts` lines 154-172, the interim handler:
1. Tokenizes the FULL interim transcript into `allTokens`
2. Loops through ALL tokens, matching each against `currentWords[revealedRef.current]`
3. Since interim text grows (e.g., "الحمد" → "الحمد لله" → "الحمد لله رب"), old tokens get re-processed and keep advancing the revealed index beyond what was actually spoken

### Fix
Add an `interimMatchedCountRef` to track how many interim tokens have already been matched. Only process NEW tokens (those beyond the previously matched count). Reset this counter when a final result arrives or when the text changes.

### Changes to `src/hooks/useArabicRecitationEngine.ts`
- Add `interimMatchedCountRef = useRef(0)`
- In the interim handler: skip tokens up to `interimMatchedCountRef.current`, only try matching new tokens
- When a match succeeds in interim, increment `interimMatchedCountRef`
- Reset `interimMatchedCountRef` to 0 when `finalCountRef` advances or when `ayahText` changes

