

# ডার্ক মোড + বুকমার্ক + নামাজের সময়সূচী

## ১. ডার্ক মোড

Dark theme CSS variables already exist in `index.css` (`.dark` class). Need to:

- **Create `ThemeProvider` context** (`src/contexts/ThemeContext.tsx`) — stores theme in localStorage, toggles `dark` class on `<html>`
- **Add dark mode toggle button** to `LanguageSwitcher` or header — Moon/Sun icon
- **Wrap App** with `ThemeProvider`

## ২. বুকমার্ক ফিচার (শেষ পড়া আয়াত মনে রাখা)

- **Create `useBookmark` hook** — saves last-read surah + ayah to localStorage
- **QuranPage**: Auto-save current surah/ayah on scroll/click; on load, restore last position
- **Index page**: Show "Continue reading" card at top if bookmark exists — click to jump to last ayah
- **AudioPage**: Also save last-listened position

Data structure in localStorage:
```json
{
  "lastRead": { "surah": 2, "ayah": 45 },
  "lastAudio": { "surah": 1, "ayah": 3, "qari": "ar.alafasy" }
}
```

## ৩. নামাজের সময়সূচী (লোকেশন অনুযায়ী)

- **Create `PrayerTimesPage`** — new route `/prayer-times`
- Use **Aladhan API** (`https://api.aladhan.com/v1/timingsByCity`) — free, no API key needed
- **Auto-detect location** via browser Geolocation API → reverse to city/country, or let user manually enter city
- Show **5 waqt times** (Fajr, Dhuhr, Asr, Maghrib, Isha) + Sunrise in a clean card layout
- Show **next prayer countdown** timer
- Add link from **Index page** (new 5th section card with Clock icon)
- **Add route** in `App.tsx`

## ফাইল পরিবর্তন

| ফাইল | পরিবর্তন |
|---|---|
| `src/contexts/ThemeContext.tsx` | নতুন — dark mode context + localStorage |
| `src/hooks/useBookmark.ts` | নতুন — localStorage bookmark hook |
| `src/hooks/usePrayerTimes.ts` | নতুন — Aladhan API hook |
| `src/pages/PrayerTimesPage.tsx` | নতুন — prayer times UI with countdown |
| `src/components/LanguageSwitcher.tsx` | Dark mode toggle বাটন যোগ |
| `src/pages/Index.tsx` | Bookmark "Continue" card + Prayer Times section card |
| `src/pages/QuranPage.tsx` | Auto-save bookmark on ayah view |
| `src/pages/AudioPage.tsx` | Auto-save last audio position |
| `src/App.tsx` | ThemeProvider wrap + `/prayer-times` route |

