

## Advanced features to elevate competitive edge

You're already ahead of most Bengali Islamic apps on AI Q&A, Hadith Practice, Hifz, and offline PWA. The gaps below are where leaders (Tarteel, Quran.com, Muslim Pro, DeenHub) win — and where your Bengali-first positioning lets you leapfrog.

### Tier 1 — High impact, builds on what you have

**1. AI Recitation Coach (Tarteel-style mistake detection)**
You already have `useArabicRecitationEngine` and `LiveRecitationCheck`. Upgrade it into a real coach:
- Word-level highlight: green = correct, amber = hesitation, red = mistake, with the misread word shown vs. expected.
- Tajweed mistake categories (madd length, ghunnah, qalqalah) using rule tags from `utils/tajweed.ts`.
- "Recite from memory" mode: hide the text, reveal only the next word on stumble (Sabina-style but for any ayah).
- Daily accuracy score + per-surah weak-spot heatmap.

**2. Smart Hifz Plan with spaced repetition (SRS)**
Hifz dashboard exists but is passive. Add:
- SM-2 / Anki-style scheduler: every memorized ayah gets reviewed at expanding intervals (1d → 3d → 7d → 21d).
- "Today's review" queue on home that adapts when you miss days.
- Murajah (revision) streak separate from new-memorization streak.
- Weak-ayah drill: ayahs with the most recitation mistakes auto-queue for review.

**3. Tafsir-on-tap with multi-source comparison**
You have `useTafsir` and `TafsirAccordion`. Extend to:
- Tap any word → Bengali word meaning + root + occurrences across Quran (concordance).
- Side-by-side tafsir: Ibn Kathir, Ma'ariful Quran, Tafhimul Quran, Fi Zilal — toggleable.
- "Ask AI about this ayah" button piping context (ayah + selected tafsir) into your existing `/ask` edge function for grounded answers.

### Tier 2 — Community & social (huge engagement lift, low complexity)

**4. Family / Halaqa group**
- Create a small group (5–20 people), share Hifz progress, daily Amal completion, Quran reading streak.
- Leaderboard reset weekly; private by default.
- "Nudge" a member: sends a dua reminder push, not a guilt trip.

**5. Khatm (Quran completion) circles**
- 30 people commit to read 1 juz/day → finish a Khatm together in 30 days.
- Auto-assigns juz, tracks completion, sends gentle reminders.
- Great virality: people invite friends/family.

### Tier 3 — Differentiators no Bengali app has

**6. Dars / Khutbah library with AI summaries**
- Curated Bengali scholar lectures (audio/YouTube embeds) tagged by topic, surah, hadith.
- AI-generated 60-second Bengali summary + key timestamps using Lovable AI (Gemini Flash).
- "Continue listening" like Spotify.

**7. Halal lifestyle utilities**
- Mosque finder with prayer times per mosque (community-submitted).
- Halal restaurant tags (start with Dhaka, Chittagong, Sylhet, then expand).
- Hijri-aware Islamic event reminders (Laylatul Qadr odd nights, Ayyamul Beed, fasting Mondays/Thursdays) — partially in Hijri page; surface as actionable reminders.

**8. Janazah & inheritance calculator**
- Mirath (Islamic inheritance) calculator — extremely high search demand, almost no Bengali app does it well.
- Janazah salah step-by-step guide.

**9. Voice-first Bengali UX**
- "Hey, what does Surah Mulk verse 14 say?" → reads ayah + Bengali translation.
- Voice search across Quran, Hadith, Dua.
- Uses browser SpeechRecognition; falls back to typed search.

### Tier 4 — Monetization & retention infrastructure

**10. Accounts + cross-device sync**
Currently bookmarks, Hifz progress, Qaza, last-session all live in localStorage. Add Lovable Cloud auth so users don't lose data when switching phones. Foundation for groups (#4, #5) and premium tier.

**11. Premium tier** (optional, only if you want revenue)
- Free: everything you have today + Tier 1 basics.
- Premium: advanced AI coach analytics, family groups >5 members, ad-free Dars library, offline audio downloads of full Quran reciters.

### Suggested build order

```text
Phase 1 (1–2 weeks each):
  → Spaced-repetition Hifz (#2)
  → Recitation Coach v2 with word-level scoring (#1)
  → Tafsir comparison + word concordance (#3)

Phase 2:
  → Auth + cloud sync (#10)
  → Family/Halaqa groups (#4)
  → Khatm circles (#5)

Phase 3:
  → Mirath calculator + Janazah guide (#8)
  → Dars library with AI summaries (#6)
  → Mosque finder (#7)
  → Voice-first search (#9)
```

### Why this wins

- **Tarteel** owns recitation coaching but is English-first and paid — #1 + #2 in Bengali is wide-open.
- **Quran.com** owns tafsir depth but no practice/hifz loop — your existing Practice + #3 closes that gap.
- **Muslim Pro** owns lifestyle but is shallow on learning — #4–#9 layer lifestyle on top of your already-strong learning core.
- **No major Bengali app** currently combines AI Q&A + Hadith Practice + spaced-repetition Hifz + Halaqa groups. That's a defensible position.

### Pick what to build next

Tell me which feature (or phase) to plan in detail and I'll produce a build-ready implementation plan with files, data shapes, and edge functions.

