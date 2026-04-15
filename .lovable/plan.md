

## Plan: Add Verse Start Marker & Word-by-Word Audio Highlighting in Mushaf View

### What the user wants
1. **Verse number at the start** — Currently verse numbers only appear at the end (end-of-verse marker). The user wants a verse indicator at the **beginning** of each verse too (like the reference image shows).
2. **Word-by-word highlighting during recitation** — When audio plays, each word should highlight in real-time as it's being recited, similar to karaoke-style tracking.

### Implementation

#### 1. Add `isStartOfVerse` flag to word data
- In `useQuranPage.ts`, add an `isStartOfVerse: boolean` field to `PageLineWord`
- Set it to `true` for the first word of each verse (position === 1 or when verse_key changes)

#### 2. Render verse start marker in ReadingView
- Before each word where `isStartOfVerse` is true, render a small verse number circle (similar to the end-of-verse marker but styled slightly differently — e.g., filled background)
- This gives visual indication of where each verse begins

#### 3. Add per-verse audio playback with word timing
- Use the **Quran.com v4 recitation API** (`/api/v4/recitations/{reciter_id}/by_ayah/{verse_key}`) which provides audio URLs per ayah
- Use the **word timestamps API** (`/api/v4/quran/verses/by_page/{page}?words=true&word_timestamps=true`) to get per-word timing segments
- Create a new hook `useMushafAudio` that fetches audio + word timestamps for a given verse

#### 4. Word-by-word highlight during playback
- Add state to `ReadingView`: `playingVerse` (which verse is playing) and `highlightedWordIndex` (current word)
- When a verse's audio plays, use `timeupdate` events on the `<Audio>` element to compare `currentTime` against word timestamp segments
- Highlight the current word with a distinct background color (e.g., teal glow)
- Auto-advance highlight as audio progresses

#### 5. Play button per verse
- Add a small play/pause icon next to each verse start marker
- Clicking it starts audio for that specific verse with word-by-word tracking
- When the verse finishes, optionally auto-play next verse

### Files to modify
- `src/hooks/useQuranPage.ts` — Add `isStartOfVerse` field
- `src/components/quran/ReadingView.tsx` — Add verse start markers, audio state, word highlighting logic, play controls
- New: `src/hooks/useMushafWordAudio.ts` — Hook to fetch per-verse audio URLs and word timestamps from Quran.com API

### Technical notes
- Quran.com API endpoint for word timestamps: `https://api.quran.com/api/v4/verses/by_key/{verse_key}?words=true&word_fields=text_uthmani&reciter=7` provides timing data via `audio` field on each word
- Alternative: use `/api/v4/recitations/7/by_ayah/{verse_key}` for audio URL, then `/api/v4/verses/by_key/{verse_key}?words=true` with timing segments
- Will use Mishary Rashid Alafasy (reciter ID 7) as default

