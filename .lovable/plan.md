

# সব পেজ রেসপন্সিভ করা

## বর্তমান সমস্যা (390px ভিউপোর্টে)

| পেজ | সমস্যা |
|-----|--------|
| **PrayerPage** | `grid-cols-5` TabsList 390px এ চাপা, টেক্সট কাটা যায়; `h-[calc(100vh-400px)]` fixed |
| **AudioPage** | `h-[calc(100vh-450px)]` ScrollArea ছোট স্ক্রিনে কম জায়গা; player controls tight |
| **HifzDashboardPage** | `h-[calc(100vh-380px)]` fixed; sort buttons cramped |
| **BookmarksPage** | `h-[calc(100vh-200px)]` fixed |
| **Index** | header `text-3xl` ও `text-[200px]` bismillah overflow হতে পারে |
| **QuranPage** | `grid-cols-3` with 5 items — last row has 2, looks uneven; padding tight |
| **PracticePage** | Generally ok, minor text sizing |
| **ReadingView** | `text-[26px] md:text-[30px]` — may overflow on very small screens |

## সমাধান পরিকল্পনা

### ফাইল ১: `src/pages/PrayerPage.tsx`
- TabsList: `grid-cols-5` → `grid-cols-3 sm:grid-cols-5` (মোবাইলে 3 কলাম, wrap)
- অথবা horizontal scroll: `flex overflow-x-auto` with `shrink-0` tabs
- ScrollArea: `h-[calc(100vh-400px)]` → `min-h-0 flex-1` with flex parent

### ফাইল ২: `src/pages/AudioPage.tsx`
- ScrollArea: `h-[calc(100vh-450px)]` → `h-[calc(100vh-380px)] min-h-[200px]`
- Player section padding: `p-6` → `p-4 md:p-6`

### ফাইল ৩: `src/pages/HifzDashboardPage.tsx`
- ScrollArea: `h-[calc(100vh-380px)]` → `h-[calc(100vh-300px)] min-h-[250px]`
- Header title: truncate on small screens
- Sort buttons: add responsive text

### ফাইল ৪: `src/pages/BookmarksPage.tsx`
- ScrollArea: `h-[calc(100vh-200px)]` → `h-[calc(100vh-180px)] min-h-[300px]`
- Card padding: minor adjustments

### ফাইল ৫: `src/pages/Index.tsx`
- Header: `text-3xl md:text-4xl` → `text-2xl sm:text-3xl md:text-4xl`
- Bismillah bg: `text-[200px]` → `text-[120px] sm:text-[200px]`
- Grid cards: `p-6` → `p-4 sm:p-6`; icon size responsive
- Bottom bismillah: `text-4xl` → `text-2xl sm:text-4xl`

### ফাইল ৬: `src/pages/QuranPage.tsx`
- Grid: `grid-cols-3` → `grid-cols-2 sm:grid-cols-3` (মোবাইলে 2 কলাম — 5 items better balanced as 2+2+1)
- Card padding: `p-4 md:p-6` → `p-3 sm:p-4 md:p-6`

### ফাইল ৭: `src/pages/PracticePage.tsx`
- Minor: mic button `w-20 h-20` → `w-16 h-16 sm:w-20 sm:h-20`

### ফাইল ৮: `src/pages/PrayerTimesPage.tsx`
- Already `max-w-lg`, mostly fine. Minor padding tweaks.

### ফাইল ৯: `src/components/quran/ReadingView.tsx`
- Font: ensure `text-[22px] sm:text-[26px] md:text-[30px]` for very small screens

## টেকনিক্যাল ডিটেইল

মূল প্যাটার্ন:
1. Fixed `h-[calc(...)]` → `min-h-[value]` সহ flexible height
2. `grid-cols-N` → smaller count on mobile with `sm:` breakpoint
3. Text/padding sizing: add `sm:` intermediate breakpoint
4. Overflow protection on flex containers

মোট ~৮টি ফাইল পরিবর্তন, সব ছোট CSS class adjustments।

