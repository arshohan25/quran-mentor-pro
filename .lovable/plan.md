
আপনি একদম ঠিক ধরেছেন — Mushaf view “দেখতে” আপডেট হয়েছে, কিন্তু “core behavior” এখনো ভুল ছিল। তাই ফিক্সটা অসম্পূর্ণ মনে হচ্ছে।

## কেন ঠিকমতো কাজ করছে না (Root Causes)

1. **Pagination logic এখনও fake (character-based)**  
   `ReadingView` এখনো `LINES_PER_PAGE` + `CHARS_PER_LINE` দিয়ে page বানাচ্ছে।  
   ফলে real Mushaf page flow (API `ayah.page`) এর সাথে content match করে না।

2. **Prev navigation bug আছে**  
   প্রথম page থেকে আগের সূরায় গেলে `setCurrentPage(999)` সেট হচ্ছে, কিন্তু পরে clamp/restore হচ্ছে না।  
   এতে blank/odd page jump হতে পারে।

3. **Ref warnings (console) unresolved**  
   `ReadingSettings` এবং `SurahNav` নিয়ে `Function components cannot be given refs` warning আছে।  
   এগুলো interaction stability (popover/nav behavior) degrade করতে পারে, especially mobile এ।

4. **Visual polish হয়েছে, structural Mushaf engine হয়নি**  
   শুধু flowing text/UI change করা হয়েছে, কিন্তু page model/restore/navigation এখনো Mushaf-grade হয়নি।

## Fix Plan (Implementation)

### Step 1 — Pagination engine rewrite (Mushaf-first)
- `ReadingView`-এ char-count pagination বাদ।
- `data.arabic.ayahs` কে `ayah.page` দিয়ে group করে page বানানো।
- UI page indicator, swipe, next/prev সব এই real page groups থেকে চালানো।

### Step 2 — Cross-surah navigation hard fix
- `currentPage=999` hack remove।
- Surah change হলে safe page index clamp/restore করা।
- Prev/Next transitions deterministic করা (no blank state)।

### Step 3 — Ref warning cleanup
- `ReadingSettings` ও `SurahNav` কে `forwardRef` compatible করা (or ref path remove)।
- Popover trigger/nav root ref-safe করা।

### Step 4 — Last-read restore correctness
- saved `lastRead.page/section` থেকে Mushaf route open হলে exact page restore করা।
- Invalid/outdated index হলে graceful fallback (page 0 বা nearest valid page)।

### Step 5 — UI parity pass (reference-like)
- Mobile (390x638) এ spacing, line-height, ayah marker baseline, header density tune।
- Tajweed on/off এ layout shift minimize করা।

## Technical Notes
- Remove dependence on `LINES_PER_PAGE`/`CHARS_PER_LINE` for Mushaf.
- Keep existing theme/font settings logic; only reading layout engine replace.
- Add index guard: `currentPage = min(max(currentPage,0), totalPages-1)` everywhere state can drift.

## Acceptance Criteria
- Mushaf page content real-page grouped (no random jump).
- Surah boundary navigation works without blank pages.
- Console shows no ref warning for `ReadingView`.
- Reload করলে last-read Mushaf page reliably restore হয়।
- Mobile swipe + page buttons + surah selector end-to-end stable.
