
# Bengali Hadith + Tafsir + Qaza Tracker + Notifications + AI Q&A

5 major features added to the existing app, reusing current patterns (LanguageContext, premium-card styling, localStorage for client state, react-query for API data). Lovable Cloud will be enabled to power the AI Q&A edge function.

## 1. Bengali Hadith Library (`/hadith`)

A new section covering **Sahih Sittah** with Bengali text and search.

**Data source**: [hadithapi.com](https://hadithapi.com) (free, supports Bengali via `lang=bn` for Bukhari/Muslim/Tirmidhi/Abu Dawud/Nasai/Ibn Majah). Fallback: bundled JSON for offline-friendly browsing of book/chapter lists.

**Pages**:
- `/hadith` — 6 collection cards (Bukhari, Muslim, Tirmidhi, Abu Dawud, Nasa'i, Ibn Majah) + global search bar + "Daily Hadith" widget.
- `/hadith/:collection` — chapter list (kitab) for that book.
- `/hadith/:collection/:chapter` — paginated hadith list with Arabic + Bengali + narrator + grade (sahih/hasan/da'if).

**Features**: search by keyword across all collections, filter by grade, bookmark hadith, share, copy. Bookmarks reuse the `useBookmark` hook pattern (extended with a `hadithBookmarks` slice).

**Files**:
- `src/pages/HadithPage.tsx`, `HadithCollectionPage.tsx`, `HadithChapterPage.tsx`
- `src/hooks/useHadithApi.ts` (react-query)
- `src/data/hadithCollections.ts` (collection metadata + chapter fallback)
- `src/components/hadith/HadithCard.tsx`, `HadithSearchBar.tsx`, `DailyHadith.tsx`

## 2. Tafsir inside Translation View

Each ayah gets an expandable **"তাফসির দেখুন"** accordion under the existing Bengali translation.

**Data source**: quran.com tafsir API — `https://api.quran.com/api/v4/tafsirs/{id}/by_ayah/{key}`.
- Default tafsir: **Tafsir Ibn Kathir (Bengali)** — id `164`.
- Optional dropdown: Ibn Kathir, Fathul Majid, Tafhimul Quran, Ahsanul Bayan (Bengali ones available on quran.com).

**Behavior**: lazy-loaded per ayah on accordion open (not all at once — saves bandwidth). React-query caches per `surah:ayah:tafsirId`. Stripped of HTML, rendered as plain text inside a `<details>` styled as a card section.

**Files**:
- `src/hooks/useTafsir.ts`
- `src/components/quran/TafsirAccordion.tsx`
- `TranslationView.tsx` — add `<TafsirAccordion>` per ayah; add tafsir-edition selector in header.

## 3. Qaza Prayer Tracker (`/qaza`)

Track lifetime missed prayers per waqt, log makeup, view dashboard.

**Setup screen** (first visit): user inputs estimated missed counts for Fajr / Dhuhr / Asr / Maghrib / Isha / Witr (7 fields). Stored in localStorage as `qaza_initial`.

**Dashboard**:
- Total missed remaining (per prayer + grand total)
- Progress ring per waqt (`% completed`)
- "Today" quick-log: + buttons to log 1 makeup for each prayer (also supports custom +N)
- 30-day chart (reuses `HifzProgressChart` pattern with recharts)
- Streak: consecutive days with at least 1 makeup
- Reset / edit initial counts

**Storage**: localStorage (`qaza_state` = `{initial, completed, dailyLog: {date: {fajr, dhuhr,...}}}`). When Cloud auth is added later, easy migration to Supabase.

**Files**:
- `src/pages/QazaPage.tsx`
- `src/hooks/useQazaTracker.ts`
- `src/components/qaza/QazaSetup.tsx`, `QazaDashboard.tsx`, `QazaProgressRing.tsx`, `QazaDailyLog.tsx`, `QazaChart.tsx`

Route added at `/qaza` and tile added to Index.

## 4. Adhan + Daily Reminder Notifications

Configurable Web Push (Notifications API) with daily ayah and adhan reminders. Existing `useDailyDuaNotification` already shows the pattern — we extend the system.

**New settings page** (`/notifications`):
- Master toggle + "Request permission"
- 5 prayer adhan toggles (Fajr/Dhuhr/Asr/Maghrib/Isha) — auto times from `usePrayerTimes` (geo) with optional manual offset (-15…+15 min)
- Daily Ayah toggle + time picker (default 08:00)
- Daily Hadith toggle + time picker (default 19:00)
- Daily Dua toggle (existing) — moved here for consolidation
- Per-notification sound: silent / soft chime / adhan audio (short clip)

**Engine** (`useNotificationScheduler`):
- On mount + on settings change, computes next-fire times for each enabled item
- Uses `setTimeout` chains (re-arms after each fire) — simple, works while tab/PWA is open
- For background delivery on installed PWA, registers a Service Worker with periodic checks
- Adhan audio: short MP3 in `/public/audio/adhan-soft.mp3` (and a Fajr-specific one with "as-salatu khayrun min an-nawm")
- Daily Ayah: pulls from existing `surahList` + cached random ayah; click → opens `/quran?surah=X&ayah=Y`

**Files**:
- `src/pages/NotificationsPage.tsx`
- `src/hooks/useNotificationScheduler.ts`
- `src/hooks/useNotificationSettings.ts` (localStorage-backed config)
- `src/utils/notifications.ts` (permission, schedule, fire helpers)
- `public/sw-notifications.js` (service worker)
- `public/audio/adhan-soft.mp3`, `adhan-fajr.mp3` (small CC0 clips)

**Note**: True server-side push requires user accounts + a push service. Phase 1 uses local scheduling (works while app is open or PWA is installed). When Cloud auth lands, we can upgrade to true Web Push with VAPID via an edge function.

## 5. AI Bengali Islamic Q&A (`/ask`)

Chat interface where users ask Islamic questions in Bengali; Lovable AI answers in Bengali with disclaimers and references.

**Backend**: Lovable Cloud + edge function `supabase/functions/islamic-qa/index.ts`
- Streams via SSE (per AI gateway pattern shown in docs)
- Model: `google/gemini-3-flash-preview` (default)
- System prompt (server-side, Bengali) instructs model to:
  - Answer in Bengali only
  - Cite Quran (surah:ayah) and Hadith (collection + number) when possible
  - State the four-madhhab consensus where relevant; mention differences
  - Refuse to issue binding fatwas — recommend a qualified scholar for personal matters
  - Add the disclaimer at the end of every answer
- Validates input (zod): max 2000 chars, non-empty
- Handles 429 (rate limit) and 402 (credits) with friendly Bengali messages

**Frontend** (`/ask`):
- Conversation UI (token-by-token streaming)
- Suggested prompts (e.g., "নামাজে রুকুর দোয়া কী?", "যাকাতের নিসাব কত?")
- Persistent chat history in localStorage (per session)
- Markdown rendering (`react-markdown`) for answer formatting
- Persistent disclaimer banner: *"এই উত্তর AI দ্বারা generated — fiqh-সংক্রান্ত ব্যক্তিগত মাসআলায় অনুগ্রহ করে যোগ্য আলেমের পরামর্শ নিন।"*
- Copy / share answer; report problem button

**Files**:
- `src/pages/AskPage.tsx`
- `src/components/ask/ChatBubble.tsx`, `SuggestedPrompts.tsx`, `Disclaimer.tsx`
- `supabase/functions/islamic-qa/index.ts`
- Adds `react-markdown` dependency

## Integration & Navigation Changes

**`src/App.tsx`** — add 5 routes: `/hadith`, `/hadith/:collection`, `/hadith/:collection/:chapter`, `/qaza`, `/notifications`, `/ask`.

**`src/pages/Index.tsx`** — add 4 new tiles to "More Features": Hadith, Qaza Tracker, Notifications, Ask AI. Move Daily Dua toggle into `/notifications` page link.

**`src/components/BottomNav.tsx`** — replace less-used "Tasbih" slot with a "More" menu OR keep nav and surface new items only on Home (recommended; nav stays at 5 items: Home / Quran / Qibla / Prayer / **Ask AI**). Tasbih remains accessible via Home tile.

**Lovable Cloud**: enabled for the Q&A edge function (no DB tables needed in phase 1; everything else stays in localStorage).

## Phasing (delivery order in implementation)

1. Enable Lovable Cloud + AI Q&A edge function + `/ask` page (proves Cloud + AI integration)
2. Tafsir accordion in TranslationView (smallest surface, biggest immediate value)
3. Qaza Tracker (`/qaza`) — fully client-side
4. Notifications page + scheduler (uses existing `usePrayerTimes`)
5. Hadith Library (largest scope; data integration last)
6. BottomNav + Index tile updates
7. QA: verify all 5 routes render, test AI streaming, test notification permission flow on iOS Safari + Chrome

## Technical Notes

- All new colors via existing semantic tokens (`primary`, `accent`, `card`, etc.) — no hardcoded hex.
- All UI strings wrapped in `t(bn, en, ar)`.
- All API calls via react-query for caching.
- AI edge function: server-side prompt only, never exposed to client.
- Notification permission requested on user gesture (toggle), never on page load.
- Hadith API fetched client-side (free, no key); rate-limit aware with `staleTime: 1h`.
- All artifacts client-side; no DB schema changes needed for phase 1.
- Tafsir HTML stripped via small regex util; preserves Bengali Unicode.
- Total est. new files: ~25; modified: 4 (App.tsx, Index.tsx, BottomNav.tsx, TranslationView.tsx).

কোনো ফিচার বাদ দিতে চাইলে বা priority বদলাতে চাইলে বলুন — অন্যথায় approve করলে এই ক্রমে implement করা শুরু করবো।
