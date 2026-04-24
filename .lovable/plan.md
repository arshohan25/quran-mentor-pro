## Premium Home Redesign

A cohesive, editorial-feeling home built entirely from existing semantic tokens (emerald `--primary` + gold `--accent` + parchment `--background`). Every feature in the app is surfaced from the home in a clean bento layout, organized by intent.

### What changes

**Removed clutter**: the duplicated "Quick Actions" grid + "Quick Access Pills" row + ad-hoc "New Features" / "More Features" sections collapse into a single, organized bento.

**New hero band** (replaces the current header chrome):
- Deep emerald gradient with a faint Bismillah watermark and a soft gold radial glow (already supported by `.islamic-header`).
- Two compact info chips inline: **Hijri date** (today) and **Next prayer + countdown** (uses existing prayer-times data; falls back gracefully if location is missing → links to `/prayer-times`).
- Right side: `AuthChip` + `LanguageSwitcher` (unchanged).

**"Continue" hero card** (only when there's a last-read ayah):
- Full-width premium card with the Arabic ayah preview if available, surah name, and a strong "Resume" CTA. Pulses gently on first load.

**Today strip** (always visible, 3 small stat chips):
- **Streak** (from `getStreakStats`) · **Hifz mastered** (from existing local count) · **Bookmarks** count.
- Each chip is a tiny tappable card linking to the relevant page.

**Daily Ayah** + **Daily Dua** kept as twin premium cards, side by side on tablet, stacked on mobile. Existing `<DailyAyah />` and the inline dua block are reused as-is.

**Bento sections** (ordered by daily use):

1. **কুরআন · Quran**
   - Read Quran (large 2-col tile) · Audio · Hifz · Bookmarks · Practice · Tafsir Compare (`/tafsir/1/1` quick start) · Recitation Stats · Planner
2. **নামাজ · Prayer**
   - Prayer Times · Qibla · Prayer Guide · Qaza Tracker
3. **যিকর ও দোয়া · Dhikr & Dua**
   - Tasbih · Duas & Azkar · Daily Amal · Hijri Calendar
4. **শিখুন ও জিজ্ঞাসা · Learn & Ask**
   - Hadith Library · Hadith Practice · Ask AI · Notifications

Each tile uses a **uniform aesthetic card** with:
- Rounded-2xl, subtle gold border (matches `.premium-card`)
- Icon in a softly-tinted square (emerald or gold variant, alternating per tile for rhythm)
- Bold title (Bengali display), small muted subtitle
- A whisper of inner gradient via existing tokens (no new colors)
- Motion: 250ms ease entrance with stagger; 1.02 hover lift, 0.98 active

A **"NEW" pill** marks recently-added features (Tafsir Compare, Recitation Stats, Hifz Review).

A subtle **decorative gold divider** with `✦` between sections (already exists).

### Files

- **Edit** `src/pages/Index.tsx` — full rewrite of the home layout (keeps `<DailyAyah />`, `<ReadingProgress />`, `<AuthChip />`, `<LanguageSwitcher />`, daily-dua block).
- **Edit** `src/index.css` — add three small token-based utility classes:
  - `.bento-tile` — base premium tile, alternating accent rail
  - `.bento-tile-wide` — 2-col span variant
  - `.section-eyebrow` — small "category label + line" header style used between bento sections
- **No new files**, no DB changes, no dependencies.

### Technical details

- Hero "Next prayer" uses the existing prayer-times hook (`usePrayerTimes` if present in repo — will inspect; otherwise reads from cached localStorage and degrades to a neutral "Set your location" link). I'll wire it conditionally so the home never shows a broken state.
- Hijri date computed client-side via `Intl.DateTimeFormat('en-u-ca-islamic-umalqura', …)` (no API).
- Streak / Hifz counts read via existing helpers; falls back to 0 if storage is empty.
- Layout: 4-col grid on `md+`, 2-col on mobile. Wide tiles use `col-span-2`. Cards keep equal heights via `min-h` + flex.
- No framer-motion for entrance to keep bundle lean — uses Tailwind `animate-in fade-in-0 slide-in-from-bottom-2` with delay utilities.
- All colors via HSL tokens (`hsl(var(--primary))` etc.). No custom hex.

### Acceptance check

- Home shows: hero with hijri + next-prayer chips, optional "Resume" card, today strip, daily ayah, daily dua, then 4 categorized bento sections covering every feature already routed in `App.tsx`.
- Looks consistent in light + dark mode.
- No regressions: language switcher, auth chip, daily-dua notification toggle, last-read deep link still work.
- Mobile (390px) and tablet both look clean — tiles align to a uniform grid with breathing room.
