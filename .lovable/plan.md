

## Show Hadith chapter titles in Bengali

### Problem
On `/hadith/muslim`, chapter titles render in English ("The Book of Faith", "The Book of Purification"…). The current data source (`fawazahmed0/hadith-api` Bengali edition) only translates hadith bodies — its `metadata.sections` map keeps the original English book names. So even on the Bengali edition, chapter labels come through in English.

### Fix
Maintain a small, local Bengali chapter-name map for each of the 6 collections and use it as the primary label, falling back to the API's English name when a translation is missing.

### Changes

1. **New file `src/data/hadithChapterNamesBn.ts`**
   - Export `HADITH_CHAPTER_NAMES_BN: Record<bookSlug, Record<chapterNumber, string>>` for `bukhari`, `muslim`, `tirmidhi`, `abudawud`, `nasai`, `ibnmajah`.
   - Cover all standard chapters (Sahih Muslim ~56 books, Bukhari ~97, etc.) with widely-used Bengali names (e.g. `১: ঈমান`, `২: পবিত্রতা`, `৩: হায়েয`, `৪: সালাত`…).
   - Keys are stringified chapter numbers to match the API's section keys.

2. **Edit `src/hooks/useHadithApi.ts`**
   - In `useHadithChapters(bookSlug)`, import the BN map and for each chapter compute:
     - `chapterBengali = MAP[bookSlug]?.[num]`
     - `chapterEnglish = name` (existing English from API, kept as fallback)
   - Extend `ApiChapter` interface with optional `chapterBengali?: string`.

3. **Edit `src/pages/HadithCollectionPage.tsx`**
   - Use `useLanguage()` `language` to choose the title:
     - `bn` → `ch.chapterBengali ?? ch.chapterEnglish`
     - else → `ch.chapterEnglish`
   - Optionally show the English name as a small subtitle under the Bengali title when `language === "bn"` (helps users recognize the book).
   - Replace the hadith count label with `{ch.hadithCount} {t("হাদীস", "hadith")}` (already correct).

4. **Edit `src/pages/HadithChapterPage.tsx`** (same pattern, for the chapter header)
   - Apply the same Bengali-first label logic so the header on the hadith list page also reads in Bengali.

### Out of scope
- No changes to API source, caching, search, or practice features.
- No new dependencies.

### Notes
- The Bengali chapter map is static and small (a few KB), shipped with the app — works offline, no extra requests.
- If a chapter number isn't in the map (e.g. rare appendices), the UI gracefully falls back to the English name so nothing renders blank.

