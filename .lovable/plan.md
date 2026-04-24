
# Research: Making This Quran App a True All-in-One Islamic Companion

I explored the codebase to understand what's already built, then researched what's missing compared to leading Islamic apps (Muslim Pro, Quran.com, Tarteel, Athan Pro, Pillars).

## What's Already Strong

The app already covers a solid foundation:
- **Quran**: Mushaf reading, translation (Bn/En/Ar), audio recitation, word-by-word, Hifz mode, bookmarks, topic browser, Juz browser, Sabina view, live recitation check
- **Prayer**: Prayer times, prayer guide page, Qibla finder
- **Devotional**: Tasbih counter, Dua collection, Daily Amal tracker with stats & reminders, Daily Ayah
- **Calendar**: Hijri calendar
- **Planning**: Quran reading planner, reading targets, streak tracker
- **i18n**: Bengali / English / Arabic switching, light/dark theme

## Gap Analysis — What's Missing

### Tier 1: High-Impact Core Features (most-requested in Islamic apps)

1. **Hadith Library** — Sahih Bukhari, Muslim, Tirmidhi, Abu Dawud, Nasa'i, Ibn Majah with Bengali translation, search, daily hadith widget. Currently zero hadith content.
2. **Tafsir Integration** — Add Ibn Kathir / Ma'ariful Quran / Tafheem to TranslationView. Users read translation but lack scholarly explanation.
3. **Asma-ul-Husna (99 Names of Allah)** — With meaning, benefits, audio, and a memorization mode similar to Hifz.
4. **Zakat Calculator** — Gold, silver, cash, business assets, Nisab tracking with current rates.
5. **Inheritance (Faraid) Calculator** — Highly requested, almost no Bengali apps do this well.

### Tier 2: Spiritual & Habit Features

6. **Ramadan Hub** — Sehri/Iftar countdown, Tarawih tracker, daily Ramadan amal, Laylatul Qadr tracker, fasting log (incl. Nafl fasts: Mon/Thu, Ayyamul Bid).
7. **Qaza Prayer Tracker** — Log and track missed prayers (a feature uniquely needed but rarely built well).
8. **Sadaqah / Charity Log** — Track donations with intention reminders.
9. **Islamic Goals & Habits** — Custom spiritual goals (e.g., "Read 1 juz/week", "100 salawat daily") with progress.
10. **Daily Adhkar (Morning/Evening)** — Hisnul Muslim style structured Azkar with counter and audio.

### Tier 3: Social, Learning & AI

11. **AI Islamic Q&A** — Powered by Lovable AI Gateway. Answer fiqh questions sourced from authentic refs (with disclaimer). Bengali-first.
12. **Learn Arabic / Tajweed Course** — Structured lessons, alphabet, harakat, basic tajweed rules with the existing TajweedText component.
13. **Khatm Tracker (Group/Solo)** — Distribute juz among family/friends to complete a Khatm together.
14. **Mosque/Masjid Finder** — Map + nearest mosques using geolocation.
15. **Islamic Knowledge Quiz** — Gamified daily quiz on Quran, Seerah, Fiqh.

### Tier 4: Content & Lifestyle

16. **Seerah / Prophet's Biography** — Chaptered timeline of the life of Prophet ﷺ.
17. **Stories of the Prophets (Qasas-ul-Anbiya)** — Bengali narrated stories with audio.
18. **Halal Food / Finance Tracker** — Log halal restaurants, halal income tracking.
19. **Wallpapers & Lock Screen Reminders** — Daily ayah/dua wallpapers.
20. **Family Mode** — Parents can monitor children's hifz/prayer progress.

### Tier 5: UX & Technical Polish

21. **Offline Mode** — Cache Quran, audio, translations for offline use (PWA + IndexedDB).
22. **Auth & Cloud Sync** — Lovable Cloud auth so bookmarks, hifz progress, streaks sync across devices.
23. **Notifications** — Adhan push notifications, daily ayah, dua reminders, Jumu'ah reminder.
24. **Widgets / Home Screen** — Prayer time widget, daily ayah widget.
25. **Search Across Quran** — Global search by keyword (Arabic/Bn/En) across all surahs.
26. **Audio Improvements** — Background audio, lock-screen controls, sleep timer, multiple Qaris with Bengali translation recitation.
27. **Reading Streak Leaderboard** (optional, with auth) — Friends-only streak comparison.

## Recommended Build Order (Phased)

**Phase 1 — Content depth** (biggest immediate value, low complexity):
- Hadith Library
- Tafsir on Translation view
- Asma-ul-Husna
- Daily Morning/Evening Adhkar
- Global Quran search

**Phase 2 — Habit & life tools**:
- Qaza Prayer Tracker
- Ramadan Hub
- Zakat Calculator
- Adhan push notifications
- Offline mode (PWA)

**Phase 3 — Cloud & intelligence**:
- Lovable Cloud auth + cross-device sync
- AI Islamic Q&A (Bengali)
- Khatm group tracker
- Tajweed/Arabic learning course

**Phase 4 — Lifestyle & community**:
- Seerah & Prophet stories
- Mosque finder
- Inheritance calculator
- Quiz & gamification

## Technical Notes

- New routes plug into the existing `AnimatedRoutes` in `src/App.tsx`.
- Bottom nav (`BottomNav.tsx`) may need a "More" menu since adding 5+ top-level sections.
- Hadith/Tafsir data: use sunnah.com API, quran.com tafsir endpoints, or bundle JSON.
- Auth/sync/notifications: Lovable Cloud (Supabase) — auth, `user_roles` table, edge functions for cron-based push.
- AI Q&A: Lovable AI Gateway, no API keys needed.
- Offline: convert to PWA with Workbox + IndexedDB cache for Quran JSON & audio.
- Existing patterns to reuse: `useQuranApi` query pattern, `PageTransition`, `LanguageSwitcher`, `Daily*` components as templates for Daily Hadith / Daily Adhkar.

## My Top 5 Picks If You Build Just One Thing First

1. **Hadith Library** (Bengali Sahih Sittah) — biggest content gap
2. **Tafsir inside Translation view** — deepens existing strength
3. **Qaza Prayer Tracker** — uniquely valuable, rarely done well
4. **Adhan Push Notifications + Offline Mode** — daily-driver retention
5. **AI Bengali Islamic Q&A** — modern differentiator no Bengali app has done well yet

কোন ফিচার বা phase দিয়ে শুরু করতে চান বলুন — আমি সেটার জন্য detailed implementation plan বানিয়ে দেবো।
