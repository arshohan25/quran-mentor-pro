
# Live Recitation কাজ না করার ফিক্স প্ল্যান

## সমস্যা (কেন এখন fail করছে)
1. `normalizeArabic()` খুব basic — Quran text-এর `ٱ`, extended tashkeel/waqf marks remove হচ্ছে না, তাই correct recitation-ও mismatch ধরা হচ্ছে।
2. `processedLengthRef` + `interimResults` লজিক transcript drift করছে; ভুল হলে index/flow নষ্ট হয়ে শুধু beep loop হয়।
3. ভুল detect হলে recovery weak — user correct করলেও matcher পুরোনো transcript state-এ আটকে যায়।
4. UI-তে current word খুব faint (`text-muted-foreground/20`), mobile-এ “দেখা যাচ্ছে না” মনে হয়।

## কী কী বদলানো হবে

### 1) Arabic matching engine hardening (`src/utils/arabicUtils.ts`)
- `normalizeArabic()` Quran-text friendly করা:
  - সব harakat + extended Quran marks remove (`\u0610-\u061A`, `\u064B-\u065F`, `\u0670`, `\u06D6-\u06ED`)
  - `ٱ/أ/إ/آ` → `ا`, `ى` → `ي`, `ة` → `ه`, `ؤ` → `و`, `ئ` → `ي`
  - tatweel/punctuation/extra spaces clean
- নতুন helper add:
  - `tokenizeArabicWords(text)`
  - `isArabicWordMatch(expected, spoken)` (normalized exact match + common form fallback)

### 2) Live recognition flow rewrite (`src/components/quran/LiveRecitationCheck.tsx`)
- `processedLengthRef` বাদ দিয়ে stable sequential matcher:
  - expected words list
  - recognized final tokens queue
  - সবসময় next expected word-এর সাথে compare
- `onresult` এ শুধু নতুন `final` results score হবে (interim শুধু display)।
- ভুল হলে:
  - `errorIndex` set
  - beep cooldown (rapid continuous beep বন্ধ)
  - index এগোবে না
- সঠিক বললে:
  - error clear
  - same point থেকে reveal continue
- completion: সব শব্দ match হলে success beep + `onComplete()`।

### 3) Visibility/UX fix (`src/components/quran/LiveRecitationCheck.tsx`)
- current target word readable highlight করা (faint pulse নয়)।
- unrevealed অংশ stronger placeholder style।
- ভুল শব্দে স্পষ্ট red mark + warning text persist until correction।
- speech error/permisson fallback inline message যোগ করা।

### 4) Hifz integration polish (`src/components/quran/HifzView.tsx`)
- active recitation block mobile-এ auto-scroll into view।
- recitation start/cancel এ state reset clean করা (error/transcript leak না থাকে)।
- hidden ayah practice trigger flow unchanged, কিন্তু restart behavior stable করা।

### 5) Regression compatibility (`src/pages/PracticePage.tsx`)
- updated normalization utility ব্যবহার করে existing practice compare flow consistent রাখা।

## টেকনিক্যাল ডিটেইলস
```text
Before:
fullTranscript + processedLength + interim rewrites
=> false mismatch + drift + beep loop

After:
onresult(new final segment only)
  -> tokenize
  -> compare token with expected[current]
     - match: reveal++, clear error
     - mismatch: set error, beep (cooldown), hold current
```

## টেস্ট প্ল্যান (implementation শেষে)
1. Surah 1 ayah 1 (`ٱللَّهِ` সহ) এ false mismatch না হওয়া।
2. ভুল হলে red mark + single warning beep + no forward progress।
3. সাথে সাথে correct করলে same point থেকে progress।
4. long ayah-এ continuous reveal stuck না হওয়া।
5. mobile viewport (384x655) এ recitation UI clearly visible থাকা।
