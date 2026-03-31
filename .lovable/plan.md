# রিডিং ভিউ — PDF ডকুমেন্টের সাথে সঠিক ম্যাচ

## বর্তমান সমস্যা (স্ক্রিনশট vs PDF তুলনা)


| সমস্যা            | বর্তমান অ্যাপ                | PDF ডকুমেন্ট                     |
| ----------------- | ---------------------------- | -------------------------------- |
| বিসমিল্লাহ        | দুইবার দেখাচ্ছে              | একবার, কেন্দ্রে                  |
| টেক্সট লাইন       | লাইনের মধ্যে কোনো বিভাজক নেই | প্রতিটি লাইনের নিচে সূক্ষ্ম রেখা |
| কর্নার অর্নামেন্ট | ছোট `❧` Unicode              | বড় curved scrollwork কর্নার পিস |
| ব্যাকগ্রাউন্ড     | ক্রিম (`#FFFDF7`) — ঠিক আছে  | সাদা/ক্রিম — ঠিক                 |
| পেজ হেডার         | ঠিক আছে তবে ফন্ট ছোট         | বড় ও বোল্ড হেডার                |
| সাইড মার্কার      | নেই                          | বাম পাশে `ع` (রুকু), জুয নম্বর   |
| টেক্সট justify    | আংশিক                        | প্রতিটি লাইন পুরো প্রস্থ জুড়ে   |
| প্রতি পেজে লােইন  | আংশিক                        | সুন্দরভাবে গোছানো ১৫ লাইন        |


## পরিবর্তন পরিকল্পনা

### ফাইল: `src/components/quran/ReadingView.tsx`

**১. বিসমিল্লাহ ডুপ্লিকেট চূড়ান্ত ফিক্স**

- `stripBismillah` ফাংশন কাজ করছে না — API টেক্সটে সম্ভবত ভিন্ন encoding
- নতুন পদ্ধতি: `numberInSurah === 1` এবং `currentPage === 0` হলে, টেক্সটের প্রথম ৫০ ক্যারেক্টারে `بسم` থাকলে সেই অংশ বাদ দেওয়া
- আরো aggressive regex: `/بسم.{0,50}?(الرحيم|لرَّحِيمِ|لرحيم)/` — diacritics সহ/ছাড়া উভয়ই ধরবে

**২. প্রতিটি লাইনের মধ্যে সূক্ষ্ম horizontal rule**

- PDF-তে প্রতিটি টেক্সট লাইনের নিচে পাতলা রেখা আছে — এটা আসল মুসহাফের বৈশিষ্ট্য
- CSS দিয়ে: `background-image: repeating-linear-gradient(...)` ব্যবহার করে line-height অনুযায়ী পটভূমিতে ruled lines তৈরি
- এতে টেক্সট flowing থাকবে কিন্তু নিচে ruled lines দেখাবে (notebook paper এর মতো)

**৩. কর্নার অর্নামেন্ট আপগ্রেড**

- বর্তমান ছোট `❧` বাদ দিয়ে CSS-based scrollwork কর্নার
- প্রতিটি কর্নারে `width: 40px; height: 40px` box, `border` দিয়ে L-shape + `border-radius` দিয়ে কার্ল ইফেক্ট
- অথবা আরো বড় Unicode ornament `❦` সাইজ `text-[48px]` করে

**৪. সাইড মার্জিন রুকু মার্কার**

- PDF-তে ডান পাশে `ع` চিহ্ন (রুকু সমাপ্তি) দেখা যায়
- এটা এখন implement না করে পরবর্তীতে যোগ করা যাবে — প্রথমে মূল layout ঠিক করা জরুরি

**৫. হেডার ফন্ট সাইজ বাড়ানো**

- বর্তমান `text-[11px]` → `text-[13px]` হেডারে
- পেজ নম্বর `text-[12px]` → `text-[14px]`

**৫. প্রতি পেজে লাইন ঠিক রাখা**

- প্রতি লাইনে সুন্দরভাবে গুছিয়ে ১৫ লাইন থাকবে ডকুমেন্ট অনুযায়ী, প্রয়োজনে প্রতিটা পেজ ডকুমেন্ট থেকে কপি করে বসাও

### টেকনিক্যাল ডিটেইল

**Ruled lines (CSS background approach):**

```css
/* line-height ~2.8em, font-size 28px → each line ≈ 78px */
background-image: repeating-linear-gradient(
  to bottom,
  transparent 0px,
  transparent 76px,
  rgba(139,115,85,0.15) 76px,
  rgba(139,115,85,0.15) 78px
);
```

এটা `<p>` element-এ inline style হিসেবে যোগ করা হবে, যাতে প্রতিটি লাইনের ঠিক নিচে পাতলা রেখা দেখায়।

**Bismillah aggressive strip:**

```typescript
function stripBismillah(text: string): string {
  // Try multiple patterns for different diacritic forms
  let result = text.replace(/بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ/, '').trim();
  if (result !== text.trim() && result.length > 0) return result;
  // Broader: any text starting with بسم up to الرحيم
  result = text.replace(/^بِ?سْ?مِ?\s*.{0,50}?لرَّ?حِ?يمِ?\s*/, '').trim();
  if (result.length > 0 && result !== text.trim()) return result;
  // Last resort: find لرحيم and cut everything before it
  if (text.startsWith('بِسْ') || text.startsWith('بسم')) {
    const idx = text.indexOf('لرحيم');
    if (idx > 0 && idx < 60) {
      return text.substring(idx + 5).trim() || text;
    }
  }
  return text;
}
```

**Corner ornament CSS:**

```html
<!-- Each corner: absolute positioned decorative L-shape -->
<span class="absolute -top-2 -right-2 w-10 h-10 border-t-[3px] border-r-[3px] 
  border-[#8B7355] rounded-tr-xl" />
```

চার কোণায় ৪টি ভিন্ন দিকে rotated L-shape border — PDF-এর curved scrollwork-এর কাছাকাছি।

### ফাইল পরিবর্তন

- প্রতি লাইনে সুন্দরভাবে গুছিয়ে ১৫ লাইন থাকবে ডকুমেন্ট অনুযায়ী, প্রয়োজনে প্রতিটা পেজ ডকুমেন্ট থেকে কপি করে বসাও

শুধু ১টি ফাইল: `src/components/quran/ReadingView.tsx`