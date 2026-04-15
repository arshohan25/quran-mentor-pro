

## Plan: Play Correct Pronunciation Audio on Error in Sabina

### What to build
When the user makes a mistake on a word, automatically play a short audio clip of the correct pronunciation of that specific word using the Quran.com word audio API.

### How it works
- Quran.com provides per-word audio at: `https://audio.qurancdn.com/wbw/...` 
- The word-by-word API (`/api/v4/verses/by_key/{surah}:{ayah}?words=true&word_fields=audio_url`) returns an `audio_url` field for each word
- When `errorIndex` is set in the engine, fetch the word audio URL and play it so the user hears the correct pronunciation

### Changes

#### 1. New hook: `src/hooks/useWordCorrection.ts`
- Accepts `surahNumber`, `ayahNumber`, and `errorWordIndex`
- Fetches word data from Quran.com API for the current ayah (cached per ayah)
- When `errorWordIndex` changes to a non-null value, plays the audio for that word position
- Uses a simple `new Audio(url).play()` approach
- API: `https://api.quran.com/api/v4/verses/by_key/${surah}:${ayah}?language=ar&words=true&word_fields=audio_url`

#### 2. Update `src/pages/SabinaPage.tsx`
- Import and use `useWordCorrection(selectedSurah, currentAyah, errorIndex)`
- Add a small speaker icon button next to the error message so user can replay the correct audio manually
- The audio plays automatically on error, with a manual replay option

### Files
- **Create** `src/hooks/useWordCorrection.ts`
- **Edit** `src/pages/SabinaPage.tsx` — integrate the hook + add replay button

