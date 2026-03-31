

# রিডিং ভিউ — ক্রিটিকাল ফিক্স

## পরীক্ষায় পাওয়া সমস্যাগুলো

### ১. বিসমিল্লাহ এখনও ডুপ্লিকেট (সূরা ২ এ স্পষ্ট দেখা যাচ্ছে)
API থেকে সূরা ২ এর প্রথম আয়াত আসছে: `بِسْمِ ٱللَّهِ ٱلرَّحْمَـٰنِ ٱلرَّحِيمِ الٓمٓ`
`stripBismillah()` ফাংশন কাজ করছে কিন্তু `الٓمٓ` (আলিফ লাম মীম) রিটার্ন করছে — তবুও স্ক্রিনে পুরো বিসমিল্লাহ দেখাচ্ছে। সমস্যা হতে পারে Tajweed component এর মধ্যে — `TajweedText` কে `displayText` পাস হচ্ছে কিন্তু Tajweed কম্পোনেন্ট হয়তো original text ব্যবহার করছে।

### ২. ফন্ট অনেক বড়, ১৫ লাইন ফিট হচ্ছে না
বর্তমানে `text-[28px] md:text-[32px]` এবং `leading-[2.8]` — এতে প্রতি পেজে মাত্র ~৮ লাইন দেখাচ্ছে। PDF-এ ১৫ লাইন কম্প্যাক্টভাবে ফিট করা আছে।

### ৩. সূরা আল-ফাতিহায় (৭ আয়াত) পুরো সূরা এক পেজে হওয়া উচিত কিন্তু স্ক্রল করতে হচ্ছে

## সমাধান — `src/components/quran/ReadingView.tsx`

### ফিক্স ১: বিসমিল্লাহ স্ট্রিপিং ডিবাগ ও ফিক্স
- `stripBismillah` এ আরেকটি strategy যোগ: `ٱلرَّحِيمِ` এর পরে space + বাকি text — এটাই return
- গুরুত্বপূর্ণ: Tajweed enabled থাকলেও `displayText` (stripped version) পাস হচ্ছে কিনা নিশ্চিত করা
- `TajweedText` কম্পোনেন্ট চেক করে দেখা — `text` prop ঠিকমতো ব্যবহার হচ্ছে কিনা

### ফিক্স ২: ফন্ট সাইজ ও লাইন-হাইট কমানো — ১৫ লাইন ফিটের জন্য
- `text-[28px] md:text-[32px]` → `text-[20px] md:text-[22px]`
- `leading-[2.8] md:leading-[3]` → `leading-[2.2] md:leading-[2.4]`
- `word-spacing: 0.15em` → `0.08em`
- Ruled line gradient কে নতুন line-height অনুযায়ী adjust
- `CHARS_PER_LINE` কে `30` থেকে `40` এ বাড়ানো (ছোট ফন্টে বেশি ক্যারেক্টার ফিট হবে)

### ফিক্স ৩: আয়াত নম্বর মার্কার সাইজ কমানো
- `text-[15px] md:text-[17px]` → `text-[12px] md:text-[14px]` — টেক্সটের সাথে proportional

### ফাইল পরিবর্তন
1. `src/components/quran/ReadingView.tsx` — ফন্ট সাইজ, লাইন-হাইট, বিসমিল্লাহ ফিক্স
2. `src/components/quran/types.ts` — `CHARS_PER_LINE = 40`
3. সম্ভবত `src/components/TajweedText.tsx` — চেক করতে হবে text prop ঠিকমতো render হচ্ছে কিনা

