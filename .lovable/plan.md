

# ১৫ লাইন প্রতি পৃষ্ঠা — আয়াত নয়, লাইন ভিত্তিক পেজিনেশন

## সমস্যা

বর্তমানে `LINES_PER_PAGE = 15` মানে **১৫টি আয়াত** প্রতি পৃষ্ঠায় রাখা হচ্ছে। কিন্তু আসল মুসহাফে প্রতি পৃষ্ঠায় **১৫টি লাইন** থাকে — একটি আয়াত ২-৩ লাইন নিতে পারে, আবার একটি ছোট আয়াত এক লাইনেরও কম হতে পারে। তাই আয়াত সংখ্যা দিয়ে পেজিনেশন করলে মুসহাফ লুক আসে না।

## সমাধান

প্রতিটি আয়াতের আনুমানিক লাইন সংখ্যা হিসাব করে (character count ÷ chars-per-line) পেজ ভাগ করা হবে যাতে প্রতি পৃষ্ঠায় ~১৫ লাইনের কাছাকাছি টেক্সট থাকে।

## পরিবর্তন

### `src/components/quran/ReadingView.tsx`

**পেজিনেশন লজিক পরিবর্তন** — `pages` useMemo-তে:

```
// বর্তমান (ভুল): প্রতি ১৫ আয়াত = ১ পৃষ্ঠা
for (let i = 0; i < ayahs.length; i += LINES_PER_PAGE) {
  result.push(ayahs.slice(i, i + LINES_PER_PAGE));
}

// নতুন (সঠিক): আয়াতের টেক্সট দৈর্ঘ্য অনুযায়ী ১৫ লাইন = ১ পৃষ্ঠা
const CHARS_PER_LINE = 45; // আরবি ক্যারেক্টার প্রতি লাইনে (মোবাইল ভিউপোর্টে)
let currentPageAyahs = [];
let currentLineCount = 0;

for (const ayah of ayahs) {
  const ayahLines = Math.max(1, Math.ceil(ayah.text.length / CHARS_PER_LINE));
  if (currentLineCount + ayahLines > 15 && currentPageAyahs.length > 0) {
    result.push(currentPageAyahs);
    currentPageAyahs = [ayah];
    currentLineCount = ayahLines;
  } else {
    currentPageAyahs.push(ayah);
    currentLineCount += ayahLines;
  }
}
if (currentPageAyahs.length) result.push(currentPageAyahs);
```

এতে প্রতি পৃষ্ঠায় টেক্সটের পরিমাণ প্রায় সমান থাকবে এবং মুসহাফের মতো ১৫ লাইনের পৃষ্ঠা দেখাবে।

### `src/components/quran/types.ts`
- `LINES_PER_PAGE` এর পাশাপাশি `CHARS_PER_LINE = 45` কনস্ট্যান্ট export করা

অন্য কোনো ফাইলে পরিবর্তন লাগবে না।

