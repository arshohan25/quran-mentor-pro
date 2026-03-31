

# রিডিং ভিউ — PDF ম্যাচ ফিক্স (চূড়ান্ত)

## বর্তমান সমস্যা (স্ক্রিনশট vs PDF তুলনা)

| সমস্যা | বর্তমান অ্যাপ | PDF ডকুমেন্ট |
|--------|---------------|---------------|
| বিসমিল্লাহ | **এখনও দুইবার** — হেডারে + প্রথম আয়াতে | একবার, কেন্দ্রে |
| ফন্ট সাইজ | ছোট (20-22px), ৮+ আয়াত দেখাচ্ছে | অনেক বড়, প্রথম পেজে ~৭-৮ লাইন |
| Ruled lines | কোনো দৃশ্যমান রেখা নেই | প্রতিটি লাইনের নিচে স্পষ্ট কালো রেখা |
| টেক্সট alignment | বামে ঝুকে আছে | পুরো প্রস্থ জুড়ে justified, মাঝখানে centered |
| প্রথম পেজ | সূরা হেডার ছোট | বড় সূরা তথ্য (৩ লাইন), তারপর বিসমিল্লাহ, তারপর ~৭ লাইন |
| সাধারণ পেজ | লাইন গোনা হয় না | ঠিক ১৫টি ruled line |

## সমাধান পরিকল্পনা

### ফাইল ১: `src/components/quran/ReadingView.tsx`

**১. বিসমিল্লাহ ডুপ্লিকেট — চূড়ান্ত ফিক্স**
- সমস্যা: `stripBismillah()` কাজ করছে না — স্ক্রিনশটে স্পষ্ট দেখা যাচ্ছে প্রথম আয়াতে "بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ الٓمٓ" পুরোটা আছে
- কারণ: `TajweedText` কম্পোনেন্ট হয়তো original `ayah.text` ব্যবহার করছে, `displayText` নয়
- ফিক্স: `stripBismillah` কে আরো সিম্পল করা — প্রথম আয়াতের টেক্সটে `الرحيم` খুঁজে তার পরের সব কিছু রাখা, বাকিটা বাদ। এবং নিশ্চিত করা যে `TajweedText`-এ `displayText` যাচ্ছে (বর্তমানে যাচ্ছে, তাই TajweedText কম্পোনেন্ট চেক করতে হবে)

**২. ফন্ট সাইজ বাড়ানো — PDF ম্যাচ**
- বর্তমান: `text-[20px] md:text-[22px]` → অনেক ছোট
- PDF-তে প্রথম পেজে ~৭-৮ লাইন, ফন্ট অনেক বড়
- নতুন: `text-[26px] md:text-[30px]` সাধারণ পেজে, `leading-[2.6] md:leading-[2.8]`
- প্রথম পেজে: সূরা হেডার (৩ লাইন: আয়াত সংখ্যা, সূরার নাম, রুকু) + বিসমিল্লাহ (১ লাইন) + ~৮ লাইন আয়াত

**৩. Ruled lines — স্পষ্ট horizontal rules**
- PDF-তে প্রতিটি লাইনের নিচে স্পষ্ট কালো রেখা আছে (হালকা নয়, দৃশ্যমান)
- বর্তমান `border-b border-[#8B7355]/12` অনেক হালকা → `border-b border-[#8B7355]/40` করা
- অথবা `background-image: repeating-linear-gradient(...)` দিয়ে ruled notebook effect

**৪. প্রথম পেজ লেআউট — PDF page 3 অনুযায়ী**
- সূরা তথ্য ৩ লাইনে (PDF-তে ৩ আলাদা লাইন):
  - লাইন ১: `آياتها ٢٨٦`
  - লাইন ২: `(٢) سورة البقرة مدنية (٨٤)`  
  - লাইন ৩: `ركوعاتها ٢٠`
- তারপর বিসমিল্লাহ (বড় সাইজে, কেন্দ্রে)
- তারপর ~৮ লাইন আয়াত

**৫. সাধারণ পেজ — PDF page 4-5 অনুযায়ী**
- ঠিক ১৫টি ruled line
- প্রতিটি লাইন পুরো প্রস্থ জুড়ে justified
- সাইড মার্জিনে `ع` (রুকু মার্কার)

**৬. পেজিনেশন আপডেট**
- প্রথম পেজ: সূরা হেডার (৩ লাইন) + বিসমিল্লাহ (১ লাইন) + ৮ লাইন আয়াত = ১২ লাইন (PDF অনুযায়ী কম)
- সাধারণ পেজ: ১৫ লাইন
- `CHARS_PER_LINE` কমানো (বড় ফন্টে কম ক্যারেক্টার ফিট হয়)

### ফাইল ২: `src/components/quran/types.ts`
- `CHARS_PER_LINE = 30` (বড় ফন্টে কম ক্যারেক্টার)

### ফাইল ৩: `src/components/TajweedText.tsx` (চেক করা)
- নিশ্চিত করা যে `text` prop সঠিকভাবে ব্যবহার হচ্ছে এবং internally re-fetch করছে না

### টেকনিক্যাল ডিটেইল

**Bismillah strip — simplified:**
```typescript
function stripBismillah(text: string): string {
  const t = text.trim();
  // Find any variant of الرحيم in first 80 chars
  const patterns = ['ٱلرَّحِيمِ', 'الرَّحِيمِ', 'الرحيم'];
  for (const p of patterns) {
    const idx = t.indexOf(p);
    if (idx >= 0 && idx < 80) {
      const after = t.substring(idx + p.length).trim();
      return after.length > 0 ? after : t; // return rest or original if nothing left
    }
  }
  return t;
}
```

**First page surah header (3-line):**
```tsx
<div className="text-center py-3 font-arabic text-[#5C4A2A]" dir="rtl">
  <div className="text-[14px]">آياتها {toArabicNum(count)}</div>
  <div className="text-[18px] font-bold">({toArabicNum(num)}) سورة {name} {type}</div>
  <div className="text-[14px]">ركوعاتها {toArabicNum(ruku)}</div>
</div>
```

**Ruled lines (visible):**
```tsx
<div className="border-b border-[#8B7355]/40 dark:border-[#C4A96A]/30 
  flex items-center min-h-[2.8em]">
```

মোট ২-৩টি ফাইল পরিবর্তন।

