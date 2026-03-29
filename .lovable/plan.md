

# কুরআন পেজে Word-by-Word অনুবাদ মোড

## পদ্ধতি

**Quran.com API (v4)** ব্যবহার করব — এটি word-by-word translation সাপোর্ট করে।

**API:** `https://api.quran.com/api/v4/verses/by_chapter/{surah}?words=true&language=bn&per_page=50&page={page}`

প্রতিটি আয়াতের `words[]` অ্যারেতে থাকবে:
- `text_uthmani` — আরবি শব্দ
- `translation.text` — বাংলা/ইংরেজি অনুবাদ

## ফাইল পরিবর্তন

### ১. `src/hooks/useQuranApi.ts` — নতুন hook যোগ
- `useWordByWord(surahNumber, language)` — Quran.com v4 API কল করবে `words=true` দিয়ে
- Pagination হ্যান্ডেল করবে (per_page=50, multiple pages for long surahs)
- ক্যাশ 1 ঘণ্টা

### ২. `src/pages/QuranPage.tsx` — মোড সুইচার + UI
- নতুন state: `viewMode: "verse" | "word"` (localStorage-এ সেভ)
- হেডারে ToggleGroup দিয়ে মোড সুইচ বাটন (AlignLeft icon = verse, Grid icon = word)
- **Verse মোড**: বর্তমান UI যেমন আছে
- **Word মোড**: প্রতিটি আয়াতের ভেতর শব্দগুলো flex-wrap grid-এ দেখাবে — উপরে আরবি, নিচে বাংলা/ইংরেজি

### ৩. Word-by-Word UI লেআউট

```text
┌─────────────────────────────────┐
│  ১  │  بِسْمِ    اللَّهِ    الرَّحْمَٰنِ  │
│     │  নামে      আল্লাহর    পরম দয়ালু  │
│     │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│
│     │  الرَّحِيمِ                       │
│     │  পরম করুণাময়                   │
└─────────────────────────────────┘
```

প্রতিটি শব্দ একটি ছোট কার্ড — আরবি বড় ফন্ট, নিচে ছোট ফন্টে অনুবাদ। শব্দগুলো RTL flex-wrap দিয়ে সাজানো হবে।

## সারসংক্ষেপ

| ফাইল | পরিবর্তন |
|---|---|
| `src/hooks/useQuranApi.ts` | `useWordByWord` hook যোগ (Quran.com v4 API) |
| `src/pages/QuranPage.tsx` | verse/word মোড toggle + word-by-word রেন্ডারিং UI |

