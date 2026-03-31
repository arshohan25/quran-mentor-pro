

# প্রিমিয়াম ইসলামিক UI/UX রিডিজাইন

## ডিজাইন ভিশন

সব পেজে একটি **unified premium Islamic aesthetic** — warm parchment tones, elegant gold accents, subtle geometric patterns, glass-morphism cards, smooth micro-interactions। QuranPage-এর বর্তমান Islamic styling (gold/green/parchment) কে পুরো অ্যাপে extend করা হবে।

## রঙ ও থিম আপডেট

### Light Mode
- Background: warm parchment `#F8F3E8` → `#FFFDF7`
- Cards: `#FFFDF7` with subtle gold border `#C4A96A/20`
- Primary: deep Islamic green `#1B5E20` (darker, richer)
- Accent: warm gold `#C4A96A`
- Text: dark warm brown `#3E2C1A`

### Dark Mode
- Background: deep `#0F0D09`
- Cards: `#1A1610` with gold border `#C4A96A/15`
- Primary: muted green `#4CAF50`
- Accent: muted gold `#B8976A`

## পরিবর্তন তালিকা

### ফাইল ১: `src/index.css`
- CSS variables আপডেট — নতুন warm Islamic palette
- Add subtle background pattern utility class
- Add `glass-card` utility — `backdrop-blur-sm bg-white/80 dark:bg-black/40`
- Add smooth transition utilities

### ফাইল ২: `src/pages/Index.tsx` — হোম পেজ রিডিজাইন
- Header: gradient `bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#1B5E20]` with subtle pattern overlay
- Navigation cards: glass-morphism style, gold corner ornaments (QuranPage pattern), hover glow effect
- Each card gets an Islamic-styled icon container with geometric border
- DailyAyah: elegant framed look with decorative dividers
- Continue Reading banner: premium card with gold accent line
- Footer bismillah: larger, elegant with decorative ornamental dividers (`✦` pattern from QuranPage)
- Add a crescent/star decorative element in header

### ফাইল ৩: `src/components/DailyAyah.tsx`
- Premium card: gold border, decorative corners, inner shadow
- Arabic text: larger font, ornamental frame
- Source reference: styled badge

### ফাইল ৪: `src/pages/PrayerTimesPage.tsx`
- Header: Islamic gradient (same as Index)
- Next prayer card: gold-accented, prominent, with mosque silhouette or crescent decoration
- Prayer time rows: elegant cards with gold left border for active prayer
- Alarm toggle: styled icon buttons with gold active state

### ফাইল ৫: `src/pages/AudioPage.tsx`
- Header: Islamic gradient
- Player section: premium card with inner glow, gold play button ring
- Ayah list items: subtle gold left border on active, refined spacing

### ফাইল ৬: `src/pages/PracticePage.tsx`
- Header: Islamic gradient
- Mic button: gold ring border, elegant pulse animation
- Result cards: glass-morphism with color-coded accents

### ফাইল ৭: `src/pages/PrayerPage.tsx`
- Header: Islamic gradient
- Tabs: gold underline active state instead of filled background
- Accordion items: elegant bordered cards with gold accent
- Arabic text blocks: parchment background with decorative frame

### ফাইল ৮: `src/pages/HifzDashboardPage.tsx`
- Header: Islamic gradient
- Stats cards: glass-morphism, gold numbers
- Progress bars: gold/green gradient fills
- Surah list items: refined cards with number badges

### ফাইল ৯: `src/pages/BookmarksPage.tsx`
- Header: Islamic gradient
- Empty state: elegant illustration with gold accents
- Bookmark cards: premium styled with gold details

### ফাইল ১০: `src/components/LanguageSwitcher.tsx`
- Refined pill buttons with better contrast
- Gold active indicator

## শেয়ার্ড প্যাটার্ন

সব পেজের header একই Islamic gradient ব্যবহার করবে:
```
bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#1B5E20]
dark:from-[#0D2B10] dark:via-[#1A3D1E] dark:to-[#0D2B10]
```

সব cards:
```
bg-[#FFFDF7] dark:bg-[#1A1610] border border-[#C4A96A]/20
rounded-xl shadow-[0_2px_12px_rgba(196,169,106,0.08)]
```

Corner ornaments (QuranPage থেকে) সব major card-এ:
```
<span className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#C4A96A]/25 rounded-tr-lg" />
```

Decorative dividers:
```
<div className="flex items-center justify-center gap-3">
  <div className="h-px w-12 bg-gradient-to-r from-transparent to-[#C4A96A]/40" />
  <span className="text-[#C4A96A]/40 text-sm">✦</span>
  <div className="h-px w-12 bg-gradient-to-l from-transparent to-[#C4A96A]/40" />
</div>
```

## টেকনিক্যাল ডিটেইল

- CSS custom properties আপডেট করে warm Islamic palette সেট করা
- Hardcoded colors ব্যবহার (`#1B5E20`, `#C4A96A`, `#FFFDF7`) যাতে precise control থাকে
- Dark mode তে সব color-এর muted variant
- No new dependencies — শুধু Tailwind classes ও inline SVG decorations
- ~১০টি ফাইল পরিবর্তন

