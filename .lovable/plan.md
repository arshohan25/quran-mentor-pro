

# রিডিং ভিউ — রেফারেন্স ইমেজ অনুযায়ী লাইন-ভিত্তিক রিডিজাইন

## রেফারেন্স ইমেজ বিশ্লেষণ

ইমেজে দেখা যাচ্ছে:
1. **প্রতিটি লাইন আলাদা row** — প্রতি লাইনের নিচে একটি হালকা horizontal rule আছে
2. **সূরা হেডার একটি আলাদা decorated band** — সূরার নাম, আয়াত সংখ্যা, মাক্কিয়া/মাদানিয়া, রুকু — সব এক লাইনে, এটা ১৫ লাইনের মধ্যে গণ্য
3. **বিসমিল্লাহ একটি আলাদা লাইন** — এটাও ১৫ লাইনের মধ্যে গণ্য
4. **আয়াত টেক্সট justified** — প্রতিটি লাইন পুরো প্রস্থ জুড়ে, মাঝখানে aligned
5. **একটি পেজে একাধিক সূরা থাকতে পারে** (যেমন সূরা নাসর, লাহাব, ইখলাস একই পেজে)
6. **ডান মার্জিনে `ع` (রুকু)** এবং **বাম মার্জিনে পারা/মানজিল নম্বর**
7. **হেডার (ফ্রেমের বাইরে)**: ডানে সূরার নাম রেঞ্জ, মাঝে পেজ নম্বর, বামে জুয নম্বর ও নাম

## মূল আর্কিটেকচারাল পরিবর্তন

বর্তমান সিস্টেম **একটি সূরা লোড করে তার আয়াতগুলো পেজে ভাগ করে**। কিন্তু রেফারেন্সে একটি পেজে **একাধিক সূরা** থাকতে পারে — এটা বাস্তবায়ন করতে হলে সমস্ত কুরআনের ডাটা একসাথে লোড করা লাগবে যা API limitation-এর কারণে সম্ভব নয়।

তাই **একক সূরা ভিত্তিক** রেখেই প্রতি পেজে ১৫ লাইন এবং রেফারেন্সের ভিজ্যুয়াল স্টাইল ম্যাচ করা হবে। সূরা হেডার ও বিসমিল্লাহ লাইন কাউন্টে অন্তর্ভুক্ত হবে।

## পরিবর্তন পরিকল্পনা

### ফাইল: `src/components/quran/ReadingView.tsx`

**১. পেজিনেশন লজিক আপডেট — সূরা হেডার ও বিসমিল্লাহ লাইন কাউন্টে যোগ**
- প্রথম পেজে: সূরা হেডার = ১ লাইন, বিসমিল্লাহ = ১ লাইন → বাকি ১৩ লাইন আয়াতের জন্য
- পরবর্তী পেজে: পুরো ১৫ লাইন আয়াতের জন্য
- `CHARS_PER_LINE = 45` করে আরো accurate line estimation

**২. লাইন-ভিত্তিক রেন্ডারিং — প্রতিটি লাইন আলাদা row**
- বর্তমান flowing `<p>` বাদ দিয়ে **প্রতিটি আয়াত আলাদা block** হিসেবে render, প্রতিটির নিচে border-bottom
- আয়াত টেক্সট `text-justify` এবং `text-center` alignment (vertically centered per line)
- প্রতিটি লাইনের নিচে `border-b border-[#8B7355]/15` — সূক্ষ্ম horizontal rule

**৩. সূরা হেডার ব্যান্ড — রেফারেন্স স্টাইল**
- গাঢ় ব্যাকগ্রাউন্ড ব্যান্ড (`bg-[#2D5016]/10`) সহ decorated border
- একটি লাইনে: `آياتها ٥ | (١١١) سورة اللهب مكية | ركوعها ١`
- ব্যান্ডের বাম-ডানে ছোট floral ornament

**৪. বিসমিল্লাহ লাইন**
- পূর্ণ প্রস্থ জুড়ে কেন্দ্রে, নিচে ruled line
- `text-[20px]` সাইজ, `font-arabic`

**৫. কর্নার অর্নামেন্ট বড় করা**
- `w-12 h-12` (৪৮px) L-shape corners, `border-[3px]`, `rounded-3xl`
- রেফারেন্সে বেশ prominent scrollwork আছে

**৬. টেক্সট alignment = center (vertically per line)**
- `items-center` প্রতিটি line container-এ

### ফাইল: `src/components/quran/types.ts`
- `CHARS_PER_LINE = 45` (বড় করে আরো accurate estimation)

### টেকনিক্যাল ডিটেইল

**নতুন পেজিনেশন:**
```typescript
// First page: surah header (1 line) + bismillah (1 line) + 13 lines of ayahs
// Other pages: 15 lines of ayahs
const linesForAyahs = (pageIndex === 0 && selectedSurah !== 9) 
  ? LINES_PER_PAGE - 2  // header + bismillah 
  : LINES_PER_PAGE;
```

**লাইন-ভিত্তিক রেন্ডারিং:**
```tsx
// Each ayah as a block with bottom border
<div className="border-b border-[#8B7355]/15 py-[2px] flex items-center justify-center">
  <span className="font-arabic text-[20px] text-justify w-full">
    {ayahText} ﴿{number}﴾
  </span>
</div>
```

**সূরা হেডার ব্যান্ড:**
```tsx
<div className="border-b-2 border-[#8B7355]/30 bg-[#F5EFE0]/80 py-1.5 flex items-center justify-between px-3">
  <span>آياتها {count}</span>
  <span className="font-bold text-[16px]">({number}) سورة {name} {type}</span>
  <span>ركوعها {ruku}</span>
</div>
```

মোট ২টি ফাইল পরিবর্তন।

