

# রিডিং ভিউ — PDF ম্যাচ ফিক্স

## পরীক্ষায় পাওয়া সমস্যা ও সমাধান

### ফাইল: `src/components/quran/ReadingView.tsx`

**১. বিসমিল্লাহ ডুপ্লিকেট ফিক্স (সবচেয়ে গুরুত্বপূর্ণ)**
- লাইন 252 এ `replace()` কাজ করছে না কারণ API থেকে আসা টেক্সটে diacritics ভিন্ন হতে পারে
- সমাধান: regex-এ flexible matching — `بسم` দিয়ে শুরু হলে এবং `الرحيم` দিয়ে শেষ হলে সেই অংশটুকু strip করা, অথবা প্রথম আয়াত (`numberInSurah === 1`) হলে এবং `currentPage === 0` হলে প্রথম ~40 ক্যারেক্টার বাদ দেওয়া (যেটাতে বিসমিল্লাহ থাকে)
- আরো নিরাপদ পদ্ধতি: `ayah.text.replace(/^بِسْمِ.*?الرَّحِيمِ\s*/, '')` — broader regex

**২. রুকু সংখ্যা যোগ (PDF পেজ ৩ অনুযায়ী)**
- সূরা হেডারে (লাইন 224-230) `ركوعاتها` যোগ করা
- সূরা অনুযায়ী রুকু সংখ্যা ডাটা যোগ করতে হবে — একটি simple lookup object `surahRukuCount` তৈরি করে ReadingView-এ রাখা

**৩. কর্নার অর্নামেন্ট বড় ও সুন্দর করা**
- বর্তমান `❦` (22px) → CSS-based elaborate corner pieces
- প্রতিটি কর্নারে `::before`/`::after` দিয়ে curved floral motif — `border-radius` + gradient দিয়ে scrollwork effect
- অথবা বড় Unicode ornament `❧` / `☙` সাইজ `text-[36px]` করে আরো prominent

**৪. টেক্সট full-width justify উন্নতি**
- `textAlignLast: 'justify'` (center থেকে পরিবর্তন) — শেষ লাইন ছাড়া সব লাইন পূর্ণ প্রস্থে
- `word-spacing: 0.15em` বাড়ানো

**৫. সাইড মার্জিন মার্কার** (রুকু চিহ্ন)
- PDF-এ বাম পাশে `ع` (রুকু শেষ) চিহ্ন দেখা যায়
- আয়াত রেন্ডারের সময় রুকু-শেষ আয়াতগুলোতে বাম মার্জিনে `ع` চিহ্ন যোগ করা (absolute positioned)

### ফাইল: `src/components/quran/types.ts`
- কোনো পরিবর্তন নেই — `CHARS_PER_LINE = 30` ঠিক আছে

### টেকনিক্যাল ডিটেইল

**বিসমিল্লাহ regex fix:**
```typescript
// Broader regex to catch various diacritic forms
displayText = displayText.replace(/^بِسْمِ\s+ٱ?للَّهِ\s+ٱ?لرَّحْمَـ?ٰ?نِ\s+ٱ?لرَّحِيمِ\s*/, '').trim();
// Fallback: if text starts with بسم, strip first bismillah occurrence
if (!displayText || displayText === ayah.text) {
  displayText = ayah.text.replace(/^[^\u0660-\u0669]{0,60}الرحيم\s*/, '').trim() || ayah.text;
}
```

**Corner ornaments CSS approach:**
```css
/* Each corner: 30px box with curved border + gradient */
.corner-ornament {
  width: 30px; height: 30px;
  border: 3px solid #8B7355;
  border-radius: 0 0 100% 0; /* varies per corner */
}
```

মোট ১টি ফাইল পরিবর্তন: `ReadingView.tsx`

